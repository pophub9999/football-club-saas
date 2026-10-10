import { PrismaClient, DueStatus, MembershipStatus, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-club' },
    update: { name: 'Demo Football Club' },
    create: { slug: 'demo-club', name: 'Demo Football Club' },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo.member@example.test' },
    update: { status: UserStatus.ACTIVE },
    create: {
      email: 'demo.member@example.test',
      passwordHash: await bcrypt.hash('DemoPass123!', 12),
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: { roles: ['member'] },
    create: { userId: user.id, tenantId: tenant.id, roles: ['member'] },
  });

  const member = await prisma.member.upsert({
    where: { tenantId_memberNumber: { tenantId: tenant.id, memberNumber: 'DEMO-0001' } },
    update: { userId: user.id, email: user.email },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      memberNumber: 'DEMO-0001',
      firstName: 'Demo',
      lastName: 'Member',
      email: user.email,
    },
  });

  await prisma.membership.upsert({
    where: { tenantId_externalId: { tenantId: tenant.id, externalId: 'MOCK-MEMBERSHIP-DEMO-0001' } },
    update: { status: MembershipStatus.ACTIVE, validFrom: new Date('2026-01-01T00:00:00Z') },
    create: {
      tenantId: tenant.id,
      memberId: member.id,
      planCode: 'STANDARD',
      status: MembershipStatus.ACTIVE,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      externalId: 'MOCK-MEMBERSHIP-DEMO-0001',
    },
  });

  await prisma.due.upsert({
    where: { tenantId_externalId: { tenantId: tenant.id, externalId: 'MOCK-DUE-2026-09-DEMO-0001' } },
    update: { amount: 25, description: 'Quota setembro 2026', dueDate: new Date('2026-09-30T23:59:59Z') },
    create: {
      tenantId: tenant.id,
      memberId: member.id,
      reference: 'QUOTA-2026-09',
      description: 'Quota setembro 2026',
      amount: 25,
      paidAmount: 0,
      currency: 'EUR',
      dueDate: new Date('2026-09-30T23:59:59Z'),
      status: DueStatus.OPEN,
      externalId: 'MOCK-DUE-2026-09-DEMO-0001',
    },
  });

  console.log('Seeded demo-club. Login: demo.member@example.test / DemoPass123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
