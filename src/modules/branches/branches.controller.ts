import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.branchesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.branchesService.findOne(user.tenantId, id);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user, dto);
  }

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Put(':id')
  update(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(user, id, dto);
  }

  @Roles(RoleName.ADMIN)
  @Delete(':id')
  delete(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.branchesService.delete(user, id);
  }
}
