import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLE_DEFINITIONS = [
  { name: 'admin', description: 'Full system access' },
  { name: 'employee', description: 'Standard employee access' },
  { name: 'viewer', description: 'Read-only access' },
];

async function main() {
  console.log('🌱 Starting database seeding (Basic Roles Only)...');

  // 1. Seed Roles
  console.log('Seeding roles...');
  for (const roleDef of ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });
  }
  console.log(`✓ Created/Updated ${ROLE_DEFINITIONS.length} roles`);

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
