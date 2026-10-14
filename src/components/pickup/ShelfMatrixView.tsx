'use client';

/**
 * CanteenOS — 24-Cubby Physical Shelf Matrix View
 * Visualizes Zone A, B, C, D physical shelves with live occupancy and manual release.
 */

import React from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { getShelfMatrixSummary } from '@/lib/shelfEngine';
import { Box, CheckCircle2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ShelfMatrixViewProps {
  onSelectShelf?: (shelfId: string) => void;
  selectedShelfId?: string | null;
}

export function ShelfMatrixView({ onSelectShelf, selectedShelfId }: ShelfMatrixViewProps) {
  const { pickupShelves, orders } = useCanteenStore();
  const summary = getShelfMatrixSummary(pickupShelves);

  const zones: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-black tracking-tight text-white">
              Physical Shelf Cubbies (24 Shelves Matrix)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Physical shelving racks at the Online Pickup Zone. Orders staged here are ready for QR collection.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            {summary.availableCount} Available
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
            {summary.occupiedCount} Occupied
          </span>
        </div>
      </div>

      {/* Overflow Alert if 100% Full */}
      {summary.isZoneFull && (
        <div className="p-4 bg-rose-950/70 border border-rose-500 rounded-2xl flex items-start gap-3 text-xs text-rose-200 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm text-white">Pickup Zone at 100% Physical Capacity (24/24)!</span>
            <p className="text-xs text-rose-300 mt-0.5">
              All 24 shelving cubbies are occupied. Additional consolidated orders are safely queued until students scan and collect their food.
            </p>
          </div>
        </div>
      )}

      {/* 4-Zone Matrix (Zone A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zoneKey) => {
          const zoneShelves = pickupShelves.filter((s) => s.zone === zoneKey);
          const occupiedInZone = zoneShelves.filter((s) => s.isOccupied).length;

          return (
            <div
              key={zoneKey}
              className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-700/60">
                <span className="uppercase tracking-wider font-mono">ZONE {zoneKey}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {occupiedInZone}/6 Occupied
                </span>
              </div>

              {/* 6 Cubbies in 2x3 Grid */}
              <div className="grid grid-cols-2 gap-2">
                {zoneShelves.map((shelf) => {
                  const assignedOrder = shelf.currentOrderId
                    ? orders.find((o) => o.id === shelf.currentOrderId)
                    : null;

                  const isSelected = selectedShelfId === shelf.id;

                  return (
                    <div
                      key={shelf.id}
                      onClick={() => !shelf.isOccupied && onSelectShelf?.(shelf.id)}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between h-20 transition-all ${
                        shelf.isOccupied
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                          : isSelected
                          ? 'bg-brand-500 text-white border-brand-400 ring-2 ring-white/30 cursor-pointer'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-brand-500 hover:bg-slate-850 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black">{shelf.shelfCode}</span>
                        {shelf.isOccupied ? (
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>

                      {shelf.isOccupied && assignedOrder ? (
                        <div>
                          <div className="font-mono font-extrabold text-xs text-white">
                            #{assignedOrder.tokenNumber}
                          </div>
                          <div className="text-[10px] text-rose-300 truncate max-w-[80px]">
                            {assignedOrder.userName.split(' ')[0]}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-medium">
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
