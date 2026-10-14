import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeAllSlotAvailability,
  validateOrderCapacity,
  computeCampusRushOverview,
} from '../src/lib/capacityEngine';

import {
  getShelfMatrixSummary,
  allocateNextAvailableShelf,
  releaseShelfByOrderId,
} from '../src/lib/shelfEngine';

import {
  aggregateBatchBySlot,
  checkOrderReadyForConsolidation,
  getJITDrinkStagingAdvice,
} from '../src/lib/routingEngine';

import {
  evaluateStudentCancellation,
  evaluateCanteenCancellation,
} from '../src/lib/cancellationEngine';

import {
  verifyPickupToken,
  createExceptionLog,
} from '../src/lib/exceptionHandler';

import {
  SEED_PICKUP_SLOTS,
  SEED_PICKUP_SHELVES,
  SEED_MENU_ITEMS,
  SEED_SLOT_ITEM_CAPACITIES,
  SEED_CANTEEN,
} from '../src/data/seedData';

import type { Order, OrderStatus } from '../src/types';

test('1. Capacity Engine — Dual-Channel Quota & Rush Level Determination', () => {
  const availability = computeAllSlotAvailability(SEED_PICKUP_SLOTS);
  assert.equal(availability.length, 6, 'Should compute availability for all 6 dinner slots');

  // Slot 7:20-7:30 is 100% full in seed data (70/70 online bookings)
  const fullSlot = availability.find((s) => s.slotId === 'slot-1920');
  assert.ok(fullSlot, 'Slot 7:20-7:30 exists');
  assert.equal(fullSlot.isOnlineFull, true, 'Slot 7:20-7:30 should be flagged as online full');
  assert.equal(fullSlot.onlineAvailable, 0, 'Slot 7:20-7:30 should have 0 online available');
  assert.equal(fullSlot.rushLevel, 'HIGH', 'Slot 7:20-7:30 should be HIGH rush');

  // Slot 7:30-7:40 has 34/70 online bookings (48% occupancy -> Moderate rush)
  const recSlot = availability.find((s) => s.slotId === 'slot-1930');
  assert.ok(recSlot, 'Slot 7:30-7:40 exists');
  assert.equal(recSlot.isOnlineFull, false, 'Slot 7:30-7:40 should not be full');
  assert.equal(recSlot.rushLevel, 'MODERATE', 'Slot 7:30-7:40 should be MODERATE rush');
  assert.equal(recSlot.isRecommended, true, 'Slot 7:30-7:40 should be the recommended slot');
});

test('2. Capacity Engine — Order Validation & Rejection on Full Online Slot', () => {
  const fullSlot = SEED_PICKUP_SLOTS.find((s) => s.id === 'slot-1920')!;
  const chickenBiryani = SEED_MENU_ITEMS.find((m) => m.id === 'item-biryani-chicken')!;

  // Attempt online order on full slot
  const onlineResult = validateOrderCapacity(
    fullSlot,
    false, // isWalkin = false (Online)
    [{ menuItem: chickenBiryani, quantity: 1 }],
    SEED_SLOT_ITEM_CAPACITIES
  );
  assert.equal(onlineResult.allowed, false, 'Online order must be rejected on full slot');
  assert.match(onlineResult.reason!, /Online order capacity for this slot is full/);

  // But if the slot still has walk-in capacity, walk-in should succeed or be evaluated separately
  const openSlot = SEED_PICKUP_SLOTS.find((s) => s.id === 'slot-1930')!;
  const validResult = validateOrderCapacity(
    openSlot,
    false,
    [{ menuItem: chickenBiryani, quantity: 2 }],
    SEED_SLOT_ITEM_CAPACITIES
  );
  assert.equal(validResult.allowed, true, 'Order within available capacity must be accepted');
});

test('3. Capacity Engine — Item-Specific Slot Constraint Enforcement', () => {
  const openSlot = SEED_PICKUP_SLOTS.find((s) => s.id === 'slot-1930')!;
  const chickenBiryani = SEED_MENU_ITEMS.find((m) => m.id === 'item-biryani-chicken')!;

  // In seed data: maxItemCapacity for Biryani in 7:30 slot is 25, current is 14 -> 11 available
  // Requesting 15 portions exceeds slot item limit
  const exceededResult = validateOrderCapacity(
    openSlot,
    false,
    [{ menuItem: chickenBiryani, quantity: 15 }],
    SEED_SLOT_ITEM_CAPACITIES
  );
  assert.equal(exceededResult.allowed, false, 'Should reject when item-slot limit is exceeded');
  assert.match(exceededResult.reason!, /Kitchen limit reached/);
});

test('4. Shelf Engine — 24 Finite Shelves Matrix & Safe Overflow Handling', () => {
  const summary = getShelfMatrixSummary(SEED_PICKUP_SHELVES);
  assert.equal(summary.totalShelves, 24, 'Total physical shelves must be exactly 24');
  assert.equal(summary.occupiedCount, 2, '2 shelves occupied in initial seed data');
  assert.equal(summary.availableCount, 22, '22 shelves available in initial seed data');
  assert.equal(summary.isZoneFull, false, 'Zone should not be full');

  // Allocate next available shelf for new order #A127
  const allocResult = allocateNextAvailableShelf(SEED_PICKUP_SHELVES, 'ord-demo-127');
  assert.equal(allocResult.result.success, true, 'Shelf allocation should succeed');
  assert.equal(allocResult.result.assignedShelfId, 'Shelf A3', 'Should allocate Shelf A3 next');

  // Verify release upon collection
  const releaseResult = releaseShelfByOrderId(allocResult.updatedShelves, 'ord-demo-127');
  assert.equal(releaseResult.freedShelfId, 'Shelf A3', 'Shelf A3 must be freed');
});

test('5. Shelf Engine — Safe Failure Behavior when Zone is 100% Full', () => {
  // Create simulated 24 fully occupied shelves
  const fullyOccupiedShelves = SEED_PICKUP_SHELVES.map((s) => ({
    ...s,
    isOccupied: true,
    currentOrderId: `ord-mock-${s.shelfCode}`,
  }));

  const summary = getShelfMatrixSummary(fullyOccupiedShelves);
  assert.equal(summary.isZoneFull, true, 'Shelf summary must detect 100% occupancy');
  assert.equal(summary.availableCount, 0, '0 available shelves');

  // Attempt to allocate 25th order
  const allocAttempt = allocateNextAvailableShelf(fullyOccupiedShelves, 'ord-overflow-25');
  assert.equal(allocAttempt.result.success, false, 'Allocation must safely fail when shelves are full');
  assert.equal(allocAttempt.result.isZoneFull, true, 'Must flag isZoneFull');
  assert.match(allocAttempt.result.errorMessage!, /Pickup zone is currently at 100% shelf capacity/);
});

test('6. Routing Engine — Multi-Counter Decomposition & Kitchen Batch Rollup', () => {
  const sampleOrders: any[] = [
    {
      id: 'ord-101',
      tokenNumber: 'A127',
      pickupSlotId: 'slot-1930',
      slotDisplayLabel: '7:30 – 7:40 PM',
      orderStatus: 'PLACED',
      items: [
        { menuItemId: 'item-biryani-chicken', counterId: 'cnt-01', itemName: 'Chicken Dum Biryani', quantity: 2, itemStatus: 'QUEUED' },
        { menuItemId: 'item-cool-drink', counterId: 'cnt-03', itemName: 'Chilled Cool Drink', quantity: 1, itemStatus: 'QUEUED', isFastItem: true },
      ],
    },
    {
      id: 'ord-102',
      tokenNumber: 'A128',
      pickupSlotId: 'slot-1930',
      slotDisplayLabel: '7:30 – 7:40 PM',
      orderStatus: 'PLACED',
      items: [
        { menuItemId: 'item-biryani-chicken', counterId: 'cnt-01', itemName: 'Chicken Dum Biryani', quantity: 3, itemStatus: 'QUEUED' },
        { menuItemId: 'item-fried-rice-veg', counterId: 'cnt-01', itemName: 'Veg Hakka Fried Rice', quantity: 1, itemStatus: 'QUEUED' },
      ],
    },
  ];

  // Aggregate Counter 1 batch for Slot 7:30-7:40
  const c1Batch = aggregateBatchBySlot(sampleOrders, 'slot-1930', 'cnt-01');
  assert.equal(c1Batch.items.length, 2, 'Counter 1 prepares 2 distinct items');
  const biryaniBatch = c1Batch.items.find((i) => i.menuItemId === 'item-biryani-chicken')!;
  assert.equal(biryaniBatch.totalQuantityNeeded, 5, 'Total 5 Biryanis needed across Orders A127 and A128');
  assert.deepEqual(biryaniBatch.orderTokens, ['A127', 'A128'], 'Should list contributing order tokens');
});

test('7. Routing Engine — Just-in-Time Fast Item (Beverage) Staging Advice', () => {
  const orderWithHotQueued: any = {
    id: 'ord-101',
    tokenNumber: 'A127',
    items: [
      { id: '1', counterId: 'cnt-01', isFastItem: false, itemStatus: 'QUEUED' },
      { id: '2', counterId: 'cnt-03', isFastItem: true, itemStatus: 'QUEUED' },
    ],
  };
  const advice1 = getJITDrinkStagingAdvice(orderWithHotQueued);
  assert.equal(advice1.shouldPrepareFastItem, false, 'Should hold drink while hot food is still queued');

  const orderWithHotPreparing: any = {
    id: 'ord-101',
    tokenNumber: 'A127',
    items: [
      { id: '1', counterId: 'cnt-01', isFastItem: false, itemStatus: 'PREPARING' },
      { id: '2', counterId: 'cnt-03', isFastItem: true, itemStatus: 'QUEUED' },
    ],
  };
  const advice2 = getJITDrinkStagingAdvice(orderWithHotPreparing);
  assert.equal(advice2.shouldPrepareFastItem, true, 'Should stage drink once hot dish enters PREPARING');
});

test('8. Cancellation Engine — Differential Student vs Canteen Policy', () => {
  const placedOrder: any = {
    id: 'ord-test',
    totalAmount: 110,
    orderStatus: 'PLACED',
  };

  // Student cancellation in PLACED stage -> 100% refund
  const studentEval = evaluateStudentCancellation(placedOrder, SEED_CANTEEN.cancellationRules);
  assert.equal(studentEval.canCancel, true, 'Student can cancel in PLACED stage');
  assert.equal(studentEval.refundAmount, 110, 'Full refund in PLACED stage');
  assert.equal(studentEval.targetStatus, 'CANCELLED_BY_STUDENT');

  // Student cancellation in PREPARING stage -> blocked by default policy
  const prepOrder: any = { ...placedOrder, orderStatus: 'PREPARING' };
  const studentPrepEval = evaluateStudentCancellation(prepOrder, SEED_CANTEEN.cancellationRules);
  assert.equal(studentPrepEval.canCancel, false, 'Student cannot cancel during batch preparation');

  // Canteen cancellation in any active stage -> Always 100% refund
  const canteenEval = evaluateCanteenCancellation(prepOrder, SEED_CANTEEN.cancellationRules, 'Equipment breakdown');
  assert.equal(canteenEval.canCancel, true, 'Canteen cancellation always allowed for active orders');
  assert.equal(canteenEval.refundAmount, 110, '100% refund on canteen cancellation');
  assert.equal(canteenEval.targetStatus, 'CANCELLED_BY_CANTEEN');
});

test('9. Exception Handling — QR Token and 4-Digit PIN Fallback Verification', () => {
  const readyOrder: any = {
    id: 'ord-127',
    tokenNumber: 'A127',
    orderStatus: 'READY_FOR_PICKUP',
    pickupPin: '4829',
    qrCodeHash: 'canteen-os:qr:ord-127:4829',
  };

  // Valid QR scan
  const qrResult = verifyPickupToken(readyOrder, 'canteen-os:qr:ord-127:4829');
  assert.equal(qrResult.valid, true, 'Valid QR scan must pass');
  assert.equal(qrResult.usedPinFallback, false, 'QR scan is not a PIN fallback');

  // Valid 4-digit PIN fallback
  const pinResult = verifyPickupToken(readyOrder, '4829');
  assert.equal(pinResult.valid, true, 'Valid 4-digit PIN must pass');
  assert.equal(pinResult.usedPinFallback, true, 'Must identify PIN fallback usage');

  // Invalid token
  const invalidResult = verifyPickupToken(readyOrder, '9999');
  assert.equal(invalidResult.valid, false, 'Invalid PIN must be rejected');

  // Reject collection if order is not ready
  const notReadyOrder: any = { ...readyOrder, orderStatus: 'PREPARING' };
  const notReadyResult = verifyPickupToken(notReadyOrder, '4829');
  assert.equal(notReadyResult.valid, false, 'Must reject collection if order is not in READY_FOR_PICKUP status');
});
