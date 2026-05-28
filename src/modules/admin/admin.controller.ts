import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminJwtAuthGuard } from '../../core/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../core/guards/admin-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tenants')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async getTenants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTenants({
      page: page || 1,
      limit: limit || 20,
      status,
      search,
    });
  }

  @Get('tenants/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant details retrieved' })
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenant(id);
  }

  @Put('tenants/:id/status')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tenant status' })
  @ApiResponse({ status: 200, description: 'Tenant status updated' })
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() updateTenantStatusDto: UpdateTenantStatusDto,
  ) {
    return this.adminService.updateTenantStatus(id, updateTenantStatusDto);
  }

  @Get('tenants/:id/usage')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get tenant usage metrics' })
  @ApiResponse({ status: 200, description: 'Usage metrics retrieved' })
  async getTenantUsage(@Param('id') id: string) {
    return this.adminService.getTenantUsage(id);
  }

  @Get('plans')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Get('plans/:id')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('id') id: string) {
    return this.adminService.getPlan(id);
  }

  @Post('plans')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Create new subscription plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  async createPlan(@Body() createPlanDto: CreateSubscriptionDto) {
    return this.adminService.createPlan(createPlanDto);
  }

  @Put('plans/:id')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  @Get('subscriptions')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getSubscriptions({
      page: page || 1,
      limit: limit || 20,
      status,
    });
  }

  @Get('subscriptions/:id')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(@Param('id') id: string) {
    return this.adminService.getSubscription(id);
  }

  @Put('subscriptions/:id')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Change tenant subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  async changeSubscription(
    @Param('id') id: string,
    @Body() changeSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.adminService.changeSubscription(id, changeSubscriptionDto);
  }

  @Post('subscriptions/:id/cancel')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Cancel tenant subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(@Param('id') id: string) {
    return this.adminService.cancelSubscription(id);
  }

  @Get('tickets')
  @Roles('SUPER_ADMIN', 'SUPPORT_ADMIN')
  @ApiOperation({ summary: 'Get support tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.adminService.getTickets({
      page: page || 1,
      limit: limit || 20,
      status,
      assignedTo,
    });
  }

  @Get('tickets/:id')
  @Roles('SUPER_ADMIN', 'SUPPORT_ADMIN')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiResponse({ status: 200, description: 'Ticket details retrieved' })
  async getTicket(@Param('id') id: string) {
    return this.adminService.getTicket(id);
  }

  @Post('tickets')
  @Roles('SUPER_ADMIN', 'SUPPORT_ADMIN')
  @ApiOperation({ summary: 'Create support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(@Body() createTicketDto: CreateSupportTicketDto) {
    return this.adminService.createTicket(createTicketDto);
  }

  @Put('tickets/:id/assign')
  @Roles('SUPER_ADMIN', 'SUPPORT_ADMIN')
  @ApiOperation({ summary: 'Assign ticket to admin' })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assignTicket(
    @Param('id') id: string,
    @Body() assignTicketDto: AssignTicketDto,
  ) {
    return this.adminService.assignTicket(id, assignTicketDto);
  }

  @Put('tickets/:id/status')
  @Roles('SUPER_ADMIN', 'SUPPORT_ADMIN')
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: { status: string; note?: string },
  ) {
    return this.adminService.updateTicketStatus(id, updateStatusDto);
  }

  @Get('analytics/overview')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get system overview analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('analytics/usage')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get usage analytics' })
  @ApiResponse({ status: 200, description: 'Usage analytics retrieved' })
  async getUsageAnalytics(
    @Query('period') period?: string,
  ) {
    return this.adminService.getUsageAnalytics(period || '30d');
  }

  @Get('analytics/revenue')
  @Roles('SUPER_ADMIN', 'BILLING_ADMIN')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved' })
  async getRevenueAnalytics(
    @Query('period') period?: string,
  ) {
    return this.adminService.getRevenueAnalytics(period || '30d');
  }
}
