'use client';

/**
 * CanteenOS — Student Cart & Capacity-Aware Checkout
 * Multi-counter order aggregation, friend name tagging per item,
 * 10-minute pickup slot selection, and payment trigger.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useCanteenStore } from '@/store/canteenStore';
import { StudentHeader } from '@/components/student/StudentHeader';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { SlotPickerModal } from '@/components/student/SlotPickerModal';
import { PaymentModal } from '@/components/student/PaymentModal';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';

export default function StudentCartPage() {
  const {
    cart,
    pickupSlots,
    selectedSlotId,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCanteenStore();

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingFriendIndex, setEditingFriendIndex] = useState<number | null>(null);
  const [friendInput, setFriendInput] = useState('');

  const selectedSlot = pickupSlots.find((s) => s.id === selectedSlotId);
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  // Group cart items by counter station
  const counter1Items = cart.filter((c) => c.menuItem.counterId === 'cnt-01');
  const counter2Items = cart.filter((c) => c.menuItem.counterId === 'cnt-02');
  const counter3Items = cart.filter((c) => c.menuItem.counterId === 'cnt-03');

  const handleSaveFriendTag = (index: number) => {
    const item = cart[index];
    if (item) {
      updateCartQuantity(item.menuItem.id, item.quantity, friendInput.trim() || undefined);
    }
    setEditingFriendIndex(null);
    setFriendInput('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-900">
      <StudentHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Cart</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-counter order • Consolidated into one pickup
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Your cart is empty</h3>
              <p className="text-xs text-slate-500 mt-1">
                Explore today's dinner specials and pre-order to reserve your pickup slot.
              </p>
            </div>
            <Link
              href="/student/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs shadow-sm transition-all"
            >
              <span>Explore Dinner Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Pickup Slot Selector Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-500" />
                  Scheduled Pickup Window
                </span>
                <button
                  onClick={() => setIsSlotModalOpen(true)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  Change Slot
                </button>
              </div>

              <div
                onClick={() => setIsSlotModalOpen(true)}
                className="bg-brand-50/60 hover:bg-brand-50 border border-brand-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    {selectedSlot ? selectedSlot.displayLabel : 'No slot selected'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedSlot
                      ? `${selectedSlot.onlineCapacityQuota - selectedSlot.currentOnlineBookings} online spots open • Uncrowded kitchen batch`
                      : 'Tap to choose a 10-minute pickup slot'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white border border-brand-200 text-brand-600 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2. Itemized List with Multi-Counter Breakdown & Friend Tagging */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ordered Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </span>
                <span className="text-xs text-slate-400">Internally routed to 3 counters</span>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                {cart.map((cartItem, index) => {
                  const item = cartItem.menuItem;
                  const itemTotal = item.price * cartItem.quantity;

                  return (
                    <div key={`${item.id}-${index}`} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                                item.dietaryType === 'VEG'
                                  ? 'border-emerald-600'
                                  : item.dietaryType === 'NON_VEG'
                                  ? 'border-rose-600'
                                  : 'border-amber-500'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.dietaryType === 'VEG'
                                    ? 'bg-emerald-600'
                                    : item.dietaryType === 'NON_VEG'
                                    ? 'bg-rose-600'
                                    : 'bg-amber-500'
                                }`}
                              />
                            </span>
                            <span className="font-bold text-sm text-slate-900">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.counterId === 'cnt-01'
                                ? 'Counter 1 (Biryani)'
                                : item.counterId === 'cnt-02'
                                ? 'Counter 2 (Meals)'
                                : 'Counter 3 (Drinks)'}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">₹{item.price} each</span>
                          </div>

                          {/* Friend Tagging Display / Edit */}
                          <div className="mt-1.5">
                            {editingFriendIndex === index ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={friendInput}
                                  onChange={(e) => setFriendInput(e.target.value)}
                                  placeholder="Friend name (e.g. For Amit)"
                                  className="px-2.5 py-1 text-xs border border-brand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
                                />
                                <button
                                  onClick={() => handleSaveFriendTag(index)}
                                  className="text-[11px] font-bold px-2 py-1 bg-brand-500 text-white rounded-lg"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingFriendIndex(index);
                                  setFriendInput(cartItem.friendName || '');
                                }}
                                className="text-[11px] font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>
                                  {cartItem.friendName
                                    ? `Tagged: ${cartItem.friendName}`
                                    : 'Tag for a friend'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Total */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm font-extrabold text-slate-900">₹{itemTotal}</div>
                          <div className="flex items-center gap-1.5 bg-slate-100 px-1.5 py-1 rounded-xl">
                            <button
                              onClick={() => {
                                if (cartItem.quantity > 1) {
                                  updateCartQuantity(item.id, cartItem.quantity - 1, cartItem.friendName);
                                } else {
                                  removeFromCart(item.id, cartItem.friendName);
                                }
                              }}
                              className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs font-bold min-w-[14px] text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(item.id, cartItem.quantity + 1, cartItem.friendName)
                              }
                              className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Bill Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bill Summary</span>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Campus Canteen Convenience Fee</span>
                  <span className="font-semibold text-emerald-600">₹0 (Free)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                  <span>Total Payable</span>
                  <span>₹{subtotal}</span>
                </div>
              </div>
            </div>

            {/* 4. Cancellation Policy Note */}
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold">Cancellation Policy:</span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Full 100% refund is available if you cancel before kitchen batch preparation begins. If the canteen cannot fulfil your order, you will receive an automatic 100% refund.
                </p>
              </div>
            </div>

            {/* 5. Checkout Action Button */}
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-between active:scale-98"
            >
              <div className="text-left">
                <div className="text-[10px] uppercase font-semibold text-brand-100">Proceed to Payment</div>
                <div>₹{subtotal} • 1 Payment</div>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                <span>Select Payment</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </main>

      {/* Pickup Slot Modal */}
      <SlotPickerModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
      />

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={subtotal}
      />

      <StudentBottomNav />
    </div>
  );
}
