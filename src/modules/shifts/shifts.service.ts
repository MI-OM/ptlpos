import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { OpenShiftDto, CloseShiftDto, QueryShiftsDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async openShift(context: AuthContext, dto: OpenShiftDto) {
    const existingOpenShift = await this.prisma.shift.findFirst({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingOpenShift) {
      throw new BadRequestException('You already have an open shift. Close it first before opening a new one.');
    }

    const shift = await this.prisma.shift.create({
      data: {
        tenantId: context.tenantId,
        branchId: context.branchId,
        userId: context.userId,
        openingBalance: new Prisma.Decimal(dto.openingBalance),
        notes: dto.notes,
        status: ShiftStatus.OPEN,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: shift.id,
      user: shift.user,
      branch: shift.branch,
      openedAt: shift.openedAt,
      openingBalance: shift.openingBalance,
      status: shift.status,
      notes: shift.notes,
    };
  }

  async closeShift(context: AuthContext, shiftId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId: context.tenantId,
        userId: context.userId,
        status: ShiftStatus.OPEN,
      },
      include: {
        sales: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            payments: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Open shift not found');
    }

    let cashSales = new Prisma.Decimal(0);
    let cardSales = new Prisma.Decimal(0);
    let otherSales = new Prisma.Decimal(0);

    for (const sale of shift.sales) {
      for (const payment of sale.payments) {
        if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
          if (payment.method === 'CASH') {
            cashSales = cashSales.add(payment.amount);
          } else if (payment.method === 'CARD') {
            cardSales = cardSales.add(payment.amount);
          } else {
            otherSales = otherSales.add(payment.amount);
          }
        }
      }
    }

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        closedAt: new Date(),
        closingBalance: new Prisma.Decimal(dto.closingBalance),
        cashSales,
        cardSales,
        otherSales,
        notes: dto.notes || shift.notes,
        status: ShiftStatus.CLOSED,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: updatedShift.id,
      user: updatedShift.user,
      branch: updatedShift.branch,
      openedAt: updatedShift.openedAt,
      closedAt: updatedShift.closedAt,
      openingBalance: updatedShift.openingBalance,
      closingBalance: updatedShift.closingBalance,
      cashSales: updatedShift.cashSales,
      cardSales: updatedShift.cardSales,
      otherSales: updatedShift.otherSales,
      totalSales: updatedShift.cashSales.add(updatedShift.cardSales).add(updatedShift.otherSales),
      status: updatedShift.status,
      notes: updatedShift.notes,
    };
  }

  async getActiveShift(context: AuthContext) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        status: ShiftStatus.OPEN,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        sales: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            payments: true,
          },
        },
      },
    });

    if (!shift) {
      return null;
    }

    let cashSales = new Prisma.Decimal(0);
    let cardSales = new Prisma.Decimal(0);
    let otherSales = new Prisma.Decimal(0);

    for (const sale of shift.sales) {
      for (const payment of sale.payments) {
        if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
          if (payment.method === 'CASH') {
            cashSales = cashSales.add(payment.amount);
          } else if (payment.method === 'CARD') {
            cardSales = cardSales.add(payment.amount);
          } else {
            otherSales = otherSales.add(payment.amount);
          }
        }
      }
    }

    return {
      id: shift.id,
      user: shift.user,
      branch: shift.branch,
      openedAt: shift.openedAt,
      openingBalance: shift.openingBalance,
      cashSales,
      cardSales,
      otherSales,
      totalSales: cashSales.add(cardSales).add(otherSales),
      status: shift.status,
      notes: shift.notes,
      salesCount: shift.sales.length,
    };
  }

  async findAll(context: AuthContext, query: QueryShiftsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where: {
          tenantId: context.tenantId,
          ...(context.branchId ? { branchId: context.branchId } : {}),
        },
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.shift.count({
        where: {
          tenantId: context.tenantId,
          ...(context.branchId ? { branchId: context.branchId } : {}),
        },
      }),
    ]);

    return {
      data: shifts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(context: AuthContext, shiftId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId: context.tenantId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        sales: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return shift;
  }

  async getCashDrawerSummary(context: AuthContext) {
    const shift = await this.getActiveShift(context);

    return {
      shiftId: shift.id,
      openedAt: shift.openedAt,
      openingBalance: shift.openingBalance,
      cashSales: shift.cashSales,
      cardSales: shift.cardSales,
      otherSales: shift.otherSales,
      totalSales: shift.totalSales,
      salesCount: shift.salesCount,
      status: shift.status,
      user: shift.user,
      branch: shift.branch,
    };
  }
}
