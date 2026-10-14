'use client';

/**
 * CanteenOS — Demo Login & Role-Based Access Control Portal
 * STRICTLY DEMO-ONLY: Simulates role authentication across Student, Visitor,
 * Kitchen Staff, Pickup Staff, and College Admin with predefined credentials.
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { DEMO_PERSONAS } from '@/data/seedData';
import { Role } from '@/types';
import {
  UtensilsCrossed,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  KeyRound,
  Mail,
  GraduationCap,
  Users,
  ChefHat,
  Box,
  BarChart3,
  CheckCircle2,
  Info,
} from 'lucide-react';

function DemoLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { isAuthenticated, activePersona, loginWithCredentials, loginAsPersona, hydrateAuth } =
    useCanteenStore();

  const [activeTab, setActiveTab] = useState<Role>('STUDENT');
  const [identifier, setIdentifier] = useState('rahul@campus.edu');
  const [pin, setPin] = useState('1111');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  // Tab definitions
  const tabs: { role: Role; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'STUDENT', label: 'Student', icon: GraduationCap },
    { role: 'VISITOR', label: 'Visitor', icon: Users },
    { role: 'KITCHEN_STAFF', label: 'Kitchen', icon: ChefHat },
    { role: 'PICKUP_COORDINATOR', label: 'Pickup', icon: Box },
    { role: 'COLLEGE_ADMIN', label: 'Admin', icon: BarChart3 },
  ];

  // Personas matching current role tab
  const rolePersonas = DEMO_PERSONAS.filter((p) => p.role === activeTab);

  // Switch tab & prefill first persona of that role
  const handleTabChange = (role: Role) => {
    setActiveTab(role);
    setErrorMessage(null);
    const firstPersona = DEMO_PERSONAS.find((p) => p.role === role);
    if (firstPersona) {
      setIdentifier(firstPersona.email);
      setPin(firstPersona.pin);
    }
  };

  const executeRedirectForRole = (role: Role) => {
    if (redirectUrl) {
      // Validate redirect
      if (
        (redirectUrl.startsWith('/student') && (role === 'STUDENT' || role === 'VISITOR' || role === 'COLLEGE_ADMIN')) ||
        (redirectUrl.startsWith('/kitchen') && (role === 'KITCHEN_STAFF' || role === 'COLLEGE_ADMIN')) ||
        (redirectUrl.startsWith('/pickup') && (role === 'PICKUP_COORDINATOR' || role === 'COLLEGE_ADMIN')) ||
        (redirectUrl.startsWith('/admin') && role === 'COLLEGE_ADMIN')
      ) {
        router.push(redirectUrl);
        return;
      }
    }

    // Default target
    if (role === 'KITCHEN_STAFF') router.push('/kitchen');
    else if (role === 'PICKUP_COORDINATOR') router.push('/pickup');
    else if (role === 'COLLEGE_ADMIN') router.push('/admin');
    else router.push('/student');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = loginWithCredentials(identifier, pin);
    if (result.success && result.persona) {
      executeRedirectForRole(result.persona.role);
    } else {
      setErrorMessage(result.errorMessage || 'Invalid credentials.');
    }
  };

  const handleQuickLogin = (personaId: string) => {
    setErrorMessage(null);
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!persona) return;

    loginAsPersona(personaId);
    executeRedirectForRole(persona.role);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900 px-4 py-8">
      <main className="max-w-xl w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-brand-500 text-white shadow-lg shadow-brand-500/25 mb-1">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            CanteenOS Demo Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            "Order once. Pay once. Pick up once." — Multi-Role Simulation Portal
          </p>
        </div>

        {/* Demo-Only Prominent Notice */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900 block mb-0.5">
              Demonstration System Only
            </span>
            This is an in-memory client-side authentication prototype built strictly for role evaluation and workflow testing. It does not provide cryptographic encryption, backend JWTs, or production-grade security.
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Role Tabs */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Role Station
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.role;
                return (
                  <button
                    key={tab.role}
                    type="button"
                    onClick={() => handleTabChange(tab.role)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                    <span className="text-[11px] truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick-Fill Personas for Selected Role */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                1-Click Quick Demo Sign-in
              </span>
              <span className="text-[10px] text-slate-400">Zero-typing access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rolePersonas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickLogin(p.id)}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/30 text-left transition-all group flex items-start gap-2.5 active:scale-[0.98]"
                >
                  <span className="text-xl shrink-0 mt-0.5">{p.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 group-hover:text-brand-600 truncate flex items-center justify-between">
                      <span>{p.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{p.email}</div>
                    {p.visitorType && (
                      <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {p.visitorType === 'ALUMNI_PASSED_OUT' ? `Alumni '22` : 'Campus Guest'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or Sign In with Predefined PIN
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Demo Identifier / Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rahul@campus.edu"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">4-Digit Demo PIN</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Default: {rolePersonas[0]?.pin || '1111'}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-[0.99]"
            >
              <span>Authenticate & Enter Station</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credentials Cheat Sheet */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Predefined Demo Credentials for {tabs.find((t) => t.role === activeTab)?.label}:</span>
            </div>
            <div className="space-y-1 font-mono text-[10px] text-slate-500">
              {rolePersonas.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <span>{p.name} ({p.email})</span>
                  <span className="font-bold text-brand-600">PIN: {p.pin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        CanteenOS • "Order once. Pay once. Pick up once."
      </footer>
    </div>
  );
}

export default function DemoLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 animate-pulse mb-3">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase font-mono">
            Loading Demo Login...
          </p>
        </div>
      }
    >
      <DemoLoginForm />
    </React.Suspense>
  );
}
