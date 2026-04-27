import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';

@Module({
  controllers: [CustomersController, CreditController],
  providers: [CustomersService, CreditService],
  exports: [CustomersService, CreditService],
})
export class CustomersModule {}
