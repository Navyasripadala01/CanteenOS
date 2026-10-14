'use client';

/**
 * CanteenOS — Menu Item Card Component
 * Displays dish details, prep lead time, counter station routing, live stock,
 * dietary badge, and quantity adjustment.
 */

import React from 'react';
import { MenuItem } from '@/types';
import { useCanteenStore } from '@/store/canteenStore';
import { Clock, Plus, Minus, AlertCircle, Sparkles } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onOpenDetail?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onOpenDetail }: MenuItemCardProps) {
  const { cart, addToCart, updateCartQuantity, removeFromCart } = useCanteenStore();

  const remainingStock = Math.max(0, item.dailyPreparedQty - item.committedQty);
  const isAvailable = !item.isSoldOut && remainingStock > 0;

  // Calculate total quantity of this item in the cart (sum across friend tags)
  const cartEntries = cart.filter((c) => c.menuItem.id === item.id);
  const totalInCart = cartEntries.reduce((sum, c) => sum + c.quantity, 0);

  // Counter metadata
  const counterLabel =
    item.counterId === 'cnt-01'
      ? 'Counter 1 (Biryani)'
      : item.counterId === 'cnt-02'
      ? 'Counter 2 (Meals)'
      : 'Counter 3 (Snacks/Drinks)';

  const counterBadgeColor =
    item.counterId === 'cnt-01'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : item.counterId === 'cnt-02'
      ? 'bg-teal-50 text-teal-700 border-teal-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAvailable) {
      addToCart(item);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalInCart < remainingStock) {
      // Increment the first entry or add new
      if (cartEntries.length > 0) {
        updateCartQuantity(item.id, cartEntries[0].quantity + 1, cartEntries[0].friendName);
      } else {
        addToCart(item);
      }
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartEntries.length > 0) {
      const lastEntry = cartEntries[cartEntries.length - 1];
      if (lastEntry.quantity > 1) {
        updateCartQuantity(item.id, lastEntry.quantity - 1, lastEntry.friendName);
      } else {
        removeFromCart(item.id, lastEntry.friendName);
      }
    }
  };

  return (
    <div
      onClick={() => onOpenDetail?.(item)}
      className={`bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between relative group ${
        isAvailable
          ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          : 'border-slate-200/50 bg-slate-50/50 opacity-75'
      }`}
    >
      <div>
        {/* Top Badges: Dietary & Counter Station */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            {/* Indian Dietary Indicator Symbol */}
            <span
              className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                item.dietaryType === 'VEG'
                  ? 'border-emerald-600'
                  : item.dietaryType === 'NON_VEG'
                  ? 'border-rose-600'
                  : 'border-amber-500'
              }`}
              title={item.dietaryType}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  item.dietaryType === 'VEG'
                    ? 'bg-emerald-600'
                    : item.dietaryType === 'NON_VEG'
                    ? 'bg-rose-600'
                    : 'bg-amber-500'
                }`}
              />
            </span>

            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${counterBadgeColor}`}>
              {counterLabel}
            </span>
          </div>

          {/* Prep Lead Time */}
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{item.prepLeadTimeMinutes}m</span>
          </span>
        </div>

        {/* Dish Title & Description */}
        <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-snug group-hover:text-brand-600 transition-colors">
          {item.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Footer: Price, Remaining Portions & Add Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900">
            ₹{item.price}
          </div>
          <div className="text-[11px] font-medium">
            {isAvailable ? (
              <span className={remainingStock < 10 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                {remainingStock} portions left
              </span>
            ) : (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                SOLD OUT
              </span>
            )}
          </div>
        </div>

        {/* Add / Quantity Selector */}
        <div>
          {!isAvailable ? (
            <button
              disabled
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : totalInCart === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200/80 text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 text-white px-2 py-1.5 rounded-xl shadow-sm">
              <button
                onClick={handleDecrement}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white active:scale-90 transition-all"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs font-bold min-w-[16px] text-center">
                {totalInCart}
              </span>
              <button
                onClick={handleIncrement}
                disabled={totalInCart >= remainingStock}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 flex items-center justify-center text-white active:scale-90 transition-all"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
