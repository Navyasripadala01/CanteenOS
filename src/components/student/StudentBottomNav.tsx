'use client';

/**
 * CanteenOS — Student Bottom Navigation
 * iOS-style floating restrained liquid-glass navigation bar with active state and cart badge.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { Home, Utensils, ShoppingBag, Clock3, History, User } from 'lucide-react';

export function StudentBottomNav() {
  const pathname = usePathname();
  const { cart, orders } = useCanteenStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter(
    (o) => !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  ).length;

  const navItems = [
    { href: '/student', label: 'Home', icon: Home },
    { href: '/student/menu', label: 'Menu', icon: Utensils },
    {
      href: '/student/cart',
      label: 'Cart',
      icon: ShoppingBag,
      badge: totalCartCount > 0 ? totalCartCount : null,
    },
    {
      href: '/student/orders',
      label: 'Orders',
      icon: Clock3,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: 'bg-brand-500',
    },
    { href: '/student/history', label: 'History', icon: History },
  ];

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
      <nav
        aria-label="Student Navigation"
        className="pointer-events-auto w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_36px_-4px_rgba(15,23,42,0.12)] rounded-3xl p-1.5 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-brand-500 bg-brand-50/60 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white animate-scale ${
                      item.badgeColor || 'bg-brand-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
