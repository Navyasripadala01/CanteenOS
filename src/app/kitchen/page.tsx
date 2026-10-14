'use client';

/**
 * CanteenOS — Kitchen Display System (KDS) Main Portal
 * Multi-counter station filtering, slot batch aggregation, and Kanban tickets.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { KitchenHeader } from '@/components/kitchen/KitchenHeader';
import { SlotBatchAggregator } from '@/components/kitchen/SlotBatchAggregator';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { Layers, Grid, Flame, Clock, RefreshCw, Sparkles, Filter } from 'lucide-react';

export default function KitchenKDSPage() {
  const { orders, pickupSlots, activePersona } = useCanteenStore();

  const [selectedCounter, setSelectedCounter] = useState<string>(
    activePersona.counterId || 'ALL'
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot-1930'); // Default to 7:30-7:40 slot
  const [viewMode, setViewMode] = useState<'BATCH' | 'TICKETS'>('BATCH');

  // Filter orders relevant to slot and counter
  const slotOrders = orders.filter(
    (o) =>
      o.pickupSlotId === selectedSlotId &&
      !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  const relevantOrders = slotOrders.filter((order) => {
    if (selectedCounter === 'ALL') return true;
    return order.items.some((item) => item.counterId === selectedCounter);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* KDS Header */}
      <KitchenHeader
        selectedCounter={selectedCounter}
        onSelectCounter={setSelectedCounter}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Controls Bar: 10-Minute Slot Window Selector & View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
          {/* Slot Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              Slot:
            </span>
            {pickupSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const slotOrdersCount = orders.filter(
                (o) =>
                  o.pickupSlotId === slot.id &&
                  !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
              ).length;

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  <span>{slot.displayLabel}</span>
                  {slotOrdersCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-brand-700 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {slotOrdersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl self-start md:self-auto text-xs font-bold">
            <button
              onClick={() => setViewMode('BATCH')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'BATCH'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Totals</span>
            </button>

            <button
              onClick={() => setViewMode('TICKETS')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'TICKETS'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tickets ({relevantOrders.length})</span>
            </button>
          </div>
        </div>

        {/* Primary View: Batch Aggregator */}
        <SlotBatchAggregator
          selectedSlotId={selectedSlotId}
          selectedCounter={selectedCounter}
        />

        {/* Secondary View: Individual Order Tickets */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Individual Station Tickets</h3>
              <p className="text-xs text-slate-400">
                Live queue for {selectedCounter === 'ALL' ? 'All Counters' : selectedCounter}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
              {relevantOrders.length} Active Orders
            </span>
          </div>

          {relevantOrders.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-600" />
              <div className="font-bold text-sm text-slate-400">No pending orders in this slot window</div>
              <p>Switch to another 10-minute pickup slot or choose All Counters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relevantOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  counterFilter={selectedCounter}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
