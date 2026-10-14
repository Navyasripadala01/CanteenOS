'use client';

/**
 * CanteenOS — Client-Side Role Guard & Access Controller
 * Strictly restricts portal views by role, ensures hydration safety,
 * prevents URL bypasses, and provides direct redirects to /login.
 */

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { Role } from '@/types';
import { ShieldAlert, LogOut, ArrowRight, UtensilsCrossed } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, activePersona, hydrateAuth, logout } = useCanteenStore();

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isAuthenticated, router, pathname]);

  // 1. Loading / Hydration Skeleton (Prevents Flash of Unauthorized Content)
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 animate-pulse mb-3">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase font-mono">
          Verifying Station Clearance...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated state while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm font-semibold text-slate-600 mb-1">Redirecting to Demo Login...</p>
        <p className="text-xs text-slate-400">Please sign in with a demo persona to access this station.</p>
      </div>
    );
  }

  // 3. Role Authorization Check
  const isAuthorized = allowedRoles.includes(activePersona.role);

  if (!isAuthorized) {
    const targetDashboard =
      activePersona.role === 'KITCHEN_STAFF'
        ? '/kitchen'
        : activePersona.role === 'PICKUP_COORDINATOR'
        ? '/pickup'
        : activePersona.role === 'COLLEGE_ADMIN'
        ? '/admin'
        : '/student';

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Access Restricted
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Station Clearance Required
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are currently authenticated as{' '}
              <strong className="text-slate-900">{activePersona.name}</strong> (
              <span className="font-mono uppercase text-[11px] text-slate-700">
                {activePersona.role.replace('_', ' ')}
              </span>
              ). This portal requires{' '}
              <span className="font-semibold text-brand-600">
                {allowedRoles.map((r) => r.replace('_', ' ')).join(', ')}
              </span>{' '}
              clearance.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => router.push(targetDashboard)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Go to My Station</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Access
  return <>{children}</>;
}
