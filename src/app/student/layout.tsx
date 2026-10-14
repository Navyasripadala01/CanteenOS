'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['STUDENT', 'VISITOR', 'COLLEGE_ADMIN']}>
      {children}
    </RoleGuard>
  );
}
