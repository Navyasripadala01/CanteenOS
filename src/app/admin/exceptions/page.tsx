'use client';

/**
 * CanteenOS — Operational Exceptions & Safety Audit Log
 * Audit trail of delayed orders, missing items, stockouts, and cancellation events.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AlertTriangle, Clock, Filter, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminExceptionsPage() {
  const { exceptionLogs, recordException } = useCanteenStore();

  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = exceptionLogs.filter((log) => {
    if (filterType !== 'ALL' && log.exceptionType !== filterType) return false;
    return true;
  });

  const handleSimulateException = () => {
    recordException(
      'UNEXPECTED_STOCKOUT',
      'Masala Chai milk supply depleted unexpectedly during peak slot 7:30 PM. Auto-disabled on menu.',
      'system'
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operational Exceptions & Audit Log
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live telemetry tracking delays, stockouts, scanner failures, and customer resolution
            </p>
          </div>

          <button
            onClick={handleSimulateException}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 transition-all self-start sm:self-auto"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Stockout Event</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          {['ALL', 'DELAYED_FOOD_ITEM', 'MISSING_ITEM', 'UNEXPECTED_STOCKOUT', 'DUPLICATE_PICKUP_ATTEMPT', 'STUDENT_CANCELLATION'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Logs Table / List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="font-bold text-sm text-slate-800">Clean Operational Session</div>
              <p>No operational failures recorded for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                        {log.exceptionType}
                      </span>
                      {log.orderId && (
                        <span className="text-[11px] font-mono text-brand-600 font-bold">
                          Order: {log.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">{log.description}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
