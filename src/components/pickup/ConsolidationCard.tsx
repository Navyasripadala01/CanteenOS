'use client';

/**
 * CanteenOS — Order Consolidation Card
 * Staging checklist across Counter 1, 2, and 3 items before physical shelf placement.
 */

import React, { useState } from 'react';
import { Order } from '@/types';
import { useCanteenStore } from '@/store/canteenStore';
import {
  Box,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Utensils,
  Coffee,
  HelpCircle,
} from 'lucide-react';

interface ConsolidationCardProps {
  order: Order;
  onAssignCustomShelf?: (orderId: string) => void;
}

export function ConsolidationCard({ order, onAssignCustomShelf }: ConsolidationCardProps) {
  const { assignShelfToOrder, recordException } = useCanteenStore();
  const [isAssigning, setIsAssigning] = useState(false);
  const [missingFlagged, setMissingFlagged] = useState(false);

  // Check readiness of all items
  const totalItemsCount = order.items.length;
  const arrivedItemsCount = order.items.filter(
    (i) => i.itemStatus === 'TRANSFERRED_TO_PICKUP' || i.itemStatus === 'READY_AT_COUNTER'
  ).length;

  const isAllArrived = arrivedItemsCount === totalItemsCount;
  const isReadyForPickup = order.orderStatus === 'READY_FOR_PICKUP';

  const handleAutoAssignShelf = () => {
    setIsAssigning(true);
    const res = assignShelfToOrder(order.id);
    setIsAssigning(false);
  };

  const handleFlagMissing = (itemDescription: string) => {
    recordException(
      'MISSING_ITEM',
      `Item '${itemDescription}' reported missing at Online Consolidation Table for Order #${order.tokenNumber}`,
      order.id
    );
    setMissingFlagged(true);
  };

  return (
    <div
      className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
        isReadyForPickup
          ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
          : isAllArrived
          ? 'bg-slate-900 border-brand-500/60 ring-1 ring-brand-500/40 text-white'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      <div className="space-y-3">
        {/* Header: Token & Slot */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Order Token</span>
            <div className="text-3xl font-black font-mono text-brand-400">
              #{order.tokenNumber}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {order.userName} {order.isWalkinOrder && '• Walk-in'}
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              {order.slotDisplayLabel}
            </span>
            {order.shelfId ? (
              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-700">
                📍 {order.shelfId} (PIN: {order.pickupPin})
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                {arrivedItemsCount}/{totalItemsCount} items at staging
              </div>
            )}
          </div>
        </div>

        {/* Multi-Counter Item Readiness List */}
        <div className="space-y-2 pt-1">
          {order.items.map((item) => {
            const isItemArrived =
              item.itemStatus === 'TRANSFERRED_TO_PICKUP' || item.itemStatus === 'READY_AT_COUNTER';

            const counterLabel =
              item.counterId === 'cnt-01'
                ? 'Counter 1 (Biryani)'
                : item.counterId === 'cnt-02'
                ? 'Counter 2 (Meals)'
                : 'Counter 3 (Drinks)';

            return (
              <div
                key={item.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="text-brand-400 font-mono font-bold">×{item.quantity}</span>
                    <span>{item.itemName}</span>
                    {item.friendName && (
                      <span className="text-[10px] text-brand-300 font-semibold">({item.friendName})</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{counterLabel}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isItemArrived
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {isItemArrived ? '✓ At Pickup Staging' : 'Cooking in Kitchen'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {missingFlagged && (
          <div className="p-2 bg-amber-950/60 border border-amber-600 rounded-xl text-[11px] text-amber-200">
            ⚠️ Missing item flagged to kitchen supervisor.
          </div>
        )}
      </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          {!order.shelfId ? (
            <button
              onClick={handleAutoAssignShelf}
              disabled={!isAllArrived || isAssigning}
              className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Box className="w-4 h-4" />
              <span>
                {isAllArrived
                  ? 'Consolidate & Auto-Assign Shelf'
                  : `Waiting for ${totalItemsCount - arrivedItemsCount} item(s)`}
              </span>
            </button>
          ) : (
            <div className="w-full py-2.5 px-3 bg-emerald-950/60 border border-emerald-600 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Staged in {order.shelfId}
              </span>
              <span className="font-mono text-emerald-400">PIN: {order.pickupPin}</span>
            </div>
          )}

          {!order.shelfId && !missingFlagged && (
            <button
              onClick={() => handleFlagMissing(order.items[0]?.itemName || 'Dish')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 rounded-2xl border border-slate-700 transition-colors"
              title="Report missing item to kitchen"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
    </div>
  );
}
