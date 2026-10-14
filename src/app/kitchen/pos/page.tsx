'use client';

/**
 * CanteenOS — Counter 3 Cash Desk & Walk-In POS Terminal
 * Fast walk-in order entry consuming walk-in capacity quota (30%),
 * routing multi-counter items to kitchens, and generating single pickup tokens.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { KitchenHeader } from '@/components/kitchen/KitchenHeader';
import { MenuItem } from '@/types';
import {
  Banknote,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  QrCode,
} from 'lucide-react';

export default function Counter3POSPage() {
  const {
    menuItems,
    pickupSlots,
    selectedSlotId,
    setSelectedSlotId,
    placeOrder,
  } = useCanteenStore();

  const [walkinCart, setWalkinCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Student');
  const [paymentMode, setPaymentMode] = useState<'CASH_AT_COUNTER' | 'UPI'>('CASH_AT_COUNTER');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedSlot = pickupSlots.find((s) => s.id === selectedSlotId) || pickupSlots[3]; // 7:30 default

  const handleAddItem = (item: MenuItem) => {
    setWalkinCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setWalkinCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleUpdateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setWalkinCart((prev) =>
      prev.map((c) => (c.item.id === itemId ? { ...c, quantity: qty } : c))
    );
  };

  const totalAmount = walkinCart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const handleCompleteWalkinSale = () => {
    if (walkinCart.length === 0) return;
    setErrorMessage(null);

    // Populate temporary cart in store to execute atomic placeOrder
    const store = useCanteenStore.getState();
    store.clearCart();
    walkinCart.forEach(({ item, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        store.addToCart(item);
      }
    });

    const res = store.placeOrder({
      userName: customerName.trim() || 'Walk-in Student',
      isWalkin: true, // Consumes walk-in capacity quota
      paymentMode,
    });

    if (res.success && res.order) {
      setLastPlacedOrder(res.order);
      setWalkinCart([]);
      setCustomerName('Walk-in Student');
    } else {
      setErrorMessage(res.errorMessage || 'Walk-in capacity or stock unavailable.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <KitchenHeader
        selectedCounter="cnt-03"
        onSelectCounter={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Banknote className="w-6 h-6 text-brand-500" />
              <span>Counter 3 Cash Register & POS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid walk-in ordering • Consumes 30% Walk-in allocation • Enters same kitchen queue
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            Current Window: <span className="text-brand-400 font-bold">{selectedSlot?.displayLabel}</span> (Walk-in spots open: {selectedSlot?.walkinCapacityQuota - selectedSlot?.currentWalkinBookings})
          </div>
        </div>

        {/* Success Modal / Banner on Sale Completion */}
        {lastPlacedOrder && (
          <div className="bg-emerald-950/80 border border-emerald-500 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-scale">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Walk-in Order Placed!</span>
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                    Token #{lastPlacedOrder.tokenNumber}
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Slot: {lastPlacedOrder.slotDisplayLabel} • Pickup PIN: <span className="font-mono font-bold">{lastPlacedOrder.pickupPin}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLastPlacedOrder(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                New Order
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-600 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column POS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quick Dish Buttons Grid (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Quick Select Menu Dishes
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {menuItems.map((item) => {
                const remaining = Math.max(0, item.dailyPreparedQty - item.committedQty);
                const isOut = item.isSoldOut || remaining === 0;

                return (
                  <button
                    key={item.id}
                    disabled={isOut}
                    onClick={() => handleAddItem(item)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all active:scale-95 ${
                      isOut
                        ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-brand-500 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-100 line-clamp-2">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.counterId === 'cnt-01' ? 'C1' : item.counterId === 'cnt-02' ? 'C2' : 'C3'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="font-black text-xs text-brand-400">₹{item.price}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {isOut ? 'OUT' : `${remaining} left`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Ticket Cart & Tender */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-sm text-white">Current Ticket</span>
                {walkinCart.length > 0 && (
                  <button
                    onClick={() => setWalkinCart([])}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400">Customer Identifier</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Walk-in Student #4"
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {walkinCart.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Tap dishes to add to this walk-in ticket.
                  </div>
                ) : (
                  walkinCart.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-100">{item.name}</div>
                        <div className="text-[10px] text-slate-400">₹{item.price} each</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-brand-400">₹{item.price * quantity}</span>
                        <div className="flex items-center gap-1 bg-slate-700 px-1 py-0.5 rounded-lg">
                          <button
                            onClick={() => handleUpdateQty(item.id, quantity - 1)}
                            className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[11px] font-bold min-w-[12px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, quantity + 1)}
                            className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Mode Selection */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    onClick={() => setPaymentMode('CASH_AT_COUNTER')}
                    className={`py-2 rounded-xl border transition-all ${
                      paymentMode === 'CASH_AT_COUNTER'
                        ? 'bg-brand-500 text-white border-brand-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    💵 Cash Paid
                  </button>
                  <button
                    onClick={() => setPaymentMode('UPI')}
                    className={`py-2 rounded-xl border transition-all ${
                      paymentMode === 'UPI'
                        ? 'bg-brand-500 text-white border-brand-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    📱 Counter UPI
                  </button>
                </div>
              </div>
            </div>

            {/* Total & Submit */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm font-black text-white">
                <span>Total Amount:</span>
                <span className="text-xl font-mono text-brand-400">₹{totalAmount}</span>
              </div>

              <button
                disabled={walkinCart.length === 0}
                onClick={handleCompleteWalkinSale}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale (₹{totalAmount})</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
