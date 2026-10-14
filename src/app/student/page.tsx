'use client';

/**
 * CanteenOS — Student Home Dashboard
 * Responsive mobile-first interface featuring rush forecasting, smart slot picker,
 * popular items, active order alert, and sticky bottom navigation.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { RushStatusCard } from '@/components/student/RushStatusCard';
import { CategoryFilter } from '@/components/student/CategoryFilter';
import { MenuItemCard } from '@/components/student/MenuItemCard';
import { MenuItem, DietaryType } from '@/types';
import { ShoppingBag, ArrowRight, Clock, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function StudentHomePage() {
  const { menuItems, cart, orders, activePersona } = useCanteenStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | 'ALL'>('ALL');

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedDietary !== 'ALL' && item.dietaryType !== selectedDietary) return false;
    return true;
  });

  // Check if student has active orders
  const activeOrder = orders.find(
    (o) =>
      o.userId === activePersona.id &&
      !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-900">
      {/* Top App Bar */}
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* Active Order Alert Card (If an order is currently in progress) */}
        {activeOrder && (
          <Link
            href={`/student/orders/${activeOrder.id}`}
            className="block bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-800 hover:bg-slate-800/95 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs uppercase tracking-wider font-mono text-emerald-400 font-bold">
                  ACTIVE ORDER TRACKER
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {activeOrder.slotDisplayLabel}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Order #{activeOrder.tokenNumber}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-500 text-white">
                    {activeOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeOrder.shelfId
                    ? `Ready at ${activeOrder.shelfId} • Tap to show QR`
                    : `${activeOrder.items.length} items preparing across kitchen counters`}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </Link>
        )}

        {/* Live Rush Status & Smart Slot Banner */}
        <RushStatusCard />

        {/* Categories and Filters */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Today's Dinner Menu</h3>
              <p className="text-xs text-slate-500">Live portions from Counters 1, 2, and 3</p>
            </div>
            <Link
              href="/student/menu"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All ({menuItems.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedDietary={selectedDietary}
            onSelectDietary={setSelectedDietary}
          />

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>

      {/* Sticky Floating Cart Strip when Cart has items */}
      {totalCartCount > 0 && (
        <aside aria-label="Cart Summary" className="fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-md bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs text-slate-400">Total in Cart</div>
                <div className="text-base font-extrabold text-white">₹{cartSubtotal}</div>
              </div>
            </div>

            <Link
              href="/student/cart"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              <span>View Cart & Slots</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      )}

      {/* Floating Bottom Navigation */}
      <StudentBottomNav />
    </div>
  );
}
