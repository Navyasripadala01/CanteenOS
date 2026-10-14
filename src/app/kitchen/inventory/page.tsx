'use client';

/**
 * CanteenOS — Kitchen Inventory & Emergency 86 (Stockout) Control
 * Real-time daily prepared quantity adjustments and emergency item disable switches.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { KitchenHeader } from '@/components/kitchen/KitchenHeader';
import { MenuItem } from '@/types';
import {
  SlidersHorizontal,
  Plus,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  Utensils,
  Search,
} from 'lucide-react';

export default function KitchenInventoryPage() {
  const { menuItems, toggleItemSoldOut, activePersona } = useCanteenStore();

  const [selectedCounter, setSelectedCounter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter((item) => {
    if (selectedCounter !== 'ALL' && item.counterId !== selectedCounter) return false;
    if (
      searchQuery.trim() !== '' &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <KitchenHeader
        selectedCounter={selectedCounter}
        onSelectCounter={setSelectedCounter}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Title & Emergency Notice */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-brand-500" />
              <span>Live Inventory & Emergency 86 Management</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle instant out-of-stock switches to prevent students from ordering depleted dishes.
            </p>
          </div>
        </div>

        {/* Search & Station Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Inventory Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const remaining = Math.max(0, item.dailyPreparedQty - item.committedQty);
            const isSoldOut = item.isSoldOut || remaining === 0;

            const counterLabel =
              item.counterId === 'cnt-01'
                ? 'Counter 1 (Biryani & Rice)'
                : item.counterId === 'cnt-02'
                ? 'Counter 2 (Meals & Chapati)'
                : 'Counter 3 (Snacks & Drinks)';

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                  isSoldOut
                    ? 'bg-slate-900/60 border-rose-900/40 opacity-85'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {counterLabel}
                    </span>
                    <span className="text-xs font-bold text-white">₹{item.price}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-white">{item.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                </div>

                {/* Stock Stats */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Prepared Today:</span>
                    <span className="font-mono font-bold text-slate-200">{item.dailyPreparedQty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Committed / Sold:</span>
                    <span className="font-mono font-bold text-brand-400">{item.committedQty}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-700 font-bold">
                    <span className="text-slate-300">Remaining Available:</span>
                    <span className={remaining < 10 ? 'font-mono text-amber-400' : 'font-mono text-emerald-400'}>
                      {remaining} portions
                    </span>
                  </div>
                </div>

                {/* Emergency 86 / Sold Out Button */}
                <div className="pt-2">
                  <button
                    onClick={() => toggleItemSoldOut(item.id)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                      isSoldOut
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {isSoldOut ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Reactivate Dish (Mark In Stock)</span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="w-4 h-4" />
                        <span>Emergency 86 (Mark Sold Out)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
