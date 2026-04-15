import React from 'react';
import { prisma } from '@/lib/prisma';
import RoleTable from './RoleTable';
import AddRoleButton from './AddRoleButton';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    include: {
      _count: { select: { employees: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8 min-h-screen bg-[var(--surface)]">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-section font-display text-[var(--foreground)]">
            System Roles
          </h1>
          <p className="text-body-light mt-1 text-[var(--muted-foreground)]">
            Manage system roles and view employee assignments
          </p>
        </div>
        <div>
          <AddRoleButton />
        </div>
      </header>

      <section>
        <RoleTable roles={roles} />
      </section>
    </div>
  );
}