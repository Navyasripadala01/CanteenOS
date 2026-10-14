import test from 'node:test';
import assert from 'node:assert/strict';

import { useCanteenStore } from '../src/store/canteenStore';
import { aggregateBatchBySlot, getJITDrinkStagingAdvice } from '../src/lib/routingEngine';
import { validateOrderCapacity } from '../src/lib/capacityEngine';

test('Phase 3 — 1. Kitchen Slot Batch Aggregator & One-Tap Batch Transitions', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  // Aggregate Counter 1 (Biryani & Rice) for 7:20-7:30 slot
  const c1Batch = aggregateBatchBySlot(store.orders, 'slot-1920', 'cnt-01');
  assert.ok(c1Batch, 'Counter 1 batch must be computed');
  assert.equal(c1Batch.slotId, 'slot-1920');

  // Execute batch status transition to PREPARING
  store.batchUpdateSlotStatus('slot-1920', 'cnt-01', 'PREPARING');

  const updatedOrders = useCanteenStore.getState().orders.filter((o) => o.pickupSlotId === 'slot-1920');
  const c1Items = updatedOrders.flatMap((o) => o.items.filter((i) => i.counterId === 'cnt-01'));
  assert.ok(c1Items.every((i) => i.itemStatus === 'PREPARING'), 'All Counter 1 items in slot must be PREPARING');
});

test('Phase 3 — 2. Just-In-Time (JIT) Fast Item (Beverage) Staging Advice', () => {
  // Test Order with 1 Hot Food (Counter 1) and 1 Cold Drink (Counter 3)
  const orderQueued = {
    id: 'ord-test-1',
    tokenNumber: 'A127',
    items: [
      { id: '1', counterId: 'cnt-01', itemName: 'Chicken Biryani', isFastItem: false, itemStatus: 'QUEUED' },
      { id: '2', counterId: 'cnt-03', itemName: 'Chilled Cool Drink', isFastItem: true, itemStatus: 'QUEUED' },
    ],
  };

  const adviceQueued = getJITDrinkStagingAdvice(orderQueued as any);
  assert.equal(adviceQueued.shouldPrepareFastItem, false, 'Should hold drink prep while hot food is still QUEUED');

  // When hot food moves to PREPARING
  const orderPreparing = {
    id: 'ord-test-1',
    tokenNumber: 'A127',
    items: [
      { id: '1', counterId: 'cnt-01', itemName: 'Chicken Biryani', isFastItem: false, itemStatus: 'PREPARING' },
      { id: '2', counterId: 'cnt-03', itemName: 'Chilled Cool Drink', isFastItem: true, itemStatus: 'QUEUED' },
    ],
  };

  const advicePrep = getJITDrinkStagingAdvice(orderPreparing as any);
  assert.equal(advicePrep.shouldPrepareFastItem, true, 'Should signal drink prep once hot food is PREPARING');
});

test('Phase 3 — 3. Emergency 86 / Stockout Toggle & Order Blocker', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  const biryaniId = 'item-biryani-chicken';

  // Toggle 86 / Sold Out on Biryani
  store.toggleItemSoldOut(biryaniId);

  const updatedBiryani = useCanteenStore.getState().menuItems.find((i) => i.id === biryaniId)!;
  assert.equal(updatedBiryani.isSoldOut, true, 'Biryani must be flagged as sold out');

  // Attempt to validate order on sold out item
  const openSlot = store.pickupSlots.find((s) => s.id === 'slot-1930')!;
  const validation = validateOrderCapacity(
    openSlot,
    false,
    [{ menuItem: updatedBiryani, quantity: 1 }],
    store.slotItemCapacities
  );
  assert.equal(validation.allowed, false, 'Ordering a sold out item must be rejected');

  // Toggle back to available
  store.toggleItemSoldOut(biryaniId);
  const reactivatedBiryani = useCanteenStore.getState().menuItems.find((i) => i.id === biryaniId)!;
  assert.equal(reactivatedBiryani.isSoldOut, false, 'Biryani must be reactivated');
});

test('Phase 3 — 4. Counter 3 Walk-In POS Order Entry & Quota Consumption', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  const targetSlot = store.pickupSlots.find((s) => s.id === 'slot-1930')!;
  const initialWalkinBookings = targetSlot.currentWalkinBookings;
  const initialOnlineBookings = targetSlot.currentOnlineBookings;

  const thaliMeal = store.menuItems.find((i) => i.id === 'item-south-meals')!;
  const masalaChai = store.menuItems.find((i) => i.id === 'item-masala-chai')!;

  store.addToCart(thaliMeal);
  store.addToCart(masalaChai);
  store.setSelectedSlotId('slot-1930');

  // Place Walk-in Sale
  const result = store.placeOrder({
    userName: 'Walk-in Faculty Prof. Iyer',
    isWalkin: true,
    paymentMode: 'CASH_AT_COUNTER',
  });

  assert.equal(result.success, true, 'Walk-in POS sale must succeed');
  assert.ok(result.order, 'Order must be generated');
  assert.equal(result.order?.isWalkinOrder, true, 'Order must be flagged as walk-in');

  // Verify walk-in booking incremented, online booking untouched
  const updatedSlot = useCanteenStore.getState().pickupSlots.find((s) => s.id === 'slot-1930')!;
  assert.equal(updatedSlot.currentWalkinBookings, initialWalkinBookings + 1, 'Walk-in bookings must increment by 1');
  assert.equal(updatedSlot.currentOnlineBookings, initialOnlineBookings, 'Online bookings must remain unchanged');
});

test('Phase 3 — 5. Operational Delay Broadcast', () => {
  const store = useCanteenStore.getState();
  const targetOrder = store.orders[0];

  // Kitchen Chef Ramesh adds +5 mins prep delay
  store.flagOrderDelay(targetOrder.id, 5);

  const updatedOrder = useCanteenStore.getState().orders.find((o) => o.id === targetOrder.id)!;
  assert.equal(updatedOrder.isDelayed, true, 'Order must be flagged as delayed');
  assert.equal(updatedOrder.delayMinutes, 5, 'Delay minutes must equal 5');

  // Exception log recorded
  const logs = useCanteenStore.getState().exceptionLogs;
  assert.ok(logs.some((l) => l.orderId === targetOrder.id && l.exceptionType === 'DELAYED_FOOD_ITEM'));
});
