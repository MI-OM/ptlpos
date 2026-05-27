import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'List all available roles' })
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }
}
