import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-club' },
    update: { name: 'Demo Football Club' },
    create: { slug: 'demo-club', name: 'Demo Football Club' },
  });

  const member = await prisma.member.upsert({
    where: { tenantId_memberNumber: { tenantId: tenant.id, memberNumber: 'DEMO-0001' } },
    update: {},
    create: {
      tenantId: tenant.id,
      memberNumber: 'DEMO-0001',
      firstName: 'Demo',
      lastName: 'Member',
      email: 'demo.member@example.test',
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: tenant.id,
      memberId: member.id,
      planCode: 'STANDARD',
      status: 'ACTIVE',
      validFrom: new Date(),
    },
  });

  console.log(`Seeded tenant ${tenant.slug} with member ${member.memberNumber}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
