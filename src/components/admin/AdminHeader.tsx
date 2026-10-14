'use client';

/**
 * CanteenOS — College Admin & Analytics Header
 * Campus context, demo notification badge, and admin navigation.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import {
  BarChart3,
  Sliders,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  LogOut,
} from 'lucide-react';

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { activePersona, logout } = useCanteenStore();

  const navLinks = [
    { href: '/admin', label: 'Overview & Analytics', icon: BarChart3 },
    { href: '/admin/capacity', label: 'Capacity Tuning', icon: Sliders },
    { href: '/admin/exceptions', label: 'Audit & Exceptions', icon: AlertTriangle },
    { href: '/admin/policies', label: 'Policies & Refunds', icon: ShieldCheck },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Admin Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-900">
                    CanteenOS Admin
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    College Portal
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  National Institute of Technology • Central Food Court (Can-01)
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Logout Action */}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              title="Log Out of Demo Account"
              className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200/60 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
