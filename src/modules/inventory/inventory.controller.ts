import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateStocktakeDto, RecordStocktakeCountsDto } from './dto/stocktake.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.inventoryService.findAll(user.tenantId, user.branchId);
  }

  @Get('low-stock')
  lowStock(@CurrentUser() user: AuthContext, @Query('threshold') threshold?: string) {
    return this.inventoryService.lowStock(user.tenantId, Number(threshold ?? 10), user.branchId);
  }

  @Get('alerts')
  getAlerts(@CurrentUser() user: AuthContext, @Query('resolved') resolved?: string) {
    const isResolved = resolved === 'true';
    return this.inventoryService.getAlerts(user.tenantId, isResolved);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('alerts/check')
  checkAlerts(@CurrentUser() user: AuthContext, @Query('threshold') threshold?: string) {
    return this.inventoryService.checkAndCreateAlerts(user.tenantId, Number(threshold ?? 10));
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('alerts/:id/resolve')
  resolveAlert(@CurrentUser() user: AuthContext, @Param('id') alertId: string) {
    return this.inventoryService.resolveAlert(user.tenantId, alertId);
  }

  @Get('history')
  history(@CurrentUser() user: AuthContext, @Query('productId') productId?: string) {
    return this.inventoryService.history(user.tenantId, productId, user.branchId);
  }

  @Get('valuation')
  valuation(@CurrentUser() user: AuthContext) {
    return this.inventoryService.valuation(user.tenantId, user.branchId);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('adjust')
  adjust(@CurrentUser() user: AuthContext, @Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(user, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('transfers')
  transfer(@CurrentUser() user: AuthContext, @Body() dto: TransferInventoryDto) {
    return this.inventoryService.transfer(user, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes')
  createStocktake(@CurrentUser() user: AuthContext, @Body() dto: CreateStocktakeDto) {
    return this.inventoryService.createStocktake(user, dto);
  }

  @Get('stocktakes')
  listStocktakes(@CurrentUser() user: AuthContext, @Query('status') status?: string) {
    return this.inventoryService.listStocktakes(user.tenantId, status as any);
  }

  @Get('stocktakes/:id')
  getStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.getStocktake(user.tenantId, id);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/start')
  startStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.startStocktake(user, id);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/cancel')
  cancelStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.cancelStocktake(user, id);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/record-counts')
  recordCounts(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: RecordStocktakeCountsDto
  ) {
    return this.inventoryService.recordStocktakeCounts(user, id, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/complete')
  completeStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.completeStocktake(user, id);
  }

  @Roles(RoleName.ADMIN)
  @Post('stocktakes/:id/apply')
  applyAdjustments(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.applyStocktakeAdjustments(user, id);
  }
}
