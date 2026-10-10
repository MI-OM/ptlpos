const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ where: { email: 'manager@ptlpos.local' }, select: { id: true, name: true, email: true, tenantId: true, isEmailVerified: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); p.$disconnect(); })
  .catch(e => { console.error(e.message); p.$disconnect(); });
