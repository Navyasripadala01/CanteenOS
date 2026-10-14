'use client';

/**
 * CanteenOS — Campus Canteen Policies & Refund Engine Configuration
 * Differentiated student vs canteen cancellation rules and pickup shelf timeout settings.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShieldCheck, Save, CheckCircle2, Info, Clock, AlertTriangle } from 'lucide-react';

export default function AdminPoliciesPage() {
  const [studentRefundPercent, setStudentRefundPercent] = useState(100);
  const [shelfTimeoutMinutes, setShelfTimeoutMinutes] = useState(30);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Campus Policies & Refund Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure student cancellation rules, refund thresholds, and shelf timeout limits
            </p>
          </div>

          {isSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-scale">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Policy Updated
            </span>
          )}
        </div>

        {/* Policy 1: Student Cancellation Rules */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900">Student Cancellation Rules</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>Pre-Cooking Refund Guarantee:</span>
                <span className="text-emerald-600 font-extrabold">{studentRefundPercent}% Full Refund</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Students can cancel anytime while their order is in <code>PLACED</code> status before kitchen batch preparation begins.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>Post-Preparation Policy:</span>
                <span className="text-rose-600 font-extrabold">0% (Locked in Cooking)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Once ingredients are tossed in wok or packaged, food waste prevention rules block cancellation.
              </p>
            </div>
          </div>
        </div>

        {/* Policy 2: Canteen Initiated Cancellation (100% Refund Guarantee) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-extrabold text-slate-900">Canteen Operational Failure Guarantee</h3>
          </div>

          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl text-xs text-teal-900 space-y-1.5">
            <span className="font-bold">100% Automatic Refund Guarantee:</span>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              If an unexpected ingredient stockout, power outage, or kitchen equipment failure forces the canteen to cancel an active order, the student automatically receives a 100% full refund with an apology credit note.
            </p>
          </div>
        </div>

        {/* Policy 3: 24-Shelf Retention Timeout */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-extrabold text-slate-900">Physical Shelf Retention Timeout</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
            <div>
              <div className="font-bold text-slate-800">Uncollected Food Holding Timeout</div>
              <div className="text-[11px] text-slate-500">Auto-alerts coordinator if food sits uncollected in cubby</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-slate-900">{shelfTimeoutMinutes} Minutes</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Policies</span>
          </button>
        </div>
      </main>
    </div>
  );
}
