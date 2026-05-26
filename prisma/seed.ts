import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  RoleName,
  ProductType,
  ShiftStatus,
  DrawerType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenantName = process.env.SEED_TENANT_NAME ?? 'Default Tenant';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Admin User';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'simbanks05@gmail.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'uMB#Ta^j,M34~UG';

  // ────────────────────────────
  // 1. Roles
  // ────────────────────────────
  console.log('Seeding roles...');
  for (const name of [RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP] as const) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } });
  const managerRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.MANAGER } });
  const salesRepRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SALES_REP } });

  // ────────────────────────────
  // 2. Tenant — reuse existing tenant if admin user already exists
  // ────────────────────────────
  console.log('Seeding tenant...');

  let tenant = await prisma.tenant.findFirst({
    where: { users: { some: { email: adminEmail } } },
  });

  if (tenant) {
    console.log(`Using existing tenant: "${tenant.name}" (${tenant.id})`);
    // Cascade-clear seedable data for this tenant (keep tenant + user records)
    await prisma.shift.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.inventory.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.productVariant.deleteMany({ where: { product: { tenantId: tenant.id } } });
    await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.category.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.branch.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.customer.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.supplier.deleteMany({ where: { tenantId: tenant.id } });
  } else {
    await prisma.tenant.deleteMany({ where: { name: tenantName } });
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        email: 'info@ptlpos.local',
        phone: '+2348000000000',
        address: '10 Admiralty Way',
        city: 'Lagos',
        state: 'Lagos',
        country: 'NG',
        isEmailVerified: true,
      },
    });
  }

  // Ensure tenant's email and isEmailVerified are set correctly
  if (!tenant.email) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { email: 'info@ptlpos.local', isEmailVerified: true },
    });
  }

  // ────────────────────────────
  // 4. Users
  // ────────────────────────────
  console.log('Seeding users...');
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const adminPw = await hash(adminPassword);
  const managerPw = await hash('Manager123!');
  const salesPw = await hash('SalesRep123!');

  let admin = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: adminRole.id,
        name: adminName,
        email: adminEmail,
        passwordHash: adminPw,
        isEmailVerified: true,
      },
    });
  } else {
    // Update password in case it changed
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: adminPw, isEmailVerified: true },
    });
  }

  const upsertUser = async (roleId: string, name: string, email: string, pwHash: string) => {
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });
    if (existing) {
      return prisma.user.update({ where: { id: existing.id }, data: { passwordHash: pwHash } });
    }
    return prisma.user.create({
      data: { tenantId: tenant.id, roleId, name, email, passwordHash: pwHash },
    });
  };

  const manager = await upsertUser(managerRole.id, 'Branch Manager', 'manager@ptlpos.local', managerPw);
  const salesRep = await upsertUser(salesRepRole.id, 'Sales Representative', 'sales@ptlpos.local', salesPw);

  // ────────────────────────────
  // 5. Categories
  // ────────────────────────────
  console.log('Seeding categories...');
  const categoryNames = [
    'Food & Beverages',
    'Bakery',
    'Groceries',
    'Beverages',
    'Dairy & Chilled',
    'Household & Cleaning',
  ] as const;

  const categoryMap: Record<string, any> = {};
  for (const name of categoryNames) {
    categoryMap[name] = await prisma.category.create({
      data: { tenantId: tenant.id, name },
    });
  }

  // ────────────────────────────
  // 6. Branches
  // ────────────────────────────
  console.log('Seeding branches...');
  const branchDefs = [
    { name: 'Main Branch - Lagos', address: '10 Admiralty Way', city: 'Lagos', state: 'Lagos' },
    { name: 'Branch 2 - Abuja', address: '25 Airport Road', city: 'Abuja', state: 'FCT' },
  ];

  const branches: any[] = [];
  for (const b of branchDefs) {
    const branch = await prisma.branch.create({
      data: { tenantId: tenant.id, ...b },
    });
    branches.push(branch);
  }
  const [mainBranch, abujaBranch] = branches;

  // ────────────────────────────
  // 7. Products
  // ────────────────────────────
  console.log('Seeding products...');
  const productDefs = [
    { name: 'Indomie Instant Noodles', sku: 'IND001', barcode: `IND-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Food & Beverages', price: 100, cost: 85, taxRate: 0 },
    { name: 'Golden Morn Cereal', sku: 'GDM002', barcode: `GDM-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Food & Beverages', price: 350, cost: 290, taxRate: 0 },
    { name: 'Peak Milk Tin', sku: 'PKM003', barcode: `PKM-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Food & Beverages', price: 800, cost: 700, taxRate: 0 },
    { name: 'White Bread (Sliced)', sku: 'BRD004', barcode: `BRD-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Bakery', price: 600, cost: 450, taxRate: 0 },
    { name: 'Agege Bread', sku: 'AGB005', barcode: `AGB-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Bakery', price: 500, cost: 380, taxRate: 0 },
    { name: 'Chocolate Cake (Whole)', sku: 'CAK006', barcode: `CAK-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Bakery', price: 3500, cost: 2500, taxRate: 0 },
    { name: 'Rice (50kg)', sku: 'RIC007', barcode: `RIC-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Groceries', price: 45000, cost: 40000, taxRate: 0 },
    { name: 'Vegetable Oil (5L)', sku: 'OIL008', barcode: `OIL-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Groceries', price: 8500, cost: 7200, taxRate: 0 },
    { name: 'Sugar (1kg)', sku: 'SGR010', barcode: `SGR-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Groceries', price: 1500, cost: 1200, taxRate: 0 },
    { name: 'Salt (1kg)', sku: 'SLT009', barcode: `SLT-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Groceries', price: 300, cost: 200, taxRate: 0 },
    { name: 'Coca-Cola', sku: 'COK011', barcode: `COK-${Date.now()}`, type: ProductType.VARIANT, categoryKey: 'Beverages', price: 200, cost: 150, taxRate: 0 },
    { name: 'Fanta', sku: 'FAN012', barcode: `FAN-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Beverages', price: 200, cost: 150, taxRate: 0 },
    { name: 'Malt Drink', sku: 'MLT013', barcode: `MLT-${Date.now()}`, type: ProductType.VARIANT, categoryKey: 'Beverages', price: 350, cost: 280, taxRate: 0 },
    { name: 'Yoghurt (Plain 1L)', sku: 'YOG014', barcode: `YOG-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Dairy & Chilled', price: 1500, cost: 1100, taxRate: 0 },
    { name: 'Butter (500g)', sku: 'BTR015', barcode: `BTR-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Dairy & Chilled', price: 2500, cost: 2000, taxRate: 0 },
    { name: 'Cheese (200g)', sku: 'CHS016', barcode: `CHS-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Dairy & Chilled', price: 1800, cost: 1400, taxRate: 0 },
    { name: 'Detergent (2kg)', sku: 'DET017', barcode: `DET-${Date.now()}`, type: ProductType.VARIANT, categoryKey: 'Household & Cleaning', price: 3200, cost: 2500, taxRate: 0 },
    { name: 'Bleach (1L)', sku: 'BLC018', barcode: `BLC-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Household & Cleaning', price: 600, cost: 450, taxRate: 0 },
    { name: 'Dish Soap (500ml)', sku: 'DSH019', barcode: `DSH-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Household & Cleaning', price: 800, cost: 600, taxRate: 0 },
    { name: 'Air Freshener (300ml)', sku: 'AIR020', barcode: `AIR-${Date.now()}`, type: ProductType.SIMPLE, categoryKey: 'Household & Cleaning', price: 1200, cost: 900, taxRate: 0 },
  ];

  const products: any[] = [];
  for (const p of productDefs) {
    const { categoryKey, ...productData } = p;
    const prod = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        ...productData,
        categoryId: categoryMap[categoryKey].id,
      },
    });
    products.push(prod);
  }

  // ────────────────────────────
  // 8. Variants
  // ────────────────────────────
  console.log('Seeding variants...');
  const getProduct = (sku: string) => products.find((p) => p.sku === sku)!;

  const variantDefs = [
    { productSku: 'COK011', name: '50cl', sku: 'COK011-50CL', price: 200 },
    { productSku: 'COK011', name: '1.5L', sku: 'COK011-15L', price: 500 },
    { productSku: 'MLT013', name: '330ml', sku: 'MLT013-330ML', price: 350 },
    { productSku: 'MLT013', name: '1L', sku: 'MLT013-1L', price: 700 },
    { productSku: 'DET017', name: '2kg', sku: 'DET017-2KG', price: 3200 },
    { productSku: 'DET017', name: '1kg', sku: 'DET017-1KG', price: 1800 },
  ];

  const variants: any[] = [];
  for (const v of variantDefs) {
    const prod = getProduct(v.productSku);
    const variant = await prisma.productVariant.create({
      data: { productId: prod.id, name: v.name, sku: v.sku, price: v.price },
    });
    variants.push(variant);
  }

  // ────────────────────────────
  // 9. Inventory
  // ────────────────────────────
  console.log('Seeding inventory...');
  const inventoryQty: Record<string, number> = {
    IND001: 200,
    GDM002: 150,
    PKM003: 100,
    BRD004: 50,
    AGB005: 60,
    CAK006: 20,
    RIC007: 30,
    OIL008: 40,
    SGR010: 80,
    SLT009: 100,
    'COK011-50CL': 150,
    'COK011-15L': 80,
    FAN012: 120,
    'MLT013-330ML': 100,
    'MLT013-1L': 60,
    YOG014: 40,
    BTR015: 30,
    CHS016: 25,
    'DET017-2KG': 50,
    'DET017-1KG': 70,
    BLC018: 60,
    DSH019: 80,
    AIR020: 45,
  };

  for (const branch of branches) {
    for (const [sku, qty] of Object.entries(inventoryQty)) {
      const prod = products.find((p) => p.sku === sku);
      if (prod) {
        await prisma.inventory.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            productId: prod.id,
            quantity: qty,
          },
        });
      } else {
        const v = variants.find((v) => v.sku === sku);
        if (v) {
          await prisma.inventory.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              productId: v.productId,
              productVariantId: v.id,
              quantity: qty,
            },
          });
        }
      }
    }
  }

  // ────────────────────────────
  // 10. Customers
  // ────────────────────────────
  console.log('Seeding customers...');
  const customerDefs = [
    { name: 'John Doe', phone: '+2348011111111', email: 'john@example.com', creditBalance: 0 },
    { name: 'Jane Smith', phone: '+2348022222222', email: 'jane@example.com', creditBalance: 0 },
    { name: 'Michael Okonkwo', phone: '+2348033333333', email: 'michael@example.com', creditBalance: 5000 },
    { name: 'Sarah Adeyemi', phone: '+2348044444444', email: 'sarah@example.com', creditBalance: 0 },
    { name: 'David Okafor', phone: '+2348055555555', email: 'david@example.com', creditBalance: 2000 },
  ];

  for (const c of customerDefs) {
    await prisma.customer.create({
      data: { tenantId: tenant.id, ...c },
    });
  }

  // ────────────────────────────
  // 11. Suppliers
  // ────────────────────────────
  console.log('Seeding suppliers...');
  const supplierDefs = [
    { name: 'Nestle Nigeria Plc', email: 'orders@nestle.ng', phone: '+2348066666666' },
    { name: 'Dangote Group', email: 'sales@dangote.ng', phone: '+2348077777777' },
    { name: 'Unilever Nigeria', email: 'info@unilever.ng', phone: '+2348088888888' },
  ];

  for (const s of supplierDefs) {
    await prisma.supplier.create({
      data: { tenantId: tenant.id, ...s },
    });
  }

  // ────────────────────────────
  // 12. Open Shift
  // ────────────────────────────
  console.log('Seeding open shift...');
  await prisma.shift.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      userId: admin.id,
      openingBalance: 50000,
      drawerType: DrawerType.MIXED,
      status: ShiftStatus.OPEN,
      notes: 'Opening shift from seed data',
    },
  });

  // ────────────────────────────
  // Summary
  // ────────────────────────────
  console.log(
    JSON.stringify(
      {
        tenantId: tenant.id,
        userId: admin.id,
        email: admin.email,
        role: RoleName.ADMIN,
        categories: categoryNames.length,
        branches: branches.length,
        products: products.length,
        variants: variants.length,
        customers: customerDefs.length,
        suppliers: supplierDefs.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
