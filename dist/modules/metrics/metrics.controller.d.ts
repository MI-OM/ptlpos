import { MetricsService, HealthStatus } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    getHealthStatus(): HealthStatus;
    getMetricsSummary(name?: string, duration?: string): {
        metric: string;
        summary: {
            count: number;
            sum: number;
            avg: number;
            min: number;
            max: number;
            duration: number;
            timestamp: Date;
        };
        duration?: undefined;
        metrics?: undefined;
    } | {
        duration: number;
        metrics: Record<string, any>;
        metric?: undefined;
        summary?: undefined;
    };
    getMetrics(name?: string): {
        metrics: import("./metrics.service").MetricData[];
        timestamp: Date;
    };
}
