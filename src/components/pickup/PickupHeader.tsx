'use client';

/**
 * CanteenOS — Online Pickup Hub Header
 * Coordinator identity (Priya), real-time 24-shelf occupancy indicator, and scanner shortcut.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { getShelfMatrixSummary } from '@/lib/shelfEngine';
import { Box, QrCode, LayoutGrid, CheckCircle2, ShieldCheck, ArrowRight, LogOut } from 'lucide-react';

export function PickupHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { pickupShelves, logout } = useCanteenStore();
  const shelfSummary = getShelfMatrixSummary(pickupShelves);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Hub Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-md">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-white">ONLINE PICKUP HUB</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    PRIYA (COORDINATOR)
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  24 Physical Shelves • Single Consolidated Collection Zone
                </div>
              </div>
            </Link>
          </div>

          {/* Shelf Occupancy & Navigation Links */}
          <div className="flex items-center gap-3">
            {/* Shelf Counter */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">Shelves:</span>
              <span className="text-emerald-400 font-bold">{shelfSummary.availableCount} Available</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-bold">{shelfSummary.occupiedCount} Occupied</span>
            </div>

            {/* Terminal Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <Link
                href="/pickup"
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  pathname === '/pickup'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Staging & Shelves</span>
              </Link>
              <Link
                href="/pickup/scanner"
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  pathname === '/pickup/scanner'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Scanner</span>
              </Link>
            </div>

            {/* Logout Action */}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              title="Log Out of Demo Account"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700/60 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
