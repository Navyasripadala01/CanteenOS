'use client';

/**
 * CanteenOS — Online Pickup Hub Dashboard
 * Multi-counter order consolidation queue & interactive 24-shelf matrix.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { PickupHeader } from '@/components/pickup/PickupHeader';
import { ShelfMatrixView } from '@/components/pickup/ShelfMatrixView';
import { ConsolidationCard } from '@/components/pickup/ConsolidationCard';
import { Box, QrCode, Layers, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function PickupHubPage() {
  const { orders, pickupSlots } = useCanteenStore();

  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);

  // Orders that are preparing or ready for pickup
  const activeOrders = orders.filter(
    (o) =>
      !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <PickupHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Overview Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-brand-500" />
              <span>Multi-Counter Consolidation & Shelf Dispatch</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidate parallel kitchen dishes into 1 student pickup cubby.
            </p>
          </div>

          <Link
            href="/pickup/scanner"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Open Pickup Verification Kiosk</span>
          </Link>
        </div>

        {/* 24 Physical Shelves Matrix */}
        <ShelfMatrixView
          selectedShelfId={selectedShelfId}
          onSelectShelf={setSelectedShelfId}
        />

        {/* Staging & Consolidation Pipeline */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Active Consolidation Queue</h3>
              <p className="text-xs text-slate-400">
                Orders arriving from Counters 1 (Biryani), 2 (Meals), and 3 (Drinks)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
              {activeOrders.length} In-Flight Orders
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="font-bold text-sm text-slate-300">All orders consolidated and collected!</div>
              <p>New orders will automatically appear here as kitchen counters finish cooking.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
                <ConsolidationCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
