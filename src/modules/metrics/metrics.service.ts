import { Injectable } from '@nestjs/common';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    database: boolean;
    redis: boolean;
    memory: boolean;
    cpu: boolean;
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    activeConnections: number;
  };
}

@Injectable()
export class MetricsService {
  private metrics: Map<string, MetricData[]> = new Map();
  private startTime: Date = new Date();

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only last 1000 metrics per name to prevent memory leaks
    if (metricArray.length > 1000) {
      metricArray.shift();
    }
  }

  getMetrics(name?: string): MetricData[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: MetricData[] = [];
    for (const metricArray of this.metrics.values()) {
      allMetrics.push(...metricArray);
    }
    return allMetrics;
  }

  getMetricSummary(name: string, durationMinutes: number = 5) {
    const metrics = this.getMetrics(name);
    const cutoffTime = new Date(Date.now() - durationMinutes * 60 * 1000);
    
    const recentMetrics = metrics.filter(m => m.timestamp >= cutoffTime);
    
    if (recentMetrics.length === 0) {
      return null;
    }

    const values = recentMetrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: recentMetrics.length,
      sum,
      avg,
      min,
      max,
      duration: durationMinutes,
      timestamp: new Date(),
    };
  }

  getHealthStatus(): HealthStatus {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime.getTime();
    
    // Simple health checks (in a real implementation, these would check actual services)
    const checks = {
      database: true, // Would check database connectivity
      redis: true,    // Would check Redis connectivity
      memory: memUsage.heapUsed < memUsage.heapTotal * 0.9,
      cpu: true,      // Would check CPU usage
    };

    const overallStatus = Object.values(checks).every(check => check) 
      ? 'healthy' 
      : Object.values(checks).some(check => check) 
        ? 'degraded' 
        : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      metrics: {
        uptime: Math.floor(uptime / 1000),
        memoryUsage: memUsage.heapUsed,
        activeConnections: 0, // Would track actual connections
      },
    };
  }

  incrementCounter(name: string, tags?: Record<string, string>) {
    const currentMetrics = this.getMetrics(name);
    const lastValue = currentMetrics.length > 0 ? currentMetrics[currentMetrics.length - 1].value : 0;
    this.recordMetric(name, lastValue + 1, tags);
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>) {
    this.recordMetric(name, value, tags);
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    this.recordMetric(name, value, tags);
  }

  // Business-specific metrics
  recordSale(amount: number, tags?: Record<string, string>) {
    this.recordMetric('sale_amount', amount, tags);
    this.incrementCounter('sales_count', tags);
  }

  recordProductView(productId: string, tags?: Record<string, string>) {
    this.incrementCounter('product_views', { ...tags, product_id: productId });
  }

  recordApiRequest(endpoint: string, method: string, statusCode: number, responseTime: number) {
    this.recordHistogram('api_response_time', responseTime, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
    this.incrementCounter('api_requests', {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
  }

  recordError(errorType: string, message: string, tags?: Record<string, string>) {
    this.incrementCounter('errors', {
      ...tags,
      error_type: errorType,
      message: message.substring(0, 100), // Truncate long messages
    });
  }
}
