'use client';

/**
 * CanteenOS — Rush Status & Recommended Slot Banner
 * Dynamic rush indicator with explanation and 1-tap optimal slot reservation.
 */

import React from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { computeCampusRushOverview } from '@/lib/capacityEngine';
import { Clock, Flame, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function RushStatusCard() {
  const { activePersona, pickupSlots, selectedSlotId, setSelectedSlotId } = useCanteenStore();
  const rushOverview = computeCampusRushOverview(pickupSlots);

  const recommendedSlot = rushOverview.nextRecommendedSlot;
  const isRecSelected = selectedSlotId === recommendedSlot?.id;

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Greeting & Time Window */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dinner Service • 7:00 PM – 8:00 PM
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Good evening, {activePersona.name.split(' ')[0]} 👋
          </h2>
        </div>

        {/* Rush Badge */}
        <div className="self-start sm:self-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs ${
              rushOverview.overallRushLevel === 'HIGH'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : rushOverview.overallRushLevel === 'MODERATE'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{rushOverview.overallRushLevel} RUSH</span>
            <span className="opacity-40">•</span>
            <span>~{rushOverview.averageWaitMinutes} min wait</span>
          </div>
        </div>
      </div>

      {/* Demand & Capacity Explanation */}
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        Demand redistribution is active for peak dinner break (~500 students). Pre-ordering reserves your kitchen batch and guarantees a designated pickup cubby at the Online Zone.
      </p>

      {/* Recommended Pickup Slot Highlight */}
      {recommendedSlot && (
        <div className="bg-brand-50/60 border border-brand-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  Recommended Pickup Window
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">
                  FASTEST
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {recommendedSlot.displayLabel}
              </div>
              <div className="text-xs text-slate-500">
                Uncrowded batch capacity ({recommendedSlot.onlineCapacityQuota - recommendedSlot.currentOnlineBookings} online slots open)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isRecSelected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300/60 px-3.5 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                Slot Selected
              </span>
            ) : (
              <button
                onClick={() => setSelectedSlotId(recommendedSlot.id)}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <span>Select This Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
