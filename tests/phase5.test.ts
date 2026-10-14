import test from 'node:test';
import assert from 'node:assert/strict';

import { useCanteenStore } from '../src/store/canteenStore';
import { computeAllSlotAvailability, computeCampusRushOverview, validateOrderCapacity } from '../src/lib/capacityEngine';

test('Phase 5 — 1. Dual-Channel Capacity Tuning & Dynamic Quota Scaling', () => {
  useCanteenStore.getState().resetToSeedData();
  const store = useCanteenStore.getState();

  // Admin scales total dinner capacity from 100 to 120 with an 80% online / 20% walk-in split
  const totalCap = 120;
  const onlineQuota = 96; // 80% of 120
  const walkinQuota = 24; // 20% of 120

  const tunedSlots = store.pickupSlots.map((s) => ({
    ...s,
    totalCapacity: totalCap,
    onlineCapacityQuota: onlineQuota,
    walkinCapacityQuota: walkinQuota,
  }));

  useCanteenStore.setState({ pickupSlots: tunedSlots });

  const updatedSlots = useCanteenStore.getState().pickupSlots;
  assert.equal(updatedSlots[0].totalCapacity, 120, 'Total capacity must be updated to 120');
  assert.equal(updatedSlots[0].onlineCapacityQuota, 96, 'Online quota must be 96');
  assert.equal(updatedSlots[0].walkinCapacityQuota, 24, 'Walk-in quota must be 24');

  // Verify capacity engine respects new quota
  const slot1920 = updatedSlots.find((s) => s.id === 'slot-1920')!;
  // Slot 1920 has 70 bookings. Under 96 quota, it is no longer full!
  const validation = validateOrderCapacity(
    slot1920,
    false,
    [{ menuItem: store.menuItems[0], quantity: 1 }],
    store.slotItemCapacities
  );
  assert.equal(validation.allowed, true, 'Slot 7:20-7:30 PM should now be open under scaled 96 quota');
});

test('Phase 5 — 2. Peak Dinner Demand Heatmap & Rush Computation', () => {
  useCanteenStore.getState().resetToSeedData();
  const currentSlots = useCanteenStore.getState().pickupSlots;

  const slotAvailability = computeAllSlotAvailability(currentSlots);
  assert.equal(slotAvailability.length, 6, 'Must analyze all 6 dinner intervals (7:00–8:00 PM)');

  // Slot 7:20–7:30 PM in seed data has 70/70 online bookings
  const slot1920 = slotAvailability.find((s) => s.slotId === 'slot-1920')!;
  assert.equal(slot1920.isOnlineFull, true, 'Slot 7:20–7:30 PM must be flagged as online full');
  assert.equal(slot1920.rushLevel, 'HIGH', 'Rush level must be HIGH');

  // Slot 7:30–7:40 PM has 34/70 bookings (<75%)
  const slot1930 = slotAvailability.find((s) => s.slotId === 'slot-1930')!;
  assert.equal(slot1930.isOnlineFull, false, 'Slot 7:30–7:40 PM must have open online capacity');
  assert.equal(slot1930.isRecommended, true, 'Slot 7:30–7:40 PM must be marked as RECOMMENDED');
});

test('Phase 5 — 3. Financial Rollup & Gross Revenue Telemetry', () => {
  useCanteenStore.getState().resetToSeedData();
  const store = useCanteenStore.getState();

  const activeOrders = store.orders.filter(
    (o) => !['CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  assert.ok(totalRevenue > 0, 'Total session revenue must be greater than zero');
  assert.equal(typeof totalRevenue, 'number', 'Revenue must be numeric');
});

test('Phase 5 — 4. Operational Exceptions Logging & Safety Audit Stream', () => {
  useCanteenStore.getState().resetToSeedData();
  const store = useCanteenStore.getState();
  const initialLogsCount = store.exceptionLogs.length;

  // Record an unexpected stockout event
  store.recordException(
    'UNEXPECTED_STOCKOUT',
    'Masala Chai milk supply depleted unexpectedly during peak slot 7:30 PM.',
    'system'
  );

  const updatedLogs = useCanteenStore.getState().exceptionLogs;
  assert.equal(updatedLogs.length, initialLogsCount + 1, 'Exception log count must increment');

  const latestLog = updatedLogs[updatedLogs.length - 1];
  assert.equal(latestLog.exceptionType, 'UNEXPECTED_STOCKOUT');
  assert.match(latestLog.message, /Masala Chai/i);
});
