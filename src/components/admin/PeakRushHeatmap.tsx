'use client';

/**
 * CanteenOS — Peak Dinner Rush Heatmap & Demand Balancing
 * Visualizes 10-minute interval capacity utilization across 7:00–8:00 PM dinner service.
 */

import React from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { computeAllSlotAvailability } from '@/lib/capacityEngine';
import { Flame, Clock, Users, ArrowUpRight, Sparkles } from 'lucide-react';

export function PeakRushHeatmap() {
  const { pickupSlots } = useCanteenStore();
  const slotAvailability = computeAllSlotAvailability(pickupSlots);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Dinner Demand Balancing Heatmap (7:00 PM – 8:00 PM)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            10-Minute interval smoothing for ~500 hostel students capacity model
          </p>
        </div>

        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          6 Active Dinner Windows
        </span>
      </div>

      {/* 6-Slot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {slotAvailability.map((slot) => {
          const isHigh = slot.rushLevel === 'HIGH';
          const isModerate = slot.rushLevel === 'MODERATE';
          const isLow = slot.rushLevel === 'LOW';

          const heatBg = isHigh
            ? 'bg-rose-50/70 border-rose-200'
            : isModerate
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-emerald-50/70 border-emerald-200';

          const progressColor = isHigh
            ? 'bg-rose-500'
            : isModerate
            ? 'bg-amber-500'
            : 'bg-emerald-500';

          return (
            <div
              key={slot.slotId}
              className={`p-4 rounded-2xl border ${heatBg} transition-all space-y-3 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold text-sm text-slate-900">{slot.displayLabel}</span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isHigh
                      ? 'bg-rose-100 text-rose-800'
                      : isModerate
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {slot.rushLevel} RUSH ({slot.totalOccupancyPercent}%)
                </span>
              </div>

              {/* Occupancy Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Online Pre-Orders (70 max):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {slot.currentOnlineBookings} / {slot.onlineQuota}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Walk-in Counter 3 (30 max):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {slot.currentWalkinBookings} / {slot.walkinQuota}
                  </span>
                </div>
              </div>

              {/* Visual Heat Bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-2 rounded-full bg-white/80 overflow-hidden border border-black/5">
                  <div
                    className={`h-full ${progressColor} transition-all duration-300`}
                    style={{ width: `${Math.min(100, slot.totalOccupancyPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Capacity: {slot.totalOccupancyPercent}% consumed</span>
                  <span>{slot.isOnlineFull ? '100% Online Full' : `${slot.onlineAvailable} online open`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
