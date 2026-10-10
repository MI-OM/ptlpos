const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

async function main() {
  // 1. Verify all unverified users
  const result = await p.user.updateMany({
    where: { isEmailVerified: false },
    data: { isEmailVerified: true },
  });
  console.log(`Verified ${result.count} users`);

  // 2. Also update tenant isEmailVerified for tenants whose email matches
  const unverifiedTenants = await p.tenant.findMany({
    where: { isEmailVerified: false, email: { not: null } },
    select: { id: true, email: true, name: true },
  });
  for (const t of unverifiedTenants) {
    await p.tenant.update({
      where: { id: t.id },
      data: { isEmailVerified: true },
    });
    console.log(`Verified tenant: ${t.name} (${t.email})`);
  }

  // 3. Generate a real verification token to test the flow
  // Pick the first tenant that has users
  const tenant = await p.tenant.findFirst({ where: { email: { not: null } } });
  if (tenant && tenant.email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await p.verificationToken.create({
      data: {
        tenantId: tenant.id,
        email: tenant.email,
        token,
        expiresAt,
      },
    });
    console.log(`\n=== TEST VERIFICATION TOKEN ===`);
    console.log(`Tenant: ${tenant.name} (${tenant.email})`);
    console.log(`URL: http://localhost:3001/verify-email?token=${token}`);
    console.log(`Token: ${token}`);
    console.log(`===============================\n`);
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); p.$disconnect(); });
