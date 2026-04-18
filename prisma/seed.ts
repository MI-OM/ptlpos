import * as bcrypt from 'bcrypt';
import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenantName = process.env.SEED_TENANT_NAME ?? 'Default Tenant';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Admin User';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@ptlpos.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const roles = [RoleName.ADMIN, RoleName.MANAGER, RoleName.SALES_REP];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const existingTenant = await prisma.tenant.findFirst({
    where: {
      name: tenantName,
    },
  });

  const tenant =
    existingTenant ??
    (await prisma.tenant.create({
      data: {
        name: tenantName,
      },
    }));

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: adminEmail,
      },
    },
    update: {
      name: adminName,
      roleId: adminRole.id,
      passwordHash,
    },
    create: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      name: adminName,
      email: adminEmail,
      passwordHash,
    },
  });

  console.log(
    JSON.stringify(
      {
        tenantId: tenant.id,
        userId: admin.id,
        email: admin.email,
        role: RoleName.ADMIN,
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
