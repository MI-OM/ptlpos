import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { OpenShiftDto, CloseShiftDto, QueryShiftsDto } from './dto/create-shift.dto';
import { ReconcileShiftDto } from './dto/reconcile-shift.dto';
import { EndOfDayReportQueryDto, EndOfShiftReportQueryDto, SalesPerformanceQueryDto } from './dto/report-query.dto';
import { ShiftsService } from './shifts.service';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @ApiOperation({ summary: 'Open a new shift' })
  @ApiResponse({
    status: 201,
    description: 'Shift opened successfully',
  })
  @Post('open')
  openShift(@CurrentUser() user: AuthContext, @Body() dto: OpenShiftDto) {
    return this.shiftsService.openShift(user, dto);
  }

  @ApiOperation({ summary: 'Close an open shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift closed successfully',
  })
  @Post(':id/close')
  closeShift(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.shiftsService.closeShift(user, id, dto);
  }

  @ApiOperation({ summary: 'Get active shift for current user' })
  @ApiResponse({
    status: 200,
    description: 'Active shift details',
  })
  @Get('active')
  getActiveShift(@CurrentUser() user: AuthContext) {
    return this.shiftsService.getActiveShift(user);
  }

  @ApiOperation({ summary: 'List all shifts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of shifts with pagination',
  })
  @Get()
  findAll(@CurrentUser() user: AuthContext, @Query() query: QueryShiftsDto) {
    return this.shiftsService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift details',
  })
  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.shiftsService.findOne(user, id);
  }

  @ApiOperation({ summary: 'Get cash drawer summary for active shift' })
  @ApiResponse({
    status: 200,
    description: 'Cash drawer summary',
  })
  @Get('cash-drawer/summary')
  getCashDrawerSummary(@CurrentUser() user: AuthContext) {
    return this.shiftsService.getCashDrawerSummary(user);
  }

  @ApiOperation({ summary: 'Reconcile shift drawer' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift reconciled successfully',
  })
  @Post(':id/reconcile')
  reconcileShift(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: ReconcileShiftDto) {
    return this.shiftsService.reconcileShift(user, id, dto);
  }

  @ApiOperation({ summary: 'Get end of day report' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({
    status: 200,
    description: 'End of day report',
  })
  @Get('reports/end-of-day')
  getEndOfDayReport(@CurrentUser() user: AuthContext, @Query() query: EndOfDayReportQueryDto) {
    return this.shiftsService.getEndOfDayReport(user, query.date, query.branchId);
  }

  @ApiOperation({ summary: 'Get end of shift report' })
  @ApiQuery({ name: 'shiftId', required: true })
  @ApiResponse({
    status: 200,
    description: 'End of shift report',
  })
  @Get('reports/end-of-shift')
  getEndOfShiftReport(@CurrentUser() user: AuthContext, @Query() query: EndOfShiftReportQueryDto) {
    return this.shiftsService.getEndOfShiftReport(user, query.shiftId);
  }

  @ApiOperation({ summary: 'Get sales performance report' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Sales performance report',
  })
  @Get('reports/sales-performance')
  getSalesPerformance(@CurrentUser() user: AuthContext, @Query() query: SalesPerformanceQueryDto) {
    return this.shiftsService.getSalesPerformance(user, query.userId, query.from, query.to, query.branchId);
  }
}
