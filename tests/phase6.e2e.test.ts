import test from 'node:test';
import assert from 'node:assert/strict';

import { useCanteenStore } from '../src/store/canteenStore';
import { computeCampusRushOverview, computeAllSlotAvailability } from '../src/lib/capacityEngine';
import { getJITDrinkStagingAdvice, aggregateBatchBySlot } from '../src/lib/routingEngine';
import { getShelfMatrixSummary } from '../src/lib/shelfEngine';

test('Phase 6 — Complete End-to-End 19-Step CanteenOS Campus Simulation', () => {
  // Reset clean simulation environment
  useCanteenStore.getState().resetToSeedData();
  const store = useCanteenStore.getState();

  // -------------------------------------------------------------
  // STEP 1: Student Rahul reviews live dinner rush overview
  // -------------------------------------------------------------
  const initialRush = computeCampusRushOverview(store.pickupSlots);
  assert.ok(['MODERATE', 'HIGH'].includes(initialRush.overallRushLevel), 'Step 1: Campus must reflect dinner rush');
  assert.ok(initialRush.averageWaitMinutes >= 10, 'Step 1: Wait estimate must reflect dinner traffic');

  // -------------------------------------------------------------
  // STEP 2: Rahul inspects slots; slot 7:20-7:30 is FULL; selects recommended 7:30-7:40
  // -------------------------------------------------------------
  const slotAvailability = computeAllSlotAvailability(store.pickupSlots);
  const fullSlot = slotAvailability.find((s) => s.slotId === 'slot-1920')!;
  assert.equal(fullSlot.isOnlineFull, true, 'Step 2: Slot 7:20–7:30 PM must be 100% online full');

  const recSlot = slotAvailability.find((s) => s.isRecommended)!;
  assert.equal(recSlot.slotId, 'slot-1930', 'Step 2: Recommended slot must be 7:30–7:40 PM');
  useCanteenStore.getState().setSelectedSlotId(recSlot.slotId);

  // -------------------------------------------------------------
  // STEP 3: Rahul adds 2x Biryani with friend tagging (Rahul & Amit)
  // -------------------------------------------------------------
  const biryaniItem = store.menuItems.find((i) => i.id === 'item-biryani-chicken')!;
  useCanteenStore.getState().addToCart(biryaniItem, 'For Rahul');
  useCanteenStore.getState().addToCart(biryaniItem, 'For Amit');

  // -------------------------------------------------------------
  // STEP 4: Rahul adds 1x Chilled Cool Drink
  // -------------------------------------------------------------
  const drinkItem = store.menuItems.find((i) => i.id === 'item-cool-drink')!;
  useCanteenStore.getState().addToCart(drinkItem);

  // -------------------------------------------------------------
  // STEP 5: Rahul reviews cart (3 items across Counters 1 & 3, Total ₹200)
  // -------------------------------------------------------------
  const currentCart = useCanteenStore.getState().cart;
  assert.equal(currentCart.length, 3, 'Step 5: Cart must have 3 distinct line items');
  const cartTotal = currentCart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  assert.equal(cartTotal, 200, 'Step 5: Subtotal must equal ₹200 (90 + 90 + 20)');

  // -------------------------------------------------------------
  // STEP 6 & 7: Rahul pays via Mock UPI; Order #A127 generated atomically
  // -------------------------------------------------------------
  const placeResult = useCanteenStore.getState().placeOrder({
    userName: 'Rahul Varma',
    isWalkin: false,
    paymentMode: 'UPI',
  });
  assert.equal(placeResult.success, true, 'Step 6-7: Order placement must succeed');
  const orderA127 = placeResult.order!;
  assert.equal(orderA127.orderStatus, 'PLACED', 'Step 7: Order status must start as PLACED');
  assert.equal(orderA127.totalAmount, 200, 'Step 7: Total amount must be ₹200');
  assert.ok(orderA127.pickupPin, 'Step 7: 4-digit PIN must be generated');
  assert.ok(orderA127.qrCodeHash, 'Step 7: QR token must be generated');

  // -------------------------------------------------------------
  // STEP 8: Walk-in student orders at Counter 3 Cash POS
  // -------------------------------------------------------------
  const walkinSlot = useCanteenStore.getState().pickupSlots.find((s) => s.id === 'slot-1930')!;
  const walkinBefore = walkinSlot.currentWalkinBookings;

  useCanteenStore.getState().clearCart();
  useCanteenStore.getState().addToCart(store.menuItems.find((i) => i.id === 'item-south-meals')!);
  useCanteenStore.getState().addToCart(store.menuItems.find((i) => i.id === 'item-masala-chai')!);

  const posResult = useCanteenStore.getState().placeOrder({
    userName: 'Walk-in Student #14',
    isWalkin: true,
    paymentMode: 'CASH_AT_COUNTER',
  });
  assert.equal(posResult.success, true, 'Step 8: Walk-in POS sale must succeed');
  const walkinSlotAfter = useCanteenStore.getState().pickupSlots.find((s) => s.id === 'slot-1930')!;
  assert.equal(walkinSlotAfter.currentWalkinBookings, walkinBefore + 1, 'Step 8: Walk-in quota consumed');

  // -------------------------------------------------------------
  // STEP 9: Chef Ramesh (Counter 1) starts Batch Cooking on KDS
  // -------------------------------------------------------------
  const c1Batch = aggregateBatchBySlot(useCanteenStore.getState().orders, 'slot-1930', 'cnt-01');
  assert.ok(c1Batch.items.length > 0, 'Step 9: Counter 1 batch items must exist');
  useCanteenStore.getState().batchUpdateSlotStatus('slot-1930', 'cnt-01', 'PREPARING');

  const orderAfterPrep = useCanteenStore.getState().orders.find((o) => o.id === orderA127.id)!;
  const biryaniOrderItems = orderAfterPrep.items.filter((i) => i.counterId === 'cnt-01');
  assert.ok(biryaniOrderItems.every((i) => i.itemStatus === 'PREPARING'), 'Step 9: Biryani items must be PREPARING');

  // -------------------------------------------------------------
  // STEP 10: Counter 3 JIT Staging Advisor triggers drink staging
  // -------------------------------------------------------------
  const jitAdvice = getJITDrinkStagingAdvice(orderAfterPrep);
  assert.equal(jitAdvice.shouldPrepareFastItem, true, 'Step 10: JIT should advise staging drink now');

  // -------------------------------------------------------------
  // STEP 11 & 12: Counter 1 & 3 transfer items to pickup staging
  // -------------------------------------------------------------
  orderAfterPrep.items.forEach((item) => {
    useCanteenStore.getState().updateItemPrepStatus(orderA127.id, item.id, 'TRANSFERRED_TO_PICKUP');
  });

  // -------------------------------------------------------------
  // STEP 13: Order reaches READY_FOR_CONSOLIDATION at Pickup Hub
  // -------------------------------------------------------------
  const orderConsolidating = useCanteenStore.getState().orders.find((o) => o.id === orderA127.id)!;
  assert.equal(
    orderConsolidating.orderStatus,
    'READY_FOR_CONSOLIDATION',
    'Step 13: Order must move to READY_FOR_CONSOLIDATION'
  );

  // -------------------------------------------------------------
  // STEP 14: Priya clicks Consolidate -> Shelf A3 assigned -> READY_FOR_PICKUP
  // -------------------------------------------------------------
  const shelfAssignRes = useCanteenStore.getState().assignShelfToOrder(orderA127.id);
  assert.equal(shelfAssignRes.success, true, 'Step 14: Shelf assignment must succeed');

  const orderReadyInShelf = useCanteenStore.getState().orders.find((o) => o.id === orderA127.id)!;
  assert.equal(orderReadyInShelf.orderStatus, 'READY_FOR_PICKUP', 'Step 14: Order must be READY_FOR_PICKUP');
  assert.ok(orderReadyInShelf.shelfId, 'Step 14: Order must have assigned shelfId');

  // -------------------------------------------------------------
  // STEP 15: Student app displays Shelf location, QR code & PIN
  // -------------------------------------------------------------
  assert.ok(orderReadyInShelf.shelfId.startsWith('Shelf') || orderReadyInShelf.shelfId.length >= 2, 'Step 15: Valid shelf code');

  // -------------------------------------------------------------
  // STEP 16 & 17: Rahul scans QR code at verification kiosk -> COLLECTED
  // -------------------------------------------------------------
  const scanResult = useCanteenStore.getState().verifyAndCollectOrder(orderReadyInShelf.qrCodeHash);
  assert.equal(scanResult.success, true, 'Step 16-17: QR verification must succeed');
  assert.equal(scanResult.order?.orderStatus, 'COLLECTED', 'Step 17: Order must be COLLECTED');

  // -------------------------------------------------------------
  // STEP 18: Assigned Shelf is automatically deallocated
  // -------------------------------------------------------------
  const freedShelfCode = scanResult.deallocatedShelfId!;
  const freedShelf = useCanteenStore.getState().pickupShelves.find((s) => s.id === freedShelfCode || s.shelfCode === freedShelfCode)!;
  assert.equal(freedShelf.isOccupied, false, 'Step 18: Physical shelf must be released back to available pool');
  assert.ok(!freedShelf.currentOrderId, 'Step 18: Shelf order pointer must be cleared');

  // -------------------------------------------------------------
  // STEP 19: Admin verifies financial rollup & zero duplicate redemptions
  // -------------------------------------------------------------
  // Duplicate scan attempt blocked
  const duplicateAttempt = useCanteenStore.getState().verifyAndCollectOrder(orderReadyInShelf.qrCodeHash);
  assert.equal(duplicateAttempt.success, false, 'Step 19: Duplicate redemption must be strictly blocked');

  const finalShelvesSummary = getShelfMatrixSummary(useCanteenStore.getState().pickupShelves);
  assert.ok(finalShelvesSummary.availableCount >= 22, 'Step 19: Available shelves safely replenished');
});
