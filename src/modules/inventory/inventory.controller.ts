import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CreateStocktakeDto, RecordStocktakeCountsDto } from './dto/stocktake.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.inventoryService.findAll(user.tenantId, user.branchId);
  }

  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, example: 10, description: 'Minimum stock threshold (default: 10)' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  @Get('low-stock')
  lowStock(@CurrentUser() user: AuthContext, @Query('threshold') threshold?: string) {
    return this.inventoryService.lowStock(user.tenantId, Number(threshold ?? 10), user.branchId);
  }

  @ApiOperation({ summary: 'Get inventory alerts' })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean, example: false, description: 'Filter by resolved status' })
  @ApiResponse({ status: 200, description: 'Inventory alerts retrieved successfully' })
  @Get('alerts')
  getAlerts(@CurrentUser() user: AuthContext, @Query('resolved') resolved?: string) {
    const isResolved = resolved === 'true';
    return this.inventoryService.getAlerts(user.tenantId, isResolved);
  }

  @ApiOperation({ summary: 'Check and create inventory alerts' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, example: 10, description: 'Minimum stock threshold (default: 10)' })
  @ApiResponse({ status: 200, description: 'Alerts checked and created successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('alerts/check')
  checkAlerts(@CurrentUser() user: AuthContext, @Query('threshold') threshold?: string) {
    return this.inventoryService.checkAndCreateAlerts(user.tenantId, Number(threshold ?? 10));
  }

  @ApiOperation({ summary: 'Resolve an inventory alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('alerts/:id/resolve')
  resolveAlert(@CurrentUser() user: AuthContext, @Param('id') alertId: string) {
    return this.inventoryService.resolveAlert(user.tenantId, alertId);
  }

  @ApiOperation({ summary: 'Get inventory movement history' })
  @ApiQuery({ name: 'productId', required: false, type: String, example: 'prod-123', description: 'Filter by product ID' })
  @ApiResponse({ status: 200, description: 'Inventory history retrieved successfully' })
  @Get('history')
  history(@CurrentUser() user: AuthContext, @Query('productId') productId?: string) {
    return this.inventoryService.history(user.tenantId, productId, user.branchId);
  }

  @ApiOperation({ summary: 'Get inventory valuation' })
  @ApiResponse({ status: 200, description: 'Inventory valuation retrieved successfully' })
  @Get('valuation')
  valuation(@CurrentUser() user: AuthContext) {
    return this.inventoryService.valuation(user.tenantId, user.branchId);
  }

  @ApiOperation({ summary: 'Adjust inventory quantity' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('adjust')
  adjust(@CurrentUser() user: AuthContext, @Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(user, dto);
  }

  @ApiOperation({ summary: 'Transfer inventory between branches' })
  @ApiResponse({ status: 200, description: 'Inventory transferred successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('transfers')
  transfer(@CurrentUser() user: AuthContext, @Body() dto: TransferInventoryDto) {
    return this.inventoryService.transfer(user, dto);
  }

  @ApiOperation({ summary: 'Create a new stocktake' })
  @ApiResponse({ status: 201, description: 'Stocktake created successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes')
  createStocktake(@CurrentUser() user: AuthContext, @Body() dto: CreateStocktakeDto) {
    return this.inventoryService.createStocktake(user, dto);
  }

  @ApiOperation({ summary: 'List all stocktakes' })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'IN_PROGRESS', description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Stocktakes retrieved successfully' })
  @Get('stocktakes')
  listStocktakes(@CurrentUser() user: AuthContext, @Query('status') status?: string) {
    return this.inventoryService.listStocktakes(user.tenantId, status as any);
  }

  @ApiOperation({ summary: 'Get stocktake details' })
  @ApiParam({ name: 'id', description: 'Stocktake ID' })
  @ApiResponse({ status: 200, description: 'Stocktake retrieved successfully' })
  @Get('stocktakes/:id')
  getStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.getStocktake(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Start a stocktake' })
  @ApiParam({ name: 'id', description: 'Stocktake ID' })
  @ApiResponse({ status: 200, description: 'Stocktake started successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/start')
  startStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.startStocktake(user, id);
  }

  @ApiOperation({ summary: 'Cancel a stocktake' })
  @ApiParam({ name: 'id', description: 'Stocktake ID' })
  @ApiResponse({ status: 200, description: 'Stocktake cancelled successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/cancel')
  cancelStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.cancelStocktake(user, id);
  }

  @ApiOperation({ summary: 'Record stocktake counts' })
  @ApiParam({ name: 'id', description: 'Stocktake ID' })
  @ApiResponse({ status: 200, description: 'Stocktake counts recorded successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/record-counts')
  recordCounts(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: RecordStocktakeCountsDto
  ) {
    return this.inventoryService.recordStocktakeCounts(user, id, dto);
  }

  @ApiOperation({ summary: 'Complete a stocktake' })
  @ApiParam({ name: 'id', description: 'Stocktake ID' })
  @ApiResponse({ status: 200, description: 'Stocktake completed successfully' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('stocktakes/:id/complete')
  completeStocktake(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.completeStocktake(user, id);
  }

  @ApiOperation({ summary: 'Apply stocktake adjustments to inventory' })
  @ApiParam({ name: 'id', description: 'Stocktake ID' })
  @ApiResponse({ status: 200, description: 'Adjustments applied successfully' })
  @Roles(RoleName.ADMIN)
  @Post('stocktakes/:id/apply')
  applyAdjustments(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.inventoryService.applyStocktakeAdjustments(user, id);
  }
}
