import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthContext } from '../../core/types/request-context';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post('receive')
  receive(@CurrentUser() user: AuthContext, @Body() dto: ReceivePurchaseDto) {
    return this.purchasesService.receive(user, dto);
  }
}
