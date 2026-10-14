'use client';

/**
 * CanteenOS — QR Scanner & PIN Verification Kiosk Screen
 * Full-screen dedicated verification station for Pickup Coordinator Priya.
 */

import React from 'react';
import Link from 'next/link';
import { PickupHeader } from '@/components/pickup/PickupHeader';
import { QRScannerTerminal } from '@/components/pickup/QRScannerTerminal';
import { ArrowLeft, Box, QrCode } from 'lucide-react';

export default function PickupScannerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <PickupHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/pickup"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Staging & Shelf Matrix</span>
          </Link>
        </div>

        <QRScannerTerminal />
      </main>
    </div>
  );
}
