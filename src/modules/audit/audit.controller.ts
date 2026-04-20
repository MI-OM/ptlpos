import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.auditService.findAll(user.tenantId, {
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
      action,
      entity,
      entityId,
      userId,
      from,
      to,
    });
  }
}
