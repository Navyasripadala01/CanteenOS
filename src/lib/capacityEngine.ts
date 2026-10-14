/**
 * CanteenOS — Capacity & Slot Engine
 * Manages dual-channel (Online + Walk-in) capacity allocation,
 * rush-level determination, item-slot constraints, and optimal slot recommendation.
 */

import type { PickupSlot, SlotItemCapacity, RushLevel, MenuItem } from '@/types';

export interface SlotAvailabilityResult {
  slotId: string;
  displayLabel: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  onlineQuota: number;
  walkinQuota: number;
  currentOnlineBookings: number;
  currentWalkinBookings: number;
  onlineAvailable: number;
  walkinAvailable: number;
  onlineOccupancyPercent: number;
  totalOccupancyPercent: number;
  rushLevel: RushLevel;
  isOnlineFull: boolean;
  isWalkinFull: boolean;
  isRecommended: boolean;
}

export function computeAllSlotAvailability(
  slots: PickupSlot[],
  currentTimeStr?: string
): SlotAvailabilityResult[] {
  let recommendedSlotId: string | null = null;

  const results = slots.map((slot) => {
    const onlineAvailable = Math.max(0, slot.onlineCapacityQuota - slot.currentOnlineBookings);
    const walkinAvailable = Math.max(0, slot.walkinCapacityQuota - slot.currentWalkinBookings);
    const onlineOccupancyPercent = Math.round((slot.currentOnlineBookings / (slot.onlineCapacityQuota || 1)) * 100);
    const totalBookings = slot.currentOnlineBookings + slot.currentWalkinBookings;
    const totalOccupancyPercent = Math.round((totalBookings / (slot.totalCapacity || 1)) * 100);

    let rushLevel: RushLevel = 'LOW';
    if (onlineOccupancyPercent > 75) {
      rushLevel = 'HIGH';
    } else if (onlineOccupancyPercent > 40) {
      rushLevel = 'MODERATE';
    }

    const isOnlineFull = slot.currentOnlineBookings >= slot.onlineCapacityQuota;
    const isWalkinFull = slot.currentWalkinBookings >= slot.walkinCapacityQuota;

    return {
      slotId: slot.id,
      displayLabel: slot.displayLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
      totalCapacity: slot.totalCapacity,
      onlineQuota: slot.onlineCapacityQuota,
      walkinQuota: slot.walkinCapacityQuota,
      currentOnlineBookings: slot.currentOnlineBookings,
      currentWalkinBookings: slot.currentWalkinBookings,
      onlineAvailable,
      walkinAvailable,
      onlineOccupancyPercent,
      totalOccupancyPercent,
      rushLevel,
      isOnlineFull,
      isWalkinFull,
      isRecommended: false,
    };
  });

  for (const item of results) {
    if (currentTimeStr && item.endTime <= currentTimeStr) {
      continue;
    }
    if (!item.isOnlineFull && item.onlineOccupancyPercent < 75) {
      recommendedSlotId = item.slotId;
      break;
    }
  }

  if (!recommendedSlotId) {
    const firstAvailable = results.find((r) => !r.isOnlineFull);
    if (firstAvailable) recommendedSlotId = firstAvailable.slotId;
  }

  return results.map((r) => ({
    ...r,
    isRecommended: r.slotId === recommendedSlotId,
  }));
}

export function validateOrderCapacity(
  slot: PickupSlot,
  isWalkin: boolean,
  cartItems: { menuItem: MenuItem; quantity: number }[],
  slotItemCapacities: SlotItemCapacity[]
): { allowed: boolean; reason?: string } {
  if (!slot.isActive) {
    return { allowed: false, reason: 'This pickup slot is currently closed.' };
  }

  if (isWalkin) {
    if (slot.currentWalkinBookings >= slot.walkinCapacityQuota) {
      return { allowed: false, reason: 'Walk-in capacity for this window is currently full.' };
    }
  } else {
    if (slot.currentOnlineBookings >= slot.onlineCapacityQuota) {
      return { allowed: false, reason: 'Online order capacity for this slot is full. Please pick next slot.' };
    }
  }

  for (const { menuItem, quantity } of cartItems) {
    const itemConstraint = slotItemCapacities.find(
      (sic) => sic.pickupSlotId === slot.id && sic.menuItemId === menuItem.id
    );
    if (itemConstraint) {
      if (itemConstraint.currentItemCount + quantity > itemConstraint.maxItemCapacity) {
        return {
          allowed: false,
          reason: `Kitchen limit reached for ${menuItem.name} in this slot. Only ${
            itemConstraint.maxItemCapacity - itemConstraint.currentItemCount
          } remaining for this time.`,
        };
      }
    }

    const remainingStock = menuItem.dailyPreparedQty - menuItem.committedQty;
    if (menuItem.isSoldOut || remainingStock < quantity) {
      return {
        allowed: false,
        reason: `${menuItem.name} has only ${remainingStock} portions remaining today.`,
      };
    }
  }

  return { allowed: true };
}

export function computeCampusRushOverview(slots: PickupSlot[]): {
  overallRushLevel: RushLevel;
  averageWaitMinutes: number;
  totalOnlineUtilization: number;
  totalWalkinUtilization: number;
  nextRecommendedSlot: PickupSlot | null;
} {
  let totalOnlineCap = 0;
  let totalOnlineBookings = 0;
  let totalWalkinCap = 0;
  let totalWalkinBookings = 0;

  for (const s of slots) {
    totalOnlineCap += s.onlineCapacityQuota;
    totalOnlineBookings += s.currentOnlineBookings;
    totalWalkinCap += s.walkinCapacityQuota;
    totalWalkinBookings += s.currentWalkinBookings;
  }

  const onlineUtil = Math.round((totalOnlineBookings / (totalOnlineCap || 1)) * 100);
  const walkinUtil = Math.round((totalWalkinBookings / (totalWalkinCap || 1)) * 100);

  let overallRushLevel: RushLevel = 'LOW';
  let averageWaitMinutes = 6;

  if (onlineUtil > 75) {
    overallRushLevel = 'HIGH';
    averageWaitMinutes = 18;
  } else if (onlineUtil > 40) {
    overallRushLevel = 'MODERATE';
    averageWaitMinutes = 12;
  }

  const availability = computeAllSlotAvailability(slots);
  const recResult = availability.find((a) => a.isRecommended);
  const nextRecommendedSlot = recResult ? slots.find((s) => s.id === recResult.slotId) || null : null;

  return {
    overallRushLevel,
    averageWaitMinutes,
    totalOnlineUtilization: onlineUtil,
    totalWalkinUtilization: walkinUtil,
    nextRecommendedSlot,
  };
}
