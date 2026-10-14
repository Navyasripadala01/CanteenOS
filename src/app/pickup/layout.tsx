'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function PickupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['PICKUP_COORDINATOR', 'COLLEGE_ADMIN']}>
      {children}
    </RoleGuard>
  );
}
