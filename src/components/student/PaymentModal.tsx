'use client';

/**
 * CanteenOS — Interactive Payment Drawer / Modal
 * Supports UPI (GPay/PhonePe/Paytm/QR), Card/Razorpay simulation, and Pay at Counter.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCanteenStore } from '@/store/canteenStore';
import { PaymentMode } from '@/types';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Lock,
  X,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
}

export function PaymentModal({ isOpen, onClose, totalAmount }: PaymentModalProps) {
  const router = useRouter();
  const { placeOrder, activePersona } = useCanteenStore();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [upiMethod, setUpiMethod] = useState<'APP' | 'QR'>('APP');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayAndConfirm = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Simulate safe payment gateway processing latency
    setTimeout(() => {
      const result = placeOrder({
        userName: activePersona.name,
        isWalkin: paymentMode === 'CASH_AT_COUNTER',
        paymentMode,
      });

      setIsProcessing(false);

      if (result.success && result.order) {
        onClose();
        router.push(`/student/orders/${result.order.id}`);
      } else {
        setErrorMessage(result.errorMessage || 'Failed to place order.');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Select Payment Method</h3>
              <p className="text-xs text-slate-500">Total: ₹{totalAmount} • Secure 1-Click Pay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMode('UPI')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                paymentMode === 'UPI'
                  ? 'border-brand-500 bg-brand-50/60 font-bold text-brand-700 ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs">UPI</span>
            </button>

            <button
              onClick={() => setPaymentMode('CARD')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                paymentMode === 'CARD'
                  ? 'border-brand-500 bg-brand-50/60 font-bold text-brand-700 ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Card / Net</span>
            </button>

            <button
              onClick={() => setPaymentMode('CASH_AT_COUNTER')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                paymentMode === 'CASH_AT_COUNTER'
                  ? 'border-brand-500 bg-brand-50/60 font-bold text-brand-700 ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs">Cash Desk</span>
            </button>
          </div>

          {/* Dynamic Content based on selected mode */}
          {paymentMode === 'UPI' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-2 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setUpiMethod('APP')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    upiMethod === 'APP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  UPI Apps
                </button>
                <button
                  onClick={() => setUpiMethod('QR')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    upiMethod === 'QR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Scan QR Code
                </button>
              </div>

              {upiMethod === 'APP' ? (
                <div className="space-y-2 pt-1">
                  {[
                    { id: 'gpay', name: 'Google Pay', icon: '🟢', sub: 'Instant approval' },
                    { id: 'phonepe', name: 'PhonePe UPI', icon: '🟣', sub: 'Instant approval' },
                    { id: 'paytm', name: 'Paytm UPI', icon: '🔵', sub: 'Instant approval' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id as any)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                        selectedUpiApp === app.id
                          ? 'border-brand-500 bg-brand-50/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{app.icon}</span>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-900">{app.name}</div>
                          <div className="text-[10px] text-slate-500">{app.sub}</div>
                        </div>
                      </div>
                      {selectedUpiApp === app.id && (
                        <CheckCircle2 className="w-4 h-4 text-brand-500" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-32 h-32 bg-white border border-slate-300 mx-auto rounded-xl flex items-center justify-center p-2 shadow-xs">
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">Scan using any UPI App</div>
                  <div className="text-[10px] font-mono text-slate-500">canteenos@campus.upi</div>
                </div>
              )}
            </div>
          )}

          {paymentMode === 'CARD' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Simulated Card Gateway</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 space-y-1">
                <div className="font-mono text-slate-800 font-bold tracking-wider">•••• •••• •••• 4242</div>
                <div className="flex justify-between text-[10px]">
                  <span>Campus RuPay / Visa</span>
                  <span>12/28</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Safe prototype integration compatible with Razorpay / Cashfree tokens.
              </p>
            </div>
          )}

          {paymentMode === 'CASH_AT_COUNTER' && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-amber-600" />
                Pay Cash at Counter 3
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Your order will be reserved in the kitchen queue. Pay at Counter 3 Cash Desk when you arrive to receive your pickup cubby code.
              </p>
            </div>
          )}
        </div>

        {/* Footer & Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handlePayAndConfirm}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing Order...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Pay ₹{totalAmount} & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
