'use client';

/**
 * CanteenOS — Student Order History & Receipts
 * Historical orders, completed pickups, cancellation credit notes, and digital receipts.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { History, CheckCircle2, XCircle, ArrowRight, Receipt, FileText } from 'lucide-react';

export default function StudentHistoryPage() {
  const { orders, activePersona } = useCanteenStore();

  const userOrders = orders.filter((o) => o.userId === activePersona.id);
  const pastOrders = userOrders.filter((o) =>
    ['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-900">
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Past completed dinner orders and digital receipts
          </p>
        </div>

        {pastOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
              <History className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">No past orders yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Completed and collected orders will be archived here for easy re-ordering and receipts.
              </p>
            </div>
            <Link
              href="/student/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-2xl font-bold text-xs shadow-sm"
            >
              <span>Explore Dinner Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pastOrders.map((order) => {
              const isCollected = order.orderStatus === 'COLLECTED';
              const isCancelled = order.orderStatus.startsWith('CANCELLED');

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        #{order.tokenNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {order.slotDisplayLabel}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isCollected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCollected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{order.orderStatus.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.itemName}</span>
                        <span className="font-mono text-slate-500">₹{item.unitPrice * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Total: ₹{order.totalAmount}</div>
                      <div className="text-[11px] text-slate-400">Paid via {order.paymentMode}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/orders/${order.id}`}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
