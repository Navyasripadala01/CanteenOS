'use client';

/**
 * CanteenOS — Student Top Header
 * Restrained liquid glass top bar with campus context, active greeting, and live rush pill.
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { computeCampusRushOverview } from '@/lib/capacityEngine';
import { UtensilsCrossed, Flame, Clock, MapPin, ChevronRight, LogOut } from 'lucide-react';

export function StudentHeader() {
  const router = useRouter();
  const { activePersona, pickupSlots, cart, logout } = useCanteenStore();
  const rushOverview = computeCampusRushOverview(pickupSlots);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Campus & Canteen Identity */}
        <div className="flex items-center gap-3">
          <Link href="/student" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">CanteenOS</span>
                {activePersona.role === 'VISITOR' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {activePersona.visitorType === 'ALUMNI_PASSED_OUT' ? "Alumni ('22)" : 'Campus Guest'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200/60">
                    Campus Main
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">Central Food Court</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Live Rush Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              rushOverview.overallRushLevel === 'HIGH'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : rushOverview.overallRushLevel === 'MODERATE'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
            title="Estimated campus wait time based on active dinner slot capacity"
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                rushOverview.overallRushLevel === 'HIGH'
                  ? 'bg-rose-500'
                  : rushOverview.overallRushLevel === 'MODERATE'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="tracking-wide uppercase text-[11px]">{rushOverview.overallRushLevel} RUSH</span>
            <span className="text-[10px] opacity-70 font-normal hidden sm:inline">
              (~{rushOverview.averageWaitMinutes}m wait)
            </span>
          </div>

          {/* User Avatar */}
          <Link
            href="/student/profile"
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm hover:border-slate-300 transition-colors"
            title="View Profile"
          >
            {activePersona.avatar}
          </Link>

          {/* Logout Action */}
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title="Log Out of Demo Account"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 flex items-center justify-center transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
