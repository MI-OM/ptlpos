import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthContext) {
    return this.recipesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    return this.recipesService.findOne(user.tenantId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(user, id, dto);
  }
}
