'use client';

/**
 * CanteenOS — Student Active Orders List
 * Displays live orders with status badges, counter item checklists, and tracking links.
 */

import React from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { Clock, Box, QrCode, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react';

export default function StudentOrdersPage() {
  const { orders, activePersona } = useCanteenStore();

  const userOrders = orders.filter((o) => o.userId === activePersona.id);
  const activeOrders = userOrders.filter(
    (o) => !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-900">
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-counter tracking and online shelf pickup
          </p>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">No active orders right now</h3>
              <p className="text-xs text-slate-500 mt-1">
                When you place a dinner order, its multi-counter progress and shelf assignment will appear here.
              </p>
            </div>
            <Link
              href="/student/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs shadow-sm transition-all"
            >
              <span>Browse Dinner Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const isReady = order.orderStatus === 'READY_FOR_PICKUP';
              const isPreparing = order.orderStatus === 'PREPARING';

              return (
                <Link
                  key={order.id}
                  href={`/student/orders/${order.id}`}
                  className="block bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all space-y-4 group"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-xl border border-brand-200">
                        #{order.tokenNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {order.slotDisplayLabel}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isReady
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                          : isPreparing
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Ready shelf callout if ready */}
                  {order.shelfId && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <Box className="w-4 h-4 text-emerald-600" />
                        <span>Pickup at {order.shelfId}</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold">
                        PIN: {order.pickupPin}
                      </span>
                    </div>
                  )}

                  {/* Items preview */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.quantity}x {item.itemName}</span>
                          {item.friendName && (
                            <span className="text-[10px] text-brand-600 font-medium">({item.friendName})</span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.itemStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Total: ₹{order.totalAmount}</span>
                    <span className="text-brand-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Open Live Tracker & QR</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
