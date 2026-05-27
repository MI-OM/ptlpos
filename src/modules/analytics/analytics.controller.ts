import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get dashboard analytics' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
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
