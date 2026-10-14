'use client';

/**
 * CanteenOS — Student Order Cancellation Modal
 * Enforces cancellation policy rules and displays refund breakdown.
 */

import React, { useState } from 'react';
import { Order } from '@/types';
import { useCanteenStore } from '@/store/canteenStore';
import { AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CancellationModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function CancellationModal({ order, isOpen, onClose }: CancellationModalProps) {
  const { cancelOrderAsStudent } = useCanteenStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = () => {
    setIsProcessing(true);
    setError(null);

    const res = cancelOrderAsStudent(order.id);
    setIsProcessing(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.errorMessage || 'Unable to cancel order.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Cancel Order #{order.tokenNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to cancel this order? Since your order is in <strong>{order.orderStatus.replace(/_/g, ' ')}</strong> status prior to kitchen batch cooking, you are eligible for an immediate full refund.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between font-medium">
              <span>Order Amount:</span>
              <span className="text-slate-900 font-bold">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Refund Rate (Pre-prep):</span>
              <span>100% (₹{order.totalAmount})</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
              <span>Refund Method:</span>
              <span>Original Source (Instant Mock UPI Reversal)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            {isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}
