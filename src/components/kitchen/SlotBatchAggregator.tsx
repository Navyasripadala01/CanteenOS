'use client';

/**
 * CanteenOS — Slot Batch Preparation Aggregator
 * Aggregates cooking requirements for a specific 10-minute slot window across orders,
 * providing one-tap batch transitions (Start Batch -> Mark Ready).
 */

import React from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { aggregateBatchBySlot } from '@/lib/routingEngine';
import { Flame, Clock, CheckCircle2, Play, ArrowRight, Sparkles, Layers } from 'lucide-react';

interface SlotBatchAggregatorProps {
  selectedSlotId: string;
  selectedCounter: string; // 'ALL' | 'cnt-01' | 'cnt-02' | 'cnt-03'
}

export function SlotBatchAggregator({ selectedSlotId, selectedCounter }: SlotBatchAggregatorProps) {
  const { orders, pickupSlots, batchUpdateSlotStatus } = useCanteenStore();

  const slot = pickupSlots.find((s) => s.id === selectedSlotId);
  const counterFilter = selectedCounter === 'ALL' ? undefined : selectedCounter;
  const batchData = aggregateBatchBySlot(orders, selectedSlotId, counterFilter);

  const totalPortions = batchData.items.reduce((sum, i) => sum + i.totalQuantityNeeded, 0);

  const handleStartBatch = () => {
    if (selectedCounter === 'ALL') {
      ['cnt-01', 'cnt-02', 'cnt-03'].forEach((cntId) => {
        batchUpdateSlotStatus(selectedSlotId, cntId, 'PREPARING');
      });
    } else {
      batchUpdateSlotStatus(selectedSlotId, selectedCounter, 'PREPARING');
    }
  };

  const handleMarkBatchReady = () => {
    if (selectedCounter === 'ALL') {
      ['cnt-01', 'cnt-02', 'cnt-03'].forEach((cntId) => {
        batchUpdateSlotStatus(selectedSlotId, cntId, 'TRANSFERRED_TO_PICKUP');
      });
    } else {
      batchUpdateSlotStatus(selectedSlotId, selectedCounter, 'TRANSFERRED_TO_PICKUP');
    }
  };

  if (batchData.items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-400 text-xs">
        No active preparation items queued for this counter in slot {slot?.displayLabel || 'selected window'}.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-brand-400 font-mono">
              NEXT COOKING BATCH
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {batchData.slotDisplayLabel}
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white mt-1">
            Aggregated Cooking Total: <span className="text-brand-400">{totalPortions} Portions</span>
          </h3>
          <p className="text-xs text-slate-400">
            Across {batchData.totalOrders} individual student orders
          </p>
        </div>

        {/* 1-Tap Batch Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartBatch}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-amber-300" />
            <span>Start Batch Cooking</span>
          </button>
          <button
            onClick={handleMarkBatchReady}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark All Ready</span>
          </button>
        </div>
      </div>

      {/* Batch Item Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {batchData.items.map((item) => (
          <div
            key={item.menuItemId}
            className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-start justify-between gap-3 relative overflow-hidden"
          >
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-100">{item.itemName}</div>
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-1 items-center">
                <span>Orders:</span>
                {item.orderTokens.map((tok) => (
                  <span
                    key={tok}
                    className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-700 text-slate-200"
                  >
                    #{tok}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black font-mono text-brand-400">
                ×{item.totalQuantityNeeded}
              </div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total portions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
