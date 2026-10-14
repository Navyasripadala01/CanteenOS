/**
 * CanteenOS — Authentication & RBAC Helper
 * Manages roles, permissions, and demo persona context.
 */

import type { Role, DemoPersona } from '@/types';
import { DEMO_PERSONAS } from '@/data/seedData';

export interface UserSession {
  userId: string;
  name: string;
  role: Role;
  collegeId: string;
  canteenId: string;
  counterId?: string;
}

export function isDemoModeEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true'
  );
}

export function getDefaultDemoPersona(): DemoPersona {
  return DEMO_PERSONAS[0];
}

export function getPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id);
}

export function checkRolePermission(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}
