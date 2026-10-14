/**
 * CanteenOS — Physical Shelf & Pickup Zone Manager
 * Coordinates finite 24 cubby shelves (Zone A1-D6), prevents shelf overflow,
 * provides safe failure staging, and handles automatic release on pickup.
 */

import type { PickupShelf } from '@/types';

export interface ShelfAllocationResult {
  success: boolean;
  assignedShelfId: string | null;
  shelfCode: string | null;
  errorMessage?: string;
  isZoneFull?: boolean;
}

export interface ShelfMatrixSummary {
  totalShelves: number;
  occupiedCount: number;
  availableCount: number;
  occupancyPercent: number;
  isZoneFull: boolean;
  zoneCounts: {
    zone: 'A' | 'B' | 'C' | 'D';
    occupied: number;
    total: number;
  }[];
}

export function getShelfMatrixSummary(shelves: PickupShelf[]): ShelfMatrixSummary {
  const totalShelves = shelves.length;
  const occupiedCount = shelves.filter((s) => s.isOccupied).length;
  const availableCount = totalShelves - occupiedCount;
  const occupancyPercent = Math.round((occupiedCount / (totalShelves || 1)) * 100);

  const zones: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const zoneCounts = zones.map((z) => {
    const zoneShelves = shelves.filter((s) => s.zone === z);
    return {
      zone: z,
      occupied: zoneShelves.filter((s) => s.isOccupied).length,
      total: zoneShelves.length,
    };
  });

  return {
    totalShelves,
    occupiedCount,
    availableCount,
    occupancyPercent,
    isZoneFull: availableCount === 0,
    zoneCounts,
  };
}

export function allocateNextAvailableShelf(
  shelves: PickupShelf[],
  orderId: string
): { updatedShelves: PickupShelf[]; result: ShelfAllocationResult } {
  const existingShelf = shelves.find((s) => s.currentOrderId === orderId);
  if (existingShelf) {
    return {
      updatedShelves: shelves,
      result: {
        success: true,
        assignedShelfId: existingShelf.id,
        shelfCode: existingShelf.shelfCode,
      },
    };
  }

  const availableShelf = shelves.find((s) => !s.isOccupied);

  if (!availableShelf) {
    return {
      updatedShelves: shelves,
      result: {
        success: false,
        assignedShelfId: null,
        shelfCode: null,
        errorMessage: 'Pickup zone is currently at 100% shelf capacity (24/24 occupied). Please wait for a collection.',
        isZoneFull: true,
      },
    };
  }

  const updatedShelves = shelves.map((s) => {
    if (s.id === availableShelf.id) {
      return {
        ...s,
        isOccupied: true,
        currentOrderId: orderId,
        assignedAt: new Date().toISOString(),
      };
    }
    return s;
  });

  return {
    updatedShelves,
    result: {
      success: true,
      assignedShelfId: availableShelf.id,
      shelfCode: availableShelf.shelfCode,
    },
  };
}

export function releaseShelfByOrderId(
  shelves: PickupShelf[],
  orderId: string
): { updatedShelves: PickupShelf[]; freedShelfId: string | null } {
  let freedShelfId: string | null = null;

  const updatedShelves = shelves.map((s) => {
    if (s.currentOrderId === orderId) {
      freedShelfId = s.id;
      return {
        ...s,
        isOccupied: false,
        currentOrderId: null,
        assignedAt: null,
      };
    }
    return s;
  });

  return { updatedShelves, freedShelfId };
}
