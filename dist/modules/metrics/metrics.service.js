"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
let MetricsService = class MetricsService {
    metrics = new Map();
    startTime = new Date();
    recordMetric(name, value, tags) {
        const metric = {
            name,
            value,
            tags,
            timestamp: new Date(),
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metricArray = this.metrics.get(name);
        metricArray.push(metric);
        if (metricArray.length > 1000) {
            metricArray.shift();
        }
    }
    getMetrics(name) {
        if (name) {
            return this.metrics.get(name) || [];
        }
        const allMetrics = [];
        for (const metricArray of this.metrics.values()) {
            allMetrics.push(...metricArray);
        }
        return allMetrics;
    }
    getMetricSummary(name, durationMinutes = 5) {
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
    getHealthStatus() {
        const memUsage = process.memoryUsage();
        const uptime = Date.now() - this.startTime.getTime();
        const checks = {
            database: true,
            redis: true,
            memory: memUsage.heapUsed < memUsage.heapTotal * 0.9,
            cpu: true,
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
                activeConnections: 0,
            },
        };
    }
    incrementCounter(name, tags) {
        const currentMetrics = this.getMetrics(name);
        const lastValue = currentMetrics.length > 0 ? currentMetrics[currentMetrics.length - 1].value : 0;
        this.recordMetric(name, lastValue + 1, tags);
    }
    recordGauge(name, value, tags) {
        this.recordMetric(name, value, tags);
    }
    recordHistogram(name, value, tags) {
        this.recordMetric(name, value, tags);
    }
    recordSale(amount, tags) {
        this.recordMetric('sale_amount', amount, tags);
        this.incrementCounter('sales_count', tags);
    }
    recordProductView(productId, tags) {
        this.incrementCounter('product_views', { ...tags, product_id: productId });
    }
    recordApiRequest(endpoint, method, statusCode, responseTime) {
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
    recordError(errorType, message, tags) {
        this.incrementCounter('errors', {
            ...tags,
            error_type: errorType,
            message: message.substring(0, 100),
        });
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
//# sourceMappingURL=metrics.service.js.map