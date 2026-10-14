import test from 'node:test';
import assert from 'node:assert/strict';

import { useCanteenStore } from '../src/store/canteenStore';
import { getShelfMatrixSummary } from '../src/lib/shelfEngine';

test('Phase 4 — 1. Multi-Counter Order Consolidation & Shelf Assignment', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  // Create a new order with 1 Biryani (C1) and 1 Drink (C3)
  const biryani = store.menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  const drink = store.menuItems.find((i) => i.id === 'item-cool-drink')!;

  store.clearCart();
  store.addToCart(biryani);
  store.addToCart(drink);
  store.setSelectedSlotId('slot-1930');

  const placeRes = store.placeOrder({
    userName: 'Karthik Rao',
    isWalkin: false,
    paymentMode: 'UPI',
  });

  assert.equal(placeRes.success, true, 'Order must be placed');
  const order = placeRes.order!;

  // Counter 1 marks Biryani ready
  const c1Item = order.items.find((i) => i.counterId === 'cnt-01')!;
  store.updateItemPrepStatus(order.id, c1Item.id, 'TRANSFERRED_TO_PICKUP');

  // Counter 3 marks Drink ready
  const c3Item = order.items.find((i) => i.counterId === 'cnt-03')!;
  store.updateItemPrepStatus(order.id, c3Item.id, 'TRANSFERRED_TO_PICKUP');

  // Verify order is ready for consolidation
  const consolidatedOrder = useCanteenStore.getState().orders.find((o) => o.id === order.id)!;
  assert.equal(
    consolidatedOrder.orderStatus,
    'READY_FOR_CONSOLIDATION',
    'Order must move to READY_FOR_CONSOLIDATION once all items reach pickup'
  );

  // Assign shelf
  const shelfRes = store.assignShelfToOrder(order.id);
  assert.equal(shelfRes.success, true, 'Shelf assignment must succeed');
  assert.ok(shelfRes.shelfCode, 'Assigned shelf code must be present');

  const readyOrder = useCanteenStore.getState().orders.find((o) => o.id === order.id)!;
  assert.equal(readyOrder.orderStatus, 'READY_FOR_PICKUP', 'Order must be READY_FOR_PICKUP');

  // Verify shelf is occupied in matrix
  const shelf = useCanteenStore.getState().pickupShelves.find((s) => s.id === shelfRes.shelfId || s.shelfCode === shelfRes.shelfCode)!;
  assert.ok(shelf, 'Assigned shelf must exist');
  assert.equal(shelf.isOccupied, true, 'Shelf must be marked as occupied');
  assert.equal(shelf.currentOrderId, order.id, 'Shelf must point to this order');
});

test('Phase 4 — 2. QR Verification & Automatic Shelf Deallocation', () => {
  const store = useCanteenStore.getState();
  const readyOrder = store.orders.find((o) => o.orderStatus === 'READY_FOR_PICKUP')!;
  assert.ok(readyOrder, 'A ready order must exist');
  const assignedShelfId = readyOrder.shelfId!;

  // Verify and collect using dynamic QR code hash
  const verifyRes = store.verifyAndCollectOrder(readyOrder.qrCodeHash);
  assert.equal(verifyRes.success, true, 'QR verification must succeed');
  assert.equal(verifyRes.order?.orderStatus, 'COLLECTED', 'Order status must be COLLECTED');

  // Verify shelf is now free in matrix
  const freedShelf = useCanteenStore.getState().pickupShelves.find((s) => s.id === assignedShelfId || s.shelfCode === assignedShelfId)!;
  assert.ok(freedShelf, 'Target shelf must exist');
  assert.equal(freedShelf.isOccupied, false, 'Shelf must be marked as free');
  assert.ok(!freedShelf.currentOrderId, 'Shelf currentOrderId must be cleared');
});

test('Phase 4 — 3. 4-Digit Manual PIN Fallback Verification', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  // Pick the seed order on Shelf A1 (PIN: 3104)
  const orderA1 = store.orders.find((o) => o.tokenNumber === 'A120')!;
  assert.ok(orderA1, 'Order A120 must exist in seed data');
  assert.equal(orderA1.shelfId, 'Shelf A1');

  // Verify using 4-digit PIN
  const pinRes = store.verifyAndCollectOrder(orderA1.pickupPin);
  assert.equal(pinRes.success, true, '4-Digit PIN verification must succeed');
  assert.equal(pinRes.order?.orderStatus, 'COLLECTED', 'Order status must be COLLECTED');

  // Verify Shelf A1 freed
  const shelfA1 = useCanteenStore.getState().pickupShelves.find((s) => s.id === 'Shelf A1' || s.shelfCode === 'A1')!;
  assert.ok(shelfA1, 'Shelf A1 must exist');
  assert.equal(shelfA1.isOccupied, false, 'Shelf A1 must be released back to available pool');
});

test('Phase 4 — 4. Single-Use Security Check & Duplicate Redemption Prevention', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();
  const orderA1 = store.orders.find((o) => o.tokenNumber === 'A120')!;

  // 1st redemption succeeds
  const firstRes = store.verifyAndCollectOrder(orderA1.pickupPin);
  assert.equal(firstRes.success, true, 'First collection must succeed');

  // 2nd duplicate redemption fails
  const duplicateRes = store.verifyAndCollectOrder(orderA1.pickupPin);
  assert.equal(duplicateRes.success, false, 'Duplicate verification must be rejected');
  assert.match(duplicateRes.errorMessage!, /already collected/i, 'Error message must specify already collected');
});
