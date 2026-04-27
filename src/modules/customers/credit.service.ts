import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, CreditTransactionType } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async addCredit(context: AuthContext, customerId: string, amount: number, note?: string) {
    return this.prisma.$transaction(async tx => {
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          tenantId: context.tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (amount <= 0) {
        throw new BadRequestException('Credit amount must be positive');
      }

      const newBalance = new Prisma.Decimal(customer.creditBalance).add(amount);

      const transaction = await tx.creditTransaction.create({
        data: {
          tenantId: context.tenantId,
          customerId,
          amount: new Prisma.Decimal(amount),
          balanceAfter: newBalance,
          type: CreditTransactionType.CREDIT,
          note,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          creditBalance: newBalance,
        },
      });

      return {
        transaction,
        newBalance,
      };
    });
  }

  async deductCredit(context: AuthContext, customerId: string, amount: number, referenceType?: string, referenceId?: string, note?: string) {
    return this.prisma.$transaction(async tx => {
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          tenantId: context.tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (amount <= 0) {
        throw new BadRequestException('Deduction amount must be positive');
      }

      if (new Prisma.Decimal(customer.creditBalance).lessThan(amount)) {
        throw new BadRequestException('Insufficient credit balance');
      }

      const newBalance = new Prisma.Decimal(customer.creditBalance).sub(amount);

      const transaction = await tx.creditTransaction.create({
        data: {
          tenantId: context.tenantId,
          customerId,
          amount: new Prisma.Decimal(amount),
          balanceAfter: newBalance,
          type: CreditTransactionType.DEBIT,
          referenceType,
          referenceId,
          note,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          creditBalance: newBalance,
        },
      });

      return {
        transaction,
        newBalance,
      };
    });
  }

  async getCreditBalance(context: AuthContext, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: context.tenantId,
      },
      select: {
        id: true,
        name: true,
        creditBalance: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async getCreditTransactions(context: AuthContext, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: context.tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const transactions = await this.prisma.creditTransaction.findMany({
      where: {
        customerId,
        tenantId: context.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return {
      customer,
      transactions,
    };
  }

  async adjustCredit(context: AuthContext, customerId: string, amount: number, note?: string) {
    return this.prisma.$transaction(async tx => {
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          tenantId: context.tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const newBalance = new Prisma.Decimal(customer.creditBalance).add(amount);

      const transaction = await tx.creditTransaction.create({
        data: {
          tenantId: context.tenantId,
          customerId,
          amount: new Prisma.Decimal(amount),
          balanceAfter: newBalance,
          type: CreditTransactionType.ADJUSTMENT,
          note: note || 'Manual adjustment',
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          creditBalance: newBalance,
        },
      });

      return {
        transaction,
        newBalance,
      };
    });
  }
}
