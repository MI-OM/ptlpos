import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(
    @CurrentUser() user: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.analyticsService.dashboard(user.tenantId, {
      from,
      to,
    });
  }
}
