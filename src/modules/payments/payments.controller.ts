import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user, dto);
  }

  @Put(':id/status/:newStatus')
  updateStatus(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Param('newStatus') newStatus: string
  ) {
    return this.paymentsService.updateStatus(user, id, newStatus as PaymentStatus);
  }
}
