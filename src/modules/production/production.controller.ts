import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthContext } from 'src/core/types/request-context';
import { RunProductionDto } from './dto/run-production.dto';
import { ProductionService } from './production.service';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('run')
  run(@CurrentUser() user: AuthContext, @Body() dto: RunProductionDto) {
    return this.productionService.run(user, dto);
  }
}
