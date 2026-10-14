'use client';

/**
 * CanteenOS — QR Scanner & 4-Digit PIN Collection Kiosk Terminal
 * Verifies single-use pickup tokens, releases physical shelf cubbies,
 * and handles manual PIN fallbacks.
 */

import React, { useState } from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import {
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Box,
  ShieldCheck,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

export function QRScannerTerminal() {
  const { orders, pickupShelves, verifyAndCollectOrder } = useCanteenStore();

  const [pinInput, setPinInput] = useState('');
  const [lastVerificationResult, setLastVerificationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active ready-for-pickup orders
  const readyOrders = orders.filter((o) => o.orderStatus === 'READY_FOR_PICKUP');

  const handleVerify = (tokenOrPin: string) => {
    if (!tokenOrPin.trim()) return;
    setErrorMessage(null);

    const result = verifyAndCollectOrder(tokenOrPin.trim());

    if (result.success && result.order) {
      setLastVerificationResult(result);
      setPinInput('');
    } else {
      setErrorMessage(result.errorMessage || 'Invalid or expired pickup token.');
      setLastVerificationResult(null);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        handleVerify(newPin);
      }
    }
  };

  const handleKeypadClear = () => {
    setPinInput('');
    setErrorMessage(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white max-w-4xl mx-auto">
      {/* Terminal Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Online Pickup Verification Kiosk
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Single-use cryptographic QR code or 4-digit PIN verification terminal
          </p>
        </div>

        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>Scanner Active</span>
        </span>
      </div>

      {/* Success Notification Banner on Collection */}
      {lastVerificationResult && (
        <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-scale">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-white">Order Verified & Handed Over!</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
                  #{lastVerificationResult.order.tokenNumber}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">
                Customer: <span className="text-white font-bold">{lastVerificationResult.order.userName}</span> •
                Released <span className="text-emerald-300 font-bold">{lastVerificationResult.deallocatedShelfId || 'Shelf'}</span> back to available pool.
              </p>
            </div>
          </div>

          <button
            onClick={() => setLastVerificationResult(null)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Ready for Next Student
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-500 rounded-2xl text-xs text-rose-200 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[11px] underline text-rose-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: 4-Digit Manual PIN Keypad */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-brand-500" />
              Manual 4-Digit PIN Entry
            </span>
            <span className="text-[10px] text-slate-400">Dim-lighting fallback</span>
          </div>

          {/* 4-Digit PIN Display */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-14 rounded-xl border flex items-center justify-center font-mono text-2xl font-black ${
                    pinInput[index]
                      ? 'bg-slate-800 border-brand-500 text-brand-400 ring-1 ring-brand-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {pinInput[index] || '•'}
                </div>
              ))}
            </div>
          </div>

          {/* Numeric Touch Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeypadPress(digit)}
                className="py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl font-mono text-lg font-bold text-white transition-all active:scale-95 shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleKeypadClear}
              className="py-3.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/60 text-rose-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={() => handleKeypadPress('0')}
              className="py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl font-mono text-lg font-bold text-white transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={() => handleVerify(pinInput)}
              disabled={pinInput.length !== 4}
              className="py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              Verify
            </button>
          </div>
        </div>

        {/* Right: Camera QR Simulator & Quick Test Shortcuts */}
        <div className="space-y-4">
          {/* Camera Viewfinder Simulator */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden">
            <div className="w-32 h-32 mx-auto border-2 border-dashed border-brand-500 rounded-2xl flex items-center justify-center relative">
              <QrCode className="w-16 h-16 text-slate-600" />
              <div className="absolute inset-x-2 h-0.5 bg-brand-400 animate-pulse top-1/2" />
            </div>
            <div className="text-xs font-bold text-slate-300">Point Student QR Code at Camera</div>
            <p className="text-[11px] text-slate-500">
              Instant hardware & webcam decoding supported
            </p>
          </div>

          {/* Quick Demo Scan Shortcuts for Active Orders */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Ready for Pickup in Shelves ({readyOrders.length})
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No orders currently staged in shelves. Staged orders will appear here for 1-tap testing.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {readyOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleVerify(order.pickupPin)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 flex items-center justify-between text-xs transition-all hover:border-brand-500 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-400">#{order.tokenNumber}</span>
                      <span className="text-slate-300 font-semibold">{order.userName}</span>
                      <span className="font-mono text-[10px] text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-700">
                        {order.shelfId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <span>PIN: {order.pickupPin}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
