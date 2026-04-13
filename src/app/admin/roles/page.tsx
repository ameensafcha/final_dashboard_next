import React from 'react';
import { prisma } from '@/lib/prisma';
import styles from './roles.module.css';
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
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Roles</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
            Manage system roles and view employee assignments
          </p>
        </div>
        <div className={styles.actions}>
          <AddRoleButton />
        </div>
      </header>

      <section>
        <RoleTable roles={roles} />
      </section>
    </div>
  );
}
