import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { RunProductionDto } from './dto/run-production.dto';
import { ProductionService } from './production.service';

@ApiTags('production')
@ApiBearerAuth()
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('run')
  @ApiOperation({ summary: 'Run a production batch' })
  @ApiResponse({ status: 201, description: 'Production batch created successfully' })
  run(@CurrentUser() user: AuthContext, @Body() dto: RunProductionDto) {
    return this.productionService.run(user, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get production orders' })
  @ApiResponse({ status: 200, description: 'Production orders retrieved successfully' })
  getOrders(@CurrentUser() user: AuthContext) {
    return this.productionService.getOrders(user);
  }

  @Get('recipes')
  @ApiOperation({ summary: 'Get all production recipes with cost and margin calculations' })
  @ApiResponse({ status: 200, description: 'Production recipes retrieved successfully' })
  getRecipes(@CurrentUser() user: AuthContext) {
    return this.productionService.getRecipes(user);
  }

  @Get('materials')
  @ApiOperation({ summary: 'Get production materials' })
  @ApiResponse({ status: 200, description: 'Production materials retrieved successfully' })
  getMaterials(@CurrentUser() user: AuthContext) {
    return this.productionService.getMaterials(user);
  }

  @Get('machines')
  @ApiOperation({ summary: 'Get production machines' })
  @ApiResponse({ status: 200, description: 'Production machines retrieved successfully' })
  getMachines(@CurrentUser() user: AuthContext) {
    return this.productionService.getMachines(user);
  }
}
