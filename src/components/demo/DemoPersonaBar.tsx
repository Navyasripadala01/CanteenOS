'use client';

/**
 * CanteenOS — Development & Demo Persona Switcher (Hardened)
 * STRICTLY GUARDED: Renders ONLY when NEXT_PUBLIC_ENABLE_DEMO_MODE is true.
 * Synchronized with Demo Login session; automatically re-routes to authorized station
 * upon persona switch to prevent cross-role bypasses.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_PERSONAS } from '@/data/seedData';
import { useCanteenStore } from '@/store/canteenStore';
import { DemoPersona } from '@/types';
import { UserCheck, RefreshCw, Layers, ShieldCheck, ChevronUp, ChevronDown, Lock } from 'lucide-react';

export function DemoPersonaBar() {
  const router = useRouter();
  const isDemoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';
  const { activePersona, isAuthenticated, setActivePersona, resetToSeedData } = useCanteenStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDemoEnabled) {
    return null; // Completely hidden and inactive in production
  }

  const handlePersonaSwitch = (p: DemoPersona) => {
    setActivePersona(p);
    setIsExpanded(false);

    // Enforce immediate redirect to authorized station (prevents bypassing route guard)
    const targetDashboard =
      p.role === 'KITCHEN_STAFF'
        ? '/kitchen'
        : p.role === 'PICKUP_COORDINATOR'
        ? '/pickup'
        : p.role === 'COLLEGE_ADMIN'
        ? '/admin'
        : '/student';

    router.push(targetDashboard);
  };

  const handleReset = () => {
    resetToSeedData();
    setIsExpanded(false);
    router.push('/login');
  };

  return (
    <aside aria-label="Demo Persona Switcher" className="fixed bottom-3 right-3 z-50 max-w-sm sm:max-w-md">
      <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        {/* Compact Toggle Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-200 hover:text-white"
          >
            <span
              className={`flex h-2 w-2 rounded-full ${
                isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">DEMO ROLE:</span>
            <span className="text-amber-300 truncate font-medium">
              {isAuthenticated ? activePersona.name : 'Not Signed In'}
            </span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-1" /> : <ChevronUp className="w-3.5 h-3.5 ml-1" />}
          </button>

          <button
            onClick={handleReset}
            title="Reset to Initial Demonstration State & Log Out"
            className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-white bg-slate-700/50 px-2 py-1 rounded-md transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Expanded Persona Selection Matrix */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
            <p className="text-[11px] text-slate-400 leading-tight">
              Switch demo persona to test role-specific dashboards. Switching immediately transfers you to that persona's authorized station.
            </p>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {DEMO_PERSONAS.map((p: DemoPersona) => {
                const isSelected = isAuthenticated && p.id === activePersona.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePersonaSwitch(p)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-brand-500/20 border border-brand-500/60 text-white'
                        : 'bg-slate-800/60 hover:bg-slate-800 border border-transparent text-slate-300'
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-100">{p.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
                          {p.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
