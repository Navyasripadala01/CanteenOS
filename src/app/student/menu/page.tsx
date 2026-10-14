'use client';

/**
 * CanteenOS — Full Menu & Live Availability Page
 * Real-time stock counters, search, dietary filtering, and counter station indicators.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { CategoryFilter } from '@/components/student/CategoryFilter';
import { MenuItemCard } from '@/components/student/MenuItemCard';
import { DietaryType } from '@/types';
import { Search, Sparkles, AlertCircle } from 'lucide-react';

export default function StudentMenuPage() {
  const { menuItems, cart } = useCanteenStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | 'ALL'>('ALL');

  const filteredItems = menuItems.filter((item) => {
    // Search query match
    if (
      searchQuery.trim() !== '' &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    // Category match
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    // Dietary match
    if (selectedDietary !== 'ALL' && item.dietaryType !== selectedDietary) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-900">
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Campus Menu</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time preparation availability across Counters 1, 2, and 3
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Chicken Biryani, Hakka Rice, Cool Drink, Thali..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category & Dietary Filters */}
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No dishes match your filters</h4>
            <p className="text-xs text-slate-500">
              Try searching for a different dish or reset dietary preferences.
            </p>
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
