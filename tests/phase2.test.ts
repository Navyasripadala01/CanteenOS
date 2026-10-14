import test from 'node:test';
import assert from 'node:assert/strict';

import { useCanteenStore } from '../src/store/canteenStore';
import { SEED_MENU_ITEMS, SEED_PICKUP_SLOTS } from '../src/data/seedData';
import { computeCampusRushOverview } from '../src/lib/capacityEngine';

test('Phase 2 — 1. Student Cart, Multi-Counter Selection & Friend Name Tagging', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  const biryani = store.menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  const coolDrink = store.menuItems.find((i) => i.id === 'item-cool-drink')!;

  // 1. Add Biryani for Rahul
  store.addToCart(biryani, 'For Rahul');
  // 2. Add Biryani for Amit
  store.addToCart(biryani, 'For Amit');
  // 3. Add Cool Drink
  store.addToCart(coolDrink);

  const cart = useCanteenStore.getState().cart;
  assert.equal(cart.length, 3, 'Cart should contain 3 distinct tagged line items');

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  assert.equal(totalCartCount, 3, 'Total items in cart should be 3');

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  assert.equal(subtotal, 90 + 90 + 20, 'Subtotal should equal ₹200 (90 + 90 + 20)');
});

test('Phase 2 — 2. Smart Pickup Slot Recommendation & Selection', () => {
  const store = useCanteenStore.getState();
  const rushOverview = computeCampusRushOverview(store.pickupSlots);

  assert.ok(rushOverview.nextRecommendedSlot, 'A recommended uncrowded slot must exist');
  assert.equal(rushOverview.nextRecommendedSlot?.id, 'slot-1930', 'Recommended slot should be 7:30-7:40 PM');

  // Student selects 7:30-7:40 PM slot
  store.setSelectedSlotId('slot-1930');
  assert.equal(useCanteenStore.getState().selectedSlotId, 'slot-1930', 'Selected slot must update to 7:30-7:40 PM');
});

test('Phase 2 — 3. Atomic Order Placement & Multi-Counter Item Decomposition', () => {
  const store = useCanteenStore.getState();
  store.resetToSeedData();

  const biryani = store.menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  const coolDrink = store.menuItems.find((i) => i.id === 'item-cool-drink')!;

  const initialBiryaniStock = biryani.dailyPreparedQty - biryani.committedQty;
  const initialDrinkStock = coolDrink.dailyPreparedQty - coolDrink.committedQty;

  // Add 1 Biryani + 1 Cool Drink to Cart
  store.addToCart(biryani, 'For Rahul');
  store.addToCart(coolDrink);
  store.setSelectedSlotId('slot-1930');

  // Place Order with Mock UPI payment
  const result = store.placeOrder({
    userName: 'Rahul Varma',
    isWalkin: false,
    paymentMode: 'UPI',
  });

  assert.equal(result.success, true, 'Order placement must succeed');
  assert.ok(result.order, 'Order object must be returned');

  const order = result.order!;
  assert.match(order.tokenNumber, /^A\d+$/, 'Token number format must be A1xx');
  assert.equal(order.totalAmount, 110, 'Total amount must be ₹110');
  assert.equal(order.paymentStatus, 'COMPLETED', 'Payment status must be COMPLETED');
  assert.equal(order.orderStatus, 'PLACED', 'Initial order status must be PLACED');
  assert.equal(order.items.length, 2, 'Must contain 2 decomposed items');

  // Check multi-counter assignment
  const biryaniItem = order.items.find((i) => i.menuItemId === 'item-biryani-chicken')!;
  assert.equal(biryaniItem.counterId, 'cnt-01', 'Biryani must route to Counter 1');

  const drinkItem = order.items.find((i) => i.menuItemId === 'item-cool-drink')!;
  assert.equal(drinkItem.counterId, 'cnt-03', 'Drink must route to Counter 3');

  // Verify atomic stock deduction
  const updatedBiryani = useCanteenStore.getState().menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  const updatedDrink = useCanteenStore.getState().menuItems.find((i) => i.id === 'item-cool-drink')!;

  assert.equal(
    updatedBiryani.dailyPreparedQty - updatedBiryani.committedQty,
    initialBiryaniStock - 1,
    'Biryani stock must decrement by 1'
  );
  assert.equal(
    updatedDrink.dailyPreparedQty - updatedDrink.committedQty,
    initialDrinkStock - 1,
    'Drink stock must decrement by 1'
  );

  // Verify slot online booking count incremented
  const updatedSlot = useCanteenStore.getState().pickupSlots.find((s) => s.id === 'slot-1930')!;
  assert.equal(updatedSlot.currentOnlineBookings, 35, 'Slot online bookings must increment by 1');
});

test('Phase 2 — 4. Student Cancellation & Automated Full Refund', () => {
  const store = useCanteenStore.getState();
  const latestOrder = store.orders[0];
  assert.ok(latestOrder, 'An active order must exist');

  const biryaniBeforeCancel = store.menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  const committedBefore = biryaniBeforeCancel.committedQty;

  // Student cancels order in PLACED stage
  const cancelResult = store.cancelOrderAsStudent(latestOrder.id);
  assert.equal(cancelResult.success, true, 'Student cancellation must succeed in PLACED stage');
  assert.equal(cancelResult.refundAmount, latestOrder.totalAmount, 'Refund amount must be 100% of order total');

  const cancelledOrder = useCanteenStore.getState().orders.find((o) => o.id === latestOrder.id)!;
  assert.equal(cancelledOrder.orderStatus, 'CANCELLED_BY_STUDENT', 'Status must be CANCELLED_BY_STUDENT');

  // Verify inventory rollback
  const biryaniAfterCancel = useCanteenStore.getState().menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  assert.equal(biryaniAfterCancel.committedQty, committedBefore - 1, 'Inventory must be restored');
});
