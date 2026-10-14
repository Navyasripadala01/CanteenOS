'use client';

/**
 * CanteenOS — Category and Dietary Filters
 * Horizontal scrolling restrained category bar with active indicators.
 */

import React from 'react';
import { DietaryType } from '@/types';
import { Sparkles, Utensils, Coffee, Soup } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedDietary: DietaryType | 'ALL';
  onSelectDietary: (dietary: DietaryType | 'ALL') => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedDietary,
  onSelectDietary,
}: CategoryFilterProps) {
  const categories = [
    { id: 'ALL', label: 'All Items', icon: Sparkles },
    { id: 'biryani_rice', label: 'Biryani & Rice (C1)', icon: Utensils },
    { id: 'meals_breads', label: 'Meals & Chapati (C2)', icon: Soup },
    { id: 'snacks_drinks', label: 'Snacks & Drinks (C3)', icon: Coffee },
  ];

  const dietaryOptions: { id: DietaryType | 'ALL'; label: string; dotColor: string }[] = [
    { id: 'ALL', label: 'All Diets', dotColor: 'bg-slate-400' },
    { id: 'VEG', label: 'Pure Veg', dotColor: 'bg-emerald-500' },
    { id: 'NON_VEG', label: 'Non-Veg', dotColor: 'bg-rose-500' },
    { id: 'EGG', label: 'Egg', dotColor: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-3">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dietary Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {dietaryOptions.map((opt) => {
          const isSelected = selectedDietary === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectDietary(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                isSelected
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 font-semibold'
                  : 'bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
