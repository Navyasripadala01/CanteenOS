'use client';

/**
 * CanteenOS — Smart Pickup Slot Picker Modal
 * Visualizes 10-minute pickup slot intervals with capacity bars, full alerts,
 * and 1-tap selection.
 */

import React from 'react';
import { useCanteenStore } from '@/store/canteenStore';
import { computeAllSlotAvailability } from '@/lib/capacityEngine';
import { Clock, CheckCircle2, AlertTriangle, X, Sparkles } from 'lucide-react';

interface SlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SlotPickerModal({ isOpen, onClose }: SlotPickerModalProps) {
  const { pickupSlots, selectedSlotId, setSelectedSlotId } = useCanteenStore();
  const slotAvailability = computeAllSlotAvailability(pickupSlots);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Select Pickup Time Window</h3>
              <p className="text-xs text-slate-500">10-Minute smart capacity balancing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slot Selection Grid */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh]">
          <p className="text-xs text-slate-600 leading-relaxed pb-1">
            Slots guarantee your food is batched and ready in your designated pickup cubby at the Online Zone.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {slotAvailability.map((slot) => {
              const isSelected = selectedSlotId === slot.slotId;
              const isFull = slot.isOnlineFull;

              return (
                <button
                  key={slot.slotId}
                  disabled={isFull}
                  onClick={() => {
                    setSelectedSlotId(slot.slotId);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-center justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : isFull
                      ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{slot.displayLabel}</span>
                      {slot.isRecommended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">
                          RECOMMENDED
                        </span>
                      )}
                      {isFull && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          FULL (100%)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Online capacity: {slot.currentOnlineBookings}/{slot.onlineQuota} booked</span>
                      <span>•</span>
                      <span className={slot.onlineOccupancyPercent > 75 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                        {slot.onlineAvailable} slots left
                      </span>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : isFull ? (
                      <span className="text-xs font-semibold text-rose-500">Unavailable</span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600">
                        Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Reduces peak queue wait times
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-800 hover:text-slate-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
