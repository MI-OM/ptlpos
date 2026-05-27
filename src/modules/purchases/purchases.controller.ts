import { Body, Controller, Post } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuthContext } from '../../core/types/request-context';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @Post('receive')
  receive(@CurrentUser() user: AuthContext, @Body() dto: ReceivePurchaseDto) {
    return this.purchasesService.receive(user, dto);
  }
}
