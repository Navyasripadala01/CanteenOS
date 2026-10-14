'use client';

/**
 * CanteenOS — Dedicated Capacity & Quota Management Page
 * Slot-by-slot capacity distribution and dish-level kitchen limit constraints.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CapacityTuningCard } from '@/components/admin/CapacityTuningCard';
import { Sliders, Save, CheckCircle2, Clock, Utensils, ShieldCheck } from 'lucide-react';

export default function AdminCapacityPage() {
  const { pickupSlots, slotItemCapacities } = useCanteenStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Capacity & Slot Quotas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dual-channel online vs walk-in distribution and station thresholds
          </p>
        </div>

        {/* Capacity Tuner Component */}
        <CapacityTuningCard />

        {/* Slot-by-Slot Detailed Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">10-Minute Dinner Slot Quotas</h3>
              <p className="text-xs text-slate-500">Live booking distribution across demand windows</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Slot Window</th>
                  <th className="pb-3">Total Quota</th>
                  <th className="pb-3">Online Quota (70%)</th>
                  <th className="pb-3">Walk-in Quota (30%)</th>
                  <th className="pb-3">Online Booked</th>
                  <th className="pb-3">Walk-in Booked</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pickupSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 font-bold text-slate-900">{slot.displayLabel}</td>
                    <td className="py-3.5 font-mono">{slot.totalCapacity}</td>
                    <td className="py-3.5 font-mono text-brand-600 font-bold">{slot.onlineCapacityQuota}</td>
                    <td className="py-3.5 font-mono text-teal-600 font-bold">{slot.walkinCapacityQuota}</td>
                    <td className="py-3.5 font-mono">{slot.currentOnlineBookings}</td>
                    <td className="py-3.5 font-mono">{slot.currentWalkinBookings}</td>
                    <td className="py-3.5">
                      {slot.currentOnlineBookings >= slot.onlineCapacityQuota ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Online Full (100%)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Available
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
