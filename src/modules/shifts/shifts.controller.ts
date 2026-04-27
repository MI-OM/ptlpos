import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { OpenShiftDto, CloseShiftDto, QueryShiftsDto } from './dto/create-shift.dto';
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
}
