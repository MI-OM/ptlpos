import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShiftStatus, DrawerType, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { AuthContext } from '../../core/types/request-context';
import { OpenShiftDto, CloseShiftDto, QueryShiftsDto } from './dto/create-shift.dto';
import { ReconcileShiftDto } from './dto/reconcile-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
        drawerType: dto.drawerType || DrawerType.OFFLINE,
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
      drawerType: shift.drawerType,
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

    const closingBalance = new Prisma.Decimal(dto.closingBalance);
    const discrepancy = closingBalance.sub(shift.openingBalance).sub(cashSales);

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        closedAt: new Date(),
        closingBalance,
        cashSales,
        cardSales,
        otherSales,
        offlineDrawerBalance: shift.drawerType === DrawerType.OFFLINE || shift.drawerType === DrawerType.MIXED ? closingBalance : null,
        onlineDrawerBalance: shift.drawerType === DrawerType.ONLINE || shift.drawerType === DrawerType.MIXED ? cardSales : null,
        discrepancy,
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
      drawerType: updatedShift.drawerType,
      cashSales: updatedShift.cashSales,
      cardSales: updatedShift.cardSales,
      otherSales: updatedShift.otherSales,
      totalSales: updatedShift.cashSales.add(updatedShift.cardSales).add(updatedShift.otherSales),
      discrepancy: updatedShift.discrepancy,
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

  async reconcileShift(context: AuthContext, shiftId: string, dto: ReconcileShiftDto) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId: context.tenantId,
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
      throw new NotFoundException('Shift not found');
    }

    // Calculate expected amounts from payments
    let expectedCash = new Prisma.Decimal(0);
    let expectedCard = new Prisma.Decimal(0);
    let expectedTransfer = new Prisma.Decimal(0);
    let expectedMobile = new Prisma.Decimal(0);

    for (const sale of shift.sales) {
      for (const payment of sale.payments) {
        if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
          if (payment.method === 'CASH') {
            expectedCash = expectedCash.add(payment.amount);
          } else if (payment.method === 'CARD') {
            expectedCard = expectedCard.add(payment.amount);
          } else if (payment.method === 'TRANSFER') {
            expectedTransfer = expectedTransfer.add(payment.amount);
          }
        }
      }
    }

    const actualCash = new Prisma.Decimal(dto.actualCash);
    const actualCard = dto.actualCard ? new Prisma.Decimal(dto.actualCard) : expectedCard;
    const actualTransfer = dto.actualTransfer ? new Prisma.Decimal(dto.actualTransfer) : expectedTransfer;
    const actualMobile = dto.actualMobile ? new Prisma.Decimal(dto.actualMobile) : new Prisma.Decimal(0);

    const expectedTotal = expectedCash.add(expectedCard).add(expectedTransfer).add(new Prisma.Decimal(0));
    const actualTotal = actualCash.add(actualCard).add(actualTransfer).add(actualMobile);

    const cashDiscrepancy = actualCash.sub(expectedCash);
    const cardDiscrepancy = actualCard.sub(expectedCard);
    const transferDiscrepancy = actualTransfer.sub(expectedTransfer);
    const mobileDiscrepancy = actualMobile.sub(new Prisma.Decimal(0));
    const totalDiscrepancy = actualTotal.sub(expectedTotal);

    const reconciliation = await this.prisma.shiftReconciliation.create({
      data: {
        tenantId: context.tenantId,
        shiftId: shiftId,
        expectedCash,
        expectedCard,
        expectedTransfer,
        expectedMobile: new Prisma.Decimal(0),
        expectedTotal,
        actualCash,
        actualCard,
        actualTransfer,
        actualMobile,
        actualTotal,
        cashDiscrepancy,
        cardDiscrepancy,
        transferDiscrepancy,
        mobileDiscrepancy,
        totalDiscrepancy,
        notes: dto.notes,
        reconciledBy: context.userId,
        reconciledAt: new Date(),
      },
    });

    // Update shift with actual cash count and discrepancy
    await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        actualCashCount: actualCash,
        discrepancy: totalDiscrepancy,
      },
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'SHIFT_RECONCILED',
      entity: 'Shift',
      entityId: shiftId,
      metadata: {
        expectedTotal: expectedTotal.toNumber(),
        actualTotal: actualTotal.toNumber(),
        discrepancy: totalDiscrepancy.toNumber(),
        notes: dto.notes,
      },
    });

    return reconciliation;
  }

  async getEndOfDayReport(context: AuthContext, date?: string, branchId?: string) {
    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await this.prisma.shift.findMany({
      where: {
        tenantId: context.tenantId,
        ...(branchId ? { branchId } : {}),
        openedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
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
        reconciliations: true,
      },
      orderBy: {
        openedAt: 'asc',
      },
    });

    const shiftReports = shifts.map((shift) => {
      let totalSales = new Prisma.Decimal(0);
      let totalRevenue = new Prisma.Decimal(0);
      let totalRefunds = 0;
      let totalRefundAmount = new Prisma.Decimal(0);
      let cashPayments = new Prisma.Decimal(0);
      let cardPayments = new Prisma.Decimal(0);
      let transferPayments = new Prisma.Decimal(0);
      let mobilePayments = new Prisma.Decimal(0);

      for (const sale of shift.sales) {
        if (sale.status === 'COMPLETED') {
          totalSales = totalSales.add(1);
          totalRevenue = totalRevenue.add(sale.totalAmount);

          for (const payment of sale.payments) {
            if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
              if (payment.method === 'CASH') {
                cashPayments = cashPayments.add(payment.amount);
              } else if (payment.method === 'CARD') {
                cardPayments = cardPayments.add(payment.amount);
              } else if (payment.method === 'TRANSFER') {
                transferPayments = transferPayments.add(payment.amount);
              }
            }
          }
        } else if (sale.status === 'REFUNDED') {
          totalRefunds = totalRefunds + 1;
          totalRefundAmount = totalRefundAmount.add(sale.totalAmount);
        }
      }

      const latestReconciliation = shift.reconciliations[shift.reconciliations.length - 1];

      return {
        shiftId: shift.id,
        userId: shift.user.id,
        userName: shift.user.name,
        branchId: shift.branch?.id,
        branchName: shift.branch?.name,
        openTime: shift.openedAt,
        closeTime: shift.closedAt,
        sales: {
          totalSales: totalSales.toNumber(),
          totalRevenue: totalRevenue.toNumber(),
          totalRefunds,
          totalRefundAmount: totalRefundAmount.toNumber(),
        },
        payments: {
          cash: cashPayments.toNumber(),
          card: cardPayments.toNumber(),
          transfer: transferPayments.toNumber(),
          mobile: mobilePayments.toNumber(),
          storeCredit: new Prisma.Decimal(0).toNumber(),
        },
        drawer: {
          openingBalance: shift.openingBalance.toNumber(),
          expectedCash: shift.cashSales.add(shift.openingBalance).toNumber(),
          actualCash: latestReconciliation?.actualCash?.toNumber() || null,
          discrepancy: latestReconciliation?.totalDiscrepancy?.toNumber() || null,
        },
      };
    });

    const totals = shiftReports.reduce(
      (acc, shift) => ({
        totalSales: acc.totalSales + shift.sales.totalSales,
        totalRevenue: acc.totalRevenue + shift.sales.totalRevenue,
        totalCash: acc.totalCash + shift.payments.cash,
        totalCard: acc.totalCard + shift.payments.card,
        totalTransfer: acc.totalTransfer + shift.payments.transfer,
        totalMobile: acc.totalMobile + shift.payments.mobile,
        totalDiscrepancy: acc.totalDiscrepancy + (shift.drawer.discrepancy || 0),
      }),
      {
        totalSales: 0,
        totalRevenue: 0,
        totalCash: 0,
        totalCard: 0,
        totalTransfer: 0,
        totalMobile: 0,
        totalDiscrepancy: 0,
      },
    );

    return {
      date: reportDate.toISOString().split('T')[0],
      branchId,
      shifts: shiftReports,
      totals,
    };
  }

  async getEndOfShiftReport(context: AuthContext, shiftId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        tenantId: context.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        sales: {
          include: {
            payments: true,
          },
        },
        reconciliations: {
          orderBy: {
            reconciledAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    let totalSales = 0;
    let totalRevenue = new Prisma.Decimal(0);
    let totalRefunds = 0;
    let totalRefundAmount = new Prisma.Decimal(0);
    let cashPayments = new Prisma.Decimal(0);
    let cardPayments = new Prisma.Decimal(0);
    let transferPayments = new Prisma.Decimal(0);
    let mobilePayments = new Prisma.Decimal(0);

    for (const sale of shift.sales) {
      if (sale.status === 'COMPLETED') {
        totalSales = totalSales + 1;
        totalRevenue = totalRevenue.add(sale.totalAmount);

        for (const payment of sale.payments) {
          if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
            if (payment.method === 'CASH') {
              cashPayments = cashPayments.add(payment.amount);
            } else if (payment.method === 'CARD') {
              cardPayments = cardPayments.add(payment.amount);
            } else if (payment.method === 'TRANSFER') {
              transferPayments = transferPayments.add(payment.amount);
            }
          }
        }
      } else if (sale.status === 'REFUNDED') {
        totalRefunds = totalRefunds + 1;
        totalRefundAmount = totalRefundAmount.add(sale.totalAmount);
      }
    }

    const latestReconciliation = shift.reconciliations[0];

    return {
      shiftId: shift.id,
      userId: shift.user.id,
      userName: shift.user.name,
      branchId: shift.branch?.id,
      branchName: shift.branch?.name,
      openTime: shift.openedAt,
      closeTime: shift.closedAt,
      sales: {
        totalSales,
        totalRevenue: totalRevenue.toNumber(),
        totalRefunds,
        totalRefundAmount: totalRefundAmount.toNumber(),
      },
      payments: {
        cash: cashPayments.toNumber(),
        card: cardPayments.toNumber(),
        transfer: transferPayments.toNumber(),
        mobile: mobilePayments.toNumber(),
        storeCredit: new Prisma.Decimal(0).toNumber(),
      },
      drawer: {
        openingBalance: shift.openingBalance.toNumber(),
        expectedCash: shift.cashSales.add(shift.openingBalance).toNumber(),
        actualCash: latestReconciliation?.actualCash?.toNumber() || null,
        discrepancy: latestReconciliation?.totalDiscrepancy?.toNumber() || null,
      },
      reconciliation: latestReconciliation || null,
    };
  }

  async getSalesPerformance(
    context: AuthContext,
    userId?: string,
    fromDate?: string,
    toDate?: string,
    branchId?: string,
  ) {
    const startDate = fromDate ? new Date(fromDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = toDate ? new Date(toDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const where: Prisma.SaleWhereInput = {
      tenantId: context.tenantId,
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(branchId ? { branchId } : {}),
    };

    if (userId) {
      where.shift = {
        userId,
      };
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        payments: true,
        shift: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const groupedByUser = sales.reduce((acc, sale) => {
      const userId = sale.shift?.userId || 'unassigned';
      const userName = sale.shift?.user?.name || 'Unassigned';

      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName,
          totalSales: 0,
          totalRevenue: 0,
          totalRefunds: 0,
          totalRefundAmount: 0,
          payments: {
            cash: 0,
            card: 0,
            transfer: 0,
            mobile: 0,
          },
        };
      }

      acc[userId].totalSales = acc[userId].totalSales + 1;
      acc[userId].totalRevenue = acc[userId].totalRevenue + Number(sale.totalAmount);

      for (const payment of sale.payments) {
        if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
          if (payment.method === 'CASH') {
            acc[userId].payments.cash = acc[userId].payments.cash + Number(payment.amount);
          } else if (payment.method === 'CARD') {
            acc[userId].payments.card = acc[userId].payments.card + Number(payment.amount);
          } else if (payment.method === 'TRANSFER') {
            acc[userId].payments.transfer = acc[userId].payments.transfer + Number(payment.amount);
          }
        }
      }

      return acc;
    }, {} as Record<string, any>);

    return {
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      users: Object.values(groupedByUser),
      totals: {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
      },
    };
  }
}
