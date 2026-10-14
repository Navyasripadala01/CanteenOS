'use client';

/**
 * CanteenOS — Student Profile & Dining Preferences
 * Campus identity, dietary preferences, and canteen policies.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { DietaryType } from '@/types';
import { User, Shield, MapPin, CheckCircle2, Utensils, Info, Clock, Sparkles, LogOut } from 'lucide-react';

export default function StudentProfilePage() {
  const router = useRouter();
  const { activePersona, logout } = useCanteenStore();
  const [preferredDiet, setPreferredDiet] = useState<DietaryType | 'ALL'>('ALL');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const isVisitor = activePersona.role === 'VISITOR';
  const isAlumni = activePersona.visitorType === 'ALUMNI_PASSED_OUT';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-900">
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isVisitor ? 'Visitor Profile' : 'Student Profile'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isVisitor
              ? 'Campus dining credentials and visitor pass details'
              : 'Campus credentials and dining preferences'}
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            {activePersona.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{activePersona.name}</h2>
              {isVisitor ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {isAlumni ? "Alumni ('22)" : 'Campus Guest'}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Verified Student
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">
              {isVisitor
                ? isAlumni
                  ? 'NIT Alumni • Class of 2022'
                  : 'Campus Visitor Pass • Day Guest'
                : 'ID: CS2023-8821 • Hosteler'}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>National Institute of Technology Campus</span>
            </div>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-sm text-slate-900">Dining Dietary Filter</h3>
          </div>
          <p className="text-xs text-slate-500">
            Automatically highlights matching items when you open the live dinner menu.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { id: 'ALL', label: 'All Items', desc: 'Veg & Non-Veg' },
              { id: 'VEG', label: 'Pure Veg', desc: 'Vegetarian Only' },
              { id: 'NON_VEG', label: 'Non-Veg', desc: 'Chicken / Meat' },
              { id: 'EGG', label: 'Egg Items', desc: 'Egg-based curries' },
            ].map((diet) => {
              const isSelected = preferredDiet === diet.id;
              return (
                <button
                  key={diet.id}
                  onClick={() => setPreferredDiet(diet.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{diet.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{diet.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campus Canteen Operating Guidelines */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Shield className="w-4 h-4 text-brand-500" />
            <span>Campus Dining Rules & Policies</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">10-Minute Smart Pickup Windows:</span> Food is batched and ready during your chosen slot. Slots are capped to prevent dining hall congestion.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Single Consolidated Pickup:</span> Whether you order Biryani from Counter 1 and Drinks from Counter 3, collect everything together at your designated shelf cubby.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">100% Refund Policy:</span> Free cancellation with full refund is supported anytime before kitchen batch preparation begins.
              </div>
            </div>
          </div>
        </div>

        {/* Logout of Demo Session */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-bold text-sm text-slate-900">Demo Session Control</div>
            <div className="text-xs text-slate-500">Sign out to test another persona or switch role access.</div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Demo Account</span>
          </button>
        </div>
      </main>

      <StudentBottomNav />
    </div>
  );
}
