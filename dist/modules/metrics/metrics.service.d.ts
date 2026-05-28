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
export declare class MetricsService {
    private metrics;
    private startTime;
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    getMetrics(name?: string): MetricData[];
    getMetricSummary(name: string, durationMinutes?: number): {
        count: number;
        sum: number;
        avg: number;
        min: number;
        max: number;
        duration: number;
        timestamp: Date;
    };
    getHealthStatus(): HealthStatus;
    incrementCounter(name: string, tags?: Record<string, string>): void;
    recordGauge(name: string, value: number, tags?: Record<string, string>): void;
    recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
    recordSale(amount: number, tags?: Record<string, string>): void;
    recordProductView(productId: string, tags?: Record<string, string>): void;
    recordApiRequest(endpoint: string, method: string, statusCode: number, responseTime: number): void;
    recordError(errorType: string, message: string, tags?: Record<string, string>): void;
}
