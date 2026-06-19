-- CreateEnum
CREATE TYPE "DrawerType" AS ENUM ('ONLINE', 'OFFLINE', 'MIXED');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "actual_cash_count" DECIMAL(14,2),
ADD COLUMN     "discrepancy" DECIMAL(14,2),
ADD COLUMN     "drawerType" "DrawerType" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "offline_drawer_balance" DECIMAL(14,2),
ADD COLUMN     "online_drawer_balance" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "ShiftReconciliation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "expected_cash" DECIMAL(14,2) NOT NULL,
    "expected_card" DECIMAL(14,2) NOT NULL,
    "expected_transfer" DECIMAL(14,2) NOT NULL,
    "expected_mobile" DECIMAL(14,2) NOT NULL,
    "expected_total" DECIMAL(14,2) NOT NULL,
    "actual_cash" DECIMAL(14,2) NOT NULL,
    "actual_card" DECIMAL(14,2) NOT NULL,
    "actual_transfer" DECIMAL(14,2) NOT NULL,
    "actual_mobile" DECIMAL(14,2) NOT NULL,
    "actual_total" DECIMAL(14,2) NOT NULL,
    "cash_discrepancy" DECIMAL(14,2) NOT NULL,
    "card_discrepancy" DECIMAL(14,2) NOT NULL,
    "transfer_discrepancy" DECIMAL(14,2) NOT NULL,
    "mobile_discrepancy" DECIMAL(14,2) NOT NULL,
    "total_discrepancy" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "reconciled_by" TEXT NOT NULL,
    "reconciled_at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftReconciliation_tenantId_shiftId_idx" ON "ShiftReconciliation"("tenantId", "shiftId");

-- CreateIndex
CREATE INDEX "ShiftReconciliation_tenantId_reconciled_at_idx" ON "ShiftReconciliation"("tenantId", "reconciled_at");

-- CreateIndex
CREATE INDEX "Branch_tenantId_createdAt_idx" ON "Branch"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Category_tenantId_createdAt_idx" ON "Category"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Category_tenantId_parentId_idx" ON "Category"("tenantId", "parentId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_createdAt_idx" ON "Customer"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_tenantId_createdAt_idx" ON "Product"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_tenantId_status_completedAt_idx" ON "Sale"("tenantId", "status", "completedAt");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftReconciliation" ADD CONSTRAINT "ShiftReconciliation_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
