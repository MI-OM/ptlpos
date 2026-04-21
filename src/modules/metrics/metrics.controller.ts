import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { MetricsService, HealthStatus } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ status: 200, description: 'Health status information' })
  @Get('health')
  getHealthStatus(): HealthStatus {
    return this.metricsService.getHealthStatus();
  }

  @ApiOperation({ summary: 'Get metrics summary' })
  @ApiResponse({ status: 200, description: 'Metrics summary' })
  @ApiQuery({ name: 'name', required: false, description: 'Metric name to filter by' })
  @ApiQuery({ name: 'duration', required: false, description: 'Duration in minutes (default: 5)' })
  @Get('summary')
  getMetricsSummary(
    @Query('name') name?: string,
    @Query('duration') duration?: string,
  ) {
    const durationMinutes = duration ? parseInt(duration, 10) : 5;
    
    if (name) {
      return {
        metric: name,
        summary: this.metricsService.getMetricSummary(name, durationMinutes),
      };
    }
    
    // Return summary for all available metrics
    const allMetrics = this.metricsService.getMetrics();
    const metricNames = [...new Set(allMetrics.map(m => m.name))];
    
    const summaries = metricNames.reduce((acc, metricName) => {
      acc[metricName] = this.metricsService.getMetricSummary(metricName, durationMinutes);
      return acc;
    }, {} as Record<string, any>);
    
    return {
      duration: durationMinutes,
      metrics: summaries,
    };
  }

  @ApiOperation({ summary: 'Get raw metrics data' })
  @ApiResponse({ status: 200, description: 'Raw metrics data' })
  @ApiQuery({ name: 'name', required: false, description: 'Metric name to filter by' })
  @Get()
  getMetrics(@Query('name') name?: string) {
    return {
      metrics: this.metricsService.getMetrics(name),
      timestamp: new Date(),
    };
  }
}
