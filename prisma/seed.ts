import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
// @ts-ignore
import { PERMISSIONS, PERMISSION_LABELS } from '../src/lib/permissions';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLE_DEFINITIONS = [
  { name: 'admin', description: 'Full system access' },
  { name: 'employee', description: 'Standard employee access' },
  { name: 'viewer', description: 'Read-only access' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS),
  employee: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.INVENTORY,
    PERMISSIONS.STOCKS,
    PERMISSIONS.RECEIVING,
    PERMISSIONS.PRODUCTS,
    PERMISSIONS.VARIANTS,
    PERMISSIONS.FLAVORS,
    PERMISSIONS.SIZES,
    PERMISSIONS.PRODUCTION,
    PERMISSIONS.BATCHES,
    PERMISSIONS.FINISHED_PRODUCTS,
    PERMISSIONS.TASKS,
    PERMISSIONS.TASKS_MANAGE,
  ],
  viewer: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.INVENTORY,
    PERMISSIONS.STOCKS,
    PERMISSIONS.PRODUCTS,
    PERMISSIONS.PRODUCTION,
    PERMISSIONS.TASKS,
  ],
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Permissions
  console.log('Seeding permissions...');
  const permissionsList = Object.values(PERMISSIONS);
  for (const permissionValue of permissionsList) {
    const [resource, action] = (permissionValue as string).split(':');
    const label = PERMISSION_LABELS[permissionValue as keyof typeof PERMISSION_LABELS];
    
    await (prisma as any).permission.upsert({
      where: { action_resource: { action, resource } },
      update: { label },
      create: { action, resource, label },
    });
  }
  console.log(`✓ Created/Updated ${permissionsList.length} permissions`);

  // 2. Seed Roles
  console.log('Seeding roles...');
  for (const roleDef of ROLE_DEFINITIONS) {
    await (prisma as any).role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });
  }
  console.log(`✓ Created/Updated ${ROLE_DEFINITIONS.length} roles`);

  // 3. Clear existing role permissions
  await (prisma as any).rolePermission.deleteMany({});
  console.log('✓ Cleared existing role permissions');

  // 4. Assign permissions to roles
  for (const roleName in ROLE_PERMISSIONS) {
    const role = await (prisma as any).role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    const rolePerms = ROLE_PERMISSIONS[roleName];
    const rolePermissionData = [];

    for (const permissionValue of rolePerms) {
      const [resource, action] = (permissionValue as string).split(':');
      const permission = await (prisma as any).permission.findUnique({
        where: { action_resource: { action, resource } }
      });

      if (permission) {
        rolePermissionData.push({
          role_id: role.id,
          permission_id: permission.id,
          is_active: true,
        });
      }
    }

    if (rolePermissionData.length > 0) {
      await (prisma as any).rolePermission.createMany({
        data: rolePermissionData,
      });
      console.log(`✓ Assigned ${rolePermissionData.length} permissions to ${roleName}`);
    }
  }

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
