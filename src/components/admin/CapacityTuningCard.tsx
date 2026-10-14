'use client';

/**
 * CanteenOS — Dual-Channel Capacity Tuning Component
 * Allows canteen administrators to configure the Online vs Walk-in split (e.g. 70/30)
 * and scale operational quotas per 10-minute dinner window.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { Sliders, Save, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';

export function CapacityTuningCard() {
  const { pickupSlots } = useCanteenStore();

  const [onlinePercentage, setOnlinePercentage] = useState(70);
  const [totalSlotCapacity, setTotalSlotCapacity] = useState(100);
  const [isSaved, setIsSaved] = useState(false);

  const walkinPercentage = 100 - onlinePercentage;
  const computedOnlineQuota = Math.round((totalSlotCapacity * onlinePercentage) / 100);
  const computedWalkinQuota = totalSlotCapacity - computedOnlineQuota;

  const handleSaveTuning = () => {
    // In our live store, update pickup slot allocations dynamically
    const store = useCanteenStore.getState();
    const updated = store.pickupSlots.map((s) => ({
      ...s,
      totalCapacity: totalSlotCapacity,
      onlineCapacityQuota: computedOnlineQuota,
      walkinCapacityQuota: computedWalkinQuota,
    }));

    useCanteenStore.setState({ pickupSlots: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Title & Rule Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Dual-Channel Capacity Allocator
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance physical canteen counter traffic with digital student pre-orders
          </p>
        </div>

        {isSaved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-scale">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Allocations Updated
          </span>
        )}
      </div>

      {/* Critical Business Rule Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          Dual-Channel Operational Rule:
        </span>
        <p className="text-[11px] leading-relaxed">
          Online pre-orders can never consume 100% of operational capacity. A dedicated portion (default: 30%) is strictly reserved for physical walk-in students and faculty queuing at Counter 3.
        </p>
      </div>

      {/* Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Split Ratio Slider */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-500">Channel Split Ratio</span>
            <span className="text-xs font-extrabold text-slate-900">
              {onlinePercentage}% Online / {walkinPercentage}% Walk-in
            </span>
          </div>

          <input
            type="range"
            min="40"
            max="90"
            step="5"
            value={onlinePercentage}
            onChange={(e) => setOnlinePercentage(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Online Quota</div>
              <div className="text-lg font-black text-brand-600">{computedOnlineQuota} orders/slot</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Walk-in Quota</div>
              <div className="text-lg font-black text-teal-600">{computedWalkinQuota} orders/slot</div>
            </div>
          </div>
        </div>

        {/* Total Slot Capacity Stepper */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-slate-500">Total Slot Kitchen Capacity</span>
            <span className="text-xs font-extrabold text-slate-900">{totalSlotCapacity} Portions/10-Min</span>
          </div>

          <div className="flex items-center gap-3">
            {[80, 100, 120, 150].map((cap) => (
              <button
                key={cap}
                onClick={() => setTotalSlotCapacity(cap)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  totalSlotCapacity === cap
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cap}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500">
            Scale up kitchen capacity during campus tech fests, convocation, or exam dinner breaks.
          </p>
        </div>
      </div>

      {/* Save Trigger */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSaveTuning}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Apply Tuning to Live Slots</span>
        </button>
      </div>
    </div>
  );
}
