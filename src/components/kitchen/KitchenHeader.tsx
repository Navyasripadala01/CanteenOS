'use client';

/**
 * CanteenOS — Kitchen Display System (KDS) Header
 * High-contrast station selector, active station lead badge, and quick navigation.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import {
  ChefHat,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  Flame,
  Clock,
  ArrowLeft,
  UtensilsCrossed,
  PackageCheck,
  CreditCard,
  LogOut,
} from 'lucide-react';

interface KitchenHeaderProps {
  selectedCounter: string; // 'ALL' | 'cnt-01' | 'cnt-02' | 'cnt-03'
  onSelectCounter: (counterId: string) => void;
}

export function KitchenHeader({ selectedCounter, onSelectCounter }: KitchenHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activePersona, menuItems, orders, logout } = useCanteenStore();

  const stations = [
    { id: 'ALL', label: 'All Counters', lead: 'Head Supervisor', badge: 'bg-slate-800' },
    { id: 'cnt-01', label: 'Counter 1: Biryani & Rice', lead: 'Chef Ramesh', badge: 'bg-indigo-600' },
    { id: 'cnt-02', label: 'Counter 2: Meals & Chapati', lead: 'Chef Suresh', badge: 'bg-teal-600' },
    { id: 'cnt-03', label: 'Counter 3: Drinks & POS', lead: 'Anand', badge: 'bg-rose-600' },
  ];

  const currentStation = stations.find((s) => s.id === selectedCounter) || stations[0];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Station Info */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-md">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-white">KITCHEN KDS</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">
                    CANTEEN-OS
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Central Food Court • Station: <span className="text-slate-200 font-bold">{currentStation.lead}</span>
                </div>
              </div>
            </Link>

            {/* Quick Links on Kitchen Hub */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Link
                href="/kitchen"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/kitchen' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                KDS Queue
              </Link>
              <Link
                href="/kitchen/inventory"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/kitchen/inventory' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stock (86)
              </Link>
              <Link
                href="/kitchen/pos"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/kitchen/pos' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cash POS (C3)
              </Link>
            </div>
          </div>

          {/* Station Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {stations.map((s) => {
              const isSelected = selectedCounter === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectCounter(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${s.badge} text-white ring-2 ring-white/30 shadow-sm`
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white/60" />
                  <span>{s.label.split(':')[0]}</span>
                </button>
              );
            })}

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
