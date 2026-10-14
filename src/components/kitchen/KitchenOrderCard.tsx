'use client';

/**
 * CanteenOS — Kitchen Order Card (KDS Ticket)
 * Touch-optimized ticket card with large typography, status toggles,
 * JIT beverage staging advice, and operational delay buttons.
 */

import React from 'react';
import { Order, OrderItem, ItemPrepStatus } from '@/types';
import { useCanteenStore } from '@/store/canteenStore';
import { getJITDrinkStagingAdvice } from '@/lib/routingEngine';
import {
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  AlertTriangle,
  Flame,
  Send,
  Coffee,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface KitchenOrderCardProps {
  order: Order;
  counterFilter: string; // 'ALL' | 'cnt-01' | 'cnt-02' | 'cnt-03'
}

export function KitchenOrderCard({ order, counterFilter }: KitchenOrderCardProps) {
  const { updateItemPrepStatus, flagOrderDelay } = useCanteenStore();

  // Filter items relevant to the selected counter (or show all)
  const stationItems = order.items.filter((item) =>
    counterFilter === 'ALL' ? true : item.counterId === counterFilter
  );

  if (stationItems.length === 0) return null;

  const isFastStation = counterFilter === 'cnt-03';
  const jitAdvice = isFastStation ? getJITDrinkStagingAdvice(order) : null;

  const handleNextStatus = (item: OrderItem) => {
    let nextStatus: ItemPrepStatus = 'PREPARING';
    if (item.itemStatus === 'QUEUED') {
      nextStatus = 'PREPARING';
    } else if (item.itemStatus === 'PREPARING') {
      nextStatus = 'READY_AT_COUNTER';
    } else if (item.itemStatus === 'READY_AT_COUNTER') {
      nextStatus = 'TRANSFERRED_TO_PICKUP';
    }
    updateItemPrepStatus(order.id, item.id, nextStatus);
  };

  const handleRollbackStatus = (item: OrderItem) => {
    let prevStatus: ItemPrepStatus = 'QUEUED';
    if (item.itemStatus === 'TRANSFERRED_TO_PICKUP') {
      prevStatus = 'READY_AT_COUNTER';
    } else if (item.itemStatus === 'READY_AT_COUNTER') {
      prevStatus = 'PREPARING';
    } else if (item.itemStatus === 'PREPARING') {
      prevStatus = 'QUEUED';
    }
    updateItemPrepStatus(order.id, item.id, prevStatus);
  };

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-md ${
        order.isDelayed
          ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      <div className="space-y-3">
        {/* Ticket Header: Large Token & Slot Window */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Order Token</span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-brand-400 tracking-tight">
              #{order.tokenNumber}
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Target Slot</span>
            <div className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              {order.slotDisplayLabel}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
              {order.userName} {order.isWalkinOrder && '• Walk-in POS'}
            </div>
          </div>
        </div>

        {/* JIT Staging Advice for Fast Items (Counter 3) */}
        {jitAdvice && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
              jitAdvice.shouldPrepareFastItem
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Coffee className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-tight font-medium">{jitAdvice.message}</span>
          </div>
        )}

        {/* Item Checklist */}
        <div className="space-y-2.5 pt-1">
          {stationItems.map((item) => {
            const isQueued = item.itemStatus === 'QUEUED';
            const isPrep = item.itemStatus === 'PREPARING';
            const isReady = item.itemStatus === 'READY_AT_COUNTER';
            const isTransferred = item.itemStatus === 'TRANSFERRED_TO_PICKUP';

            return (
              <div
                key={item.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5">
                  <div className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                    <span className="text-brand-400 font-mono text-base font-black">×{item.quantity}</span>
                    <span>{item.itemName}</span>
                  </div>
                  {item.friendName && (
                    <div className="text-[11px] font-semibold text-brand-300">
                      Friend: {item.friendName}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="uppercase font-mono">{item.itemStatus.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Step Transition Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {!isQueued && (
                    <button
                      onClick={() => handleRollbackStatus(item)}
                      title="Undo status transition"
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleNextStatus(item)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                      isQueued
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                        : isPrep
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
                        : isReady
                        ? 'bg-blue-500 hover:bg-blue-400 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-default'
                    }`}
                  >
                    {isQueued && (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-900" />
                        <span>Start Prep</span>
                      </>
                    )}
                    {isPrep && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </>
                    )}
                    {isReady && (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Pickup</span>
                      </>
                    )}
                    {isTransferred && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>At Pickup Table</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls: Add +5 Min Delay */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="text-[11px] text-slate-400">
          {order.isDelayed ? (
            <span className="text-amber-400 font-bold">Delay: +{order.delayMinutes}m broadcasted</span>
          ) : (
            <span>On schedule</span>
          )}
        </div>

        <button
          onClick={() => flagOrderDelay(order.id, 5)}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors"
        >
          <Clock className="w-3 h-3" />
          <span>+5m Delay</span>
        </button>
      </div>
    </div>
  );
}
