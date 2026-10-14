'use client';

/**
 * CanteenOS — Master Operational Hub & Multi-Portal Launchpad
 * "Order once. Pay once. Pick up once."
 * Interactive portal selector for Student, Kitchen KDS, Pickup Coordinator, and College Admin.
 */

import React from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { computeCampusRushOverview, computeAllSlotAvailability } from '@/lib/capacityEngine';
import { getShelfMatrixSummary } from '@/lib/shelfEngine';
import {
  Clock,
  Layers,
  UtensilsCrossed,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Box,
  Smartphone,
  ChefHat,
  QrCode,
  BarChart3,
  Sliders,
  LogIn,
  LogOut,
} from 'lucide-react';

export default function HomePage() {
  const {
    activePersona,
    isAuthenticated,
    menuItems,
    pickupSlots,
    pickupShelves,
    orders,
    logout,
    resetToSeedData,
  } = useCanteenStore();

  const rushOverview = computeCampusRushOverview(pickupSlots);
  const slotAvailability = computeAllSlotAvailability(pickupSlots);
  const shelfSummary = getShelfMatrixSummary(pickupShelves);

  // Group menu items by counter
  const counter1Items = menuItems.filter((i) => i.counterId === 'cnt-01');
  const counter2Items = menuItems.filter((i) => i.counterId === 'cnt-02');
  const counter3Items = menuItems.filter((i) => i.counterId === 'cnt-03');

  const portals = [
    {
      href: '/student',
      title: 'Student Portal',
      role: 'Student (Rahul Varma / Ananya)',
      desc: 'Mobile-first ordering, 10-min slot picker, friend tagging, UPI pay & live QR tracking.',
      icon: Smartphone,
      accent: 'bg-brand-500 text-white',
      badge: 'Order Ahead',
    },
    {
      href: '/kitchen',
      title: 'Kitchen KDS & POS',
      role: 'Kitchen Chefs (Ramesh / Suresh / Anand)',
      desc: 'Multi-counter Kanban, slot batch aggregator, JIT drink staging & Counter 3 Cash POS.',
      icon: ChefHat,
      accent: 'bg-indigo-600 text-white',
      badge: 'Prep & POS',
    },
    {
      href: '/pickup',
      title: 'Online Pickup Hub',
      role: 'Pickup Coordinator (Priya)',
      desc: 'Multi-counter item consolidation, 24 physical shelves manager & QR scanner terminal.',
      icon: Box,
      accent: 'bg-emerald-600 text-white',
      badge: 'Consolidation',
    },
    {
      href: '/admin',
      title: 'College Admin Portal',
      role: 'Administrator (Dr. Venkat / Rajesh)',
      desc: 'Peak rush heatmaps, 70/30 capacity tuning sliders, latency benchmarks & audit stream.',
      icon: BarChart3,
      accent: 'bg-slate-900 text-white',
      badge: 'Analytics',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-900">
      {/* Top Banner & Reset */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-500 text-white p-1.5 rounded-xl shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">CanteenOS</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Campus Main
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            "Order once. Pay once. Pick up once." — Smart Campus Canteen Operating System
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-xl font-medium border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Signed in: <strong className="text-slate-900">{activePersona.name}</strong></span>
              </span>
              <button
                onClick={() => {
                  logout();
                }}
                className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl shadow-2xs transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-2 rounded-xl shadow-md shadow-brand-500/20 transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Demo Login Portal</span>
            </Link>
          )}

          <button
            onClick={() => resetToSeedData()}
            className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl shadow-2xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </header>

      {/* Demonstration Notice */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950 shadow-2xs">
        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">Demonstration Dataset & Simulation Notice:</span> All seeded values (rush levels, wait times, slot bookings, and 70/30 capacity splits) are structured for interactive simulation and system verification.
        </div>
      </div>

      {/* 4 Interactive Portal Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Interactive Operational Portals</h2>
          <span className="text-xs text-slate-500">Select an experience to test</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.href}
                href={portal.href}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${portal.accent} shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                      {portal.title}
                    </h3>
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5">{portal.role}</div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{portal.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-brand-600">
                  <span>Open Station</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Live Campus Demand & Rush Status */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rush Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dinner Rush Status</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                rushOverview.overallRushLevel === 'HIGH'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : rushOverview.overallRushLevel === 'MODERATE'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              {rushOverview.overallRushLevel} RUSH
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">
              ~{rushOverview.averageWaitMinutes} <span className="text-sm font-semibold text-slate-500">mins est. wait</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              7:00 PM – 8:00 PM Peak Window (~500 hostel students capacity model)
            </p>
          </div>
        </div>

        {/* Online vs Walk-in Allocation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Dual-Channel Capacity</span>
            <span className="text-slate-700">70% Online / 30% Walk-in</span>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Online Pre-Orders</span>
                <span className="text-slate-900 font-semibold">{rushOverview.totalOnlineUtilization}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, rushOverview.totalOnlineUtilization)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Walk-in Counter 3 Desk</span>
                <span className="text-slate-900 font-semibold">{rushOverview.totalWalkinUtilization}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, rushOverview.totalWalkinUtilization)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Pickup Slot */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Smart Recommended Slot</span>
            <div className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              {rushOverview.nextRecommendedSlot?.displayLabel || 'All Slots Open'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earliest slot with uncrowded kitchen capacity (&lt;75% booked).
            </p>
          </div>
          <div className="mt-3 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Prevents physical counter bottleneck
          </div>
        </div>
      </section>

      {/* Online Pickup Zone & 24 Physical Shelves Matrix */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-brand-500" />
              <h2 className="text-base font-bold text-slate-900">Online Pickup Zone (24 Physical Shelves)</h2>
            </div>
            <p className="text-xs text-slate-500">
              Finite physical shelf capacity. Coordinator assigns cubby upon full multi-counter consolidation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {shelfSummary.availableCount} Available
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {shelfSummary.occupiedCount} Occupied
            </span>
          </div>
        </div>

        {/* 24-Cubby Grid (Zones A, B, C, D) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {['A', 'B', 'C', 'D'].map((zoneKey) => {
            const zoneShelves = pickupShelves.filter((s) => s.zone === zoneKey);
            return (
              <div key={zoneKey} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-slate-600 flex justify-between">
                  <span>Zone {zoneKey}</span>
                  <span className="text-[10px] text-slate-400">6 Cubbies</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {zoneShelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className={`p-2 rounded-lg text-center font-mono text-xs font-bold transition-all ${
                        shelf.isOccupied
                          ? 'bg-rose-500 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-500'
                      }`}
                      title={shelf.isOccupied ? `Occupied by Order ${shelf.currentOrderId}` : 'Available'}
                    >
                      {shelf.shelfCode}
                      {shelf.isOccupied && (
                        <div className="text-[9px] font-sans font-normal opacity-90 truncate">Order Active</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
