'use client';

/**
 * CanteenOS — Live Order Tracker & Single Pickup Screen
 * Real-time multi-counter status stepper, shelf assignment (e.g. Shelf A3),
 * dynamic QR code, and 4-digit PIN verification.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { CancellationModal } from '@/components/student/CancellationModal';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Box,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Sparkles,
  Info,
  Utensils,
  User,
} from 'lucide-react';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const { orders } = useCanteenStore();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-900">
        <StudentHeader />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested order could not be located in the current session.
          </p>
          <Link
            href="/student/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-2xl font-bold text-xs shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Orders</span>
          </Link>
        </main>
        <StudentBottomNav />
      </div>
    );
  }

  const isPlaced = order.orderStatus === 'PLACED';
  const isPreparing = order.orderStatus === 'PREPARING';
  const isReady = order.orderStatus === 'READY_FOR_PICKUP' || order.orderStatus === 'READY_FOR_CONSOLIDATION';
  const isCollected = order.orderStatus === 'COLLECTED';
  const isCancelled = order.orderStatus === 'CANCELLED_BY_STUDENT' || order.orderStatus === 'CANCELLED_BY_CANTEEN';

  // Step indices
  const currentStep = isCollected ? 4 : isReady ? 3 : isPreparing ? 2 : 1;

  const canCancel = isPlaced;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-900">
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/student/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Orders</span>
          </Link>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Scheduled Slot</span>
            <div className="text-xs font-bold text-slate-900">{order.slotDisplayLabel}</div>
          </div>
        </div>

        {/* Operational Delay Alert */}
        {order.isDelayed && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3 text-xs text-amber-900 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Kitchen Preparation Notice:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Kitchen station added +{order.delayMinutes || 5} minutes for batch cooking. Your designated pickup window is updated.
              </p>
            </div>
          </div>
        )}

        {/* Order Hero Card & Token Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Single Consolidated Pickup</span>
          </div>

          <div>
            <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Pickup Token</div>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono mt-1">
              #{order.tokenNumber}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed for {order.userName} • {order.items.length} items from {new Set(order.items.map(i => i.counterId)).size} counters
            </p>
          </div>

          {/* Prominent Shelf Assignment Badge if READY */}
          {order.shelfId && !isCollected && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-1 animate-scale">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Your Food is Ready! Head to:
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-center justify-center gap-2">
                <Box className="w-7 h-7 text-emerald-600" />
                <span>{order.shelfId}</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                Online Pickup Zone • Scan QR or present 4-digit PIN below
              </p>
            </div>
          )}

          {/* Multi-Stage Stepper */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { step: 1, label: 'Placed' },
                { step: 2, label: 'Kitchen Batch' },
                { step: 3, label: 'Ready at Shelf' },
                { step: 4, label: 'Collected' },
              ].map((s) => {
                const isPassed = currentStep >= s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div key={s.step} className="space-y-1.5">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed && !isCurrent ? '✓' : s.step}
                    </div>
                    <div
                      className={`text-[10px] sm:text-xs leading-tight ${
                        isCurrent
                          ? 'font-bold text-slate-900'
                          : isPassed
                          ? 'font-semibold text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Pickup QR Code & PIN Security Card */}
        {!isCollected && !isCancelled && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-brand-500" />
                Pickup Verification Code
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Single Use
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={order.qrCodeHash}
                size={160}
                level="H"
                includeMargin
                className="rounded-xl mx-auto"
              />
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium uppercase">Manual 4-Digit Pickup PIN</div>
              <div className="text-3xl font-black font-mono tracking-widest text-slate-900 mt-0.5">
                {order.pickupPin}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Show QR or recite this 4-digit PIN to the Pickup Coordinator at the Online Hub.
              </p>
            </div>
          </div>
        )}

        {/* Multi-Counter Item Readiness Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Multi-Counter Item Checklist</h3>
              <p className="text-xs text-slate-500">Each kitchen counter prepares items in parallel</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {order.items.length} Items
            </span>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {order.items.map((item) => {
              const isItemReady =
                item.itemStatus === 'READY_AT_COUNTER' || item.itemStatus === 'TRANSFERRED_TO_PICKUP';
              const isItemPrep = item.itemStatus === 'PREPARING';

              const counterName =
                item.counterId === 'cnt-01'
                  ? 'Counter 1 (Biryani & Rice)'
                  : item.counterId === 'cnt-02'
                  ? 'Counter 2 (Meals & Chapati)'
                  : 'Counter 3 (Drinks & Snacks)';

              return (
                <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{item.quantity}x {item.itemName}</span>
                      {item.friendName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                          {item.friendName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Utensils className="w-3 h-3 text-slate-400" />
                      <span>{counterName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isItemReady
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isItemPrep
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.itemStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancellation Section */}
        {canCancel && (
          <div className="text-center pt-2">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2"
            >
              Need to cancel? (100% refund before cooking starts)
            </button>
          </div>
        )}
      </main>

      {/* Cancellation Modal */}
      <CancellationModal
        order={order}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />

      <StudentBottomNav />
    </div>
  );
}
