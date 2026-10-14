'use client';

/**
 * CanteenOS — College Admin & Operational Analytics Portal
 * Rush heatmaps, dual-channel capacity balancing, counter latency metrics, and financial summaries.
 */

import React from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PeakRushHeatmap } from '@/components/admin/PeakRushHeatmap';
import { CapacityTuningCard } from '@/components/admin/CapacityTuningCard';
import { CounterPerformanceCard } from '@/components/admin/CounterPerformanceCard';
import {
  BarChart3,
  Sliders,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { exceptionLogs, orders } = useCanteenStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Explicit Demonstration Notice */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950 shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold">Demonstration Dataset & Simulation Notice:</span>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              All seated dinner rush statistics, wait time forecasts, revenue totals, and counter benchmarks are demonstration data designed for interactive evaluation of the CanteenOS operating system.
            </p>
          </div>
        </div>

        {/* Section 1: Peak Dinner Demand Heatmap */}
        <PeakRushHeatmap />

        {/* Section 2: Dual-Channel Capacity Allocator */}
        <CapacityTuningCard />

        {/* Section 3: Multi-Counter Performance & Latency Telemetry */}
        <CounterPerformanceCard />

        {/* Section 4: Live Operational Exception Snapshot */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Operational Exceptions Stream</h3>
              <p className="text-xs text-slate-500">Live safety audit trail</p>
            </div>
            <Link
              href="/admin/exceptions"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View Full Log ({exceptionLogs.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {exceptionLogs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No operational exceptions recorded in this session.
            </div>
          ) : (
            <div className="space-y-2">
              {exceptionLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {log.exceptionType}
                    </span>
                    <p className="text-slate-700 mt-1 font-medium">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
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
