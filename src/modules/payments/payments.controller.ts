import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentStatus, RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Get('reconciliation')
  reconciliation(
    @CurrentUser() user: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.paymentsService.reconciliation(user.tenantId, {
      from,
      to,
    });
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Get('cash-drawer')
  cashDrawerSummary(
    @CurrentUser() user: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('countedCash') countedCash?: string
  ) {
    return this.paymentsService.cashDrawerSummary(user.tenantId, {
      from,
      to,
      countedCash: countedCash === undefined ? undefined : Number(countedCash),
      branchId: user.branchId,
    });
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Get('by-status/:status')
  findByStatus(
    @CurrentUser() user: AuthContext,
    @Param('status') status: string,
    @Query('limit') limit?: string
  ) {
    return this.paymentsService.findByStatus(
      user.tenantId,
      status as PaymentStatus,
      limit ? parseInt(limit) : 50
    );
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Put(':id/status/:newStatus')
  updateStatus(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('newStatus') newStatus: string
  ) {
    return this.paymentsService.updateStatus(user, id, newStatus as PaymentStatus);
  }
}
