import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { CreditService } from './credit.service';
import { RoleName } from '@prisma/client';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @ApiOperation({ summary: 'Add credit to customer account' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit added successfully',
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/credit/add')
  addCredit(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() body: { amount: number; note?: string }
  ) {
    return this.creditService.addCredit(user, id, body.amount, body.note);
  }

  @ApiOperation({ summary: 'Deduct credit from customer account' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit deducted successfully',
  })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post(':id/credit/deduct')
  deductCredit(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() body: { amount: number; referenceType?: string; referenceId?: string; note?: string }
  ) {
    return this.creditService.deductCredit(
      user,
      id,
      body.amount,
      body.referenceType,
      body.referenceId,
      body.note
    );
  }

  @ApiOperation({ summary: 'Adjust customer credit balance' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit adjusted successfully',
  })
  @Roles(RoleName.ADMIN)
  @Post(':id/credit/adjust')
  adjustCredit(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() body: { amount: number; note?: string }
  ) {
    return this.creditService.adjustCredit(user, id, body.amount, body.note);
  }

  @ApiOperation({ summary: 'Get customer credit balance' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit balance retrieved',
  })
  @Get(':id/credit')
  getCreditBalance(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.creditService.getCreditBalance(user, id);
  }

  @ApiOperation({ summary: 'Get customer credit transaction history' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit transactions retrieved',
  })
  @Get(':id/credit/transactions')
  getCreditTransactions(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.creditService.getCreditTransactions(user, id);
  }
}
