/**
 * CanteenOS — Multi-Counter Routing & Kitchen Batch Engine
 * Dispatches order line items to Counter 1, 2, or 3, coordinates JIT fast/slow items,
 * and aggregates batch cooking requirements for kitchen stations.
 */

import type { Order, OrderItem, ItemPrepStatus } from '@/types';

export interface CounterQueueSummary {
  counterId: string;
  counterName: string;
  queuedItemsCount: number;
  preparingItemsCount: number;
  readyItemsCount: number;
  activeOrdersCount: number;
}

export interface KitchenBatchItemSummary {
  menuItemId: string;
  itemName: string;
  counterId: string;
  totalQuantityNeeded: number;
  orderTokens: string[];
  allReady: boolean;
}

export interface KitchenSlotBatch {
  slotId: string;
  slotDisplayLabel: string;
  totalOrders: number;
  items: KitchenBatchItemSummary[];
}

export function aggregateBatchBySlot(
  orders: Order[],
  slotId: string,
  counterFilter?: string
): KitchenSlotBatch {
  const slotOrders = orders.filter(
    (o) => o.pickupSlotId === slotId && !['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(o.orderStatus)
  );

  const itemMap = new Map<string, KitchenBatchItemSummary>();

  for (const order of slotOrders) {
    for (const item of order.items) {
      if (counterFilter && item.counterId !== counterFilter) {
        continue;
      }

      if (!itemMap.has(item.menuItemId)) {
        itemMap.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          counterId: item.counterId,
          totalQuantityNeeded: 0,
          orderTokens: [],
          allReady: true,
        });
      }

      const entry = itemMap.get(item.menuItemId)!;
      entry.totalQuantityNeeded += item.quantity;
      if (!entry.orderTokens.includes(order.tokenNumber)) {
        entry.orderTokens.push(order.tokenNumber);
      }
      if (item.itemStatus !== 'READY_AT_COUNTER' && item.itemStatus !== 'TRANSFERRED_TO_PICKUP') {
        entry.allReady = false;
      }
    }
  }

  const firstOrder = slotOrders[0];
  const slotDisplayLabel = firstOrder?.slotDisplayLabel || 'Upcoming Slot';

  return {
    slotId,
    slotDisplayLabel,
    totalOrders: slotOrders.length,
    items: Array.from(itemMap.values()),
  };
}

export function checkOrderReadyForConsolidation(order: Order): boolean {
  if (order.items.length === 0) return false;
  return order.items.every(
    (item) => item.itemStatus === 'TRANSFERRED_TO_PICKUP' || item.itemStatus === 'READY_AT_COUNTER'
  );
}

export function getJITDrinkStagingAdvice(order: Order): {
  shouldPrepareFastItem: boolean;
  message: string;
} {
  const hotItems = order.items.filter((i) => !i.isFastItem);
  const fastItems = order.items.filter((i) => i.isFastItem);

  if (fastItems.length === 0) {
    return { shouldPrepareFastItem: false, message: 'No fast items in this order.' };
  }

  if (hotItems.length === 0) {
    return { shouldPrepareFastItem: true, message: 'Fast-only order: pull and stage immediately.' };
  }

  const anyHotItemPreparingOrReady = hotItems.some(
    (i) => i.itemStatus === 'PREPARING' || i.itemStatus === 'READY_AT_COUNTER' || i.itemStatus === 'TRANSFERRED_TO_PICKUP'
  );

  if (anyHotItemPreparingOrReady) {
    return {
      shouldPrepareFastItem: true,
      message: 'Hot dish is preparing/ready! Stage beverage now so it stays cold.',
    };
  }

  return {
    shouldPrepareFastItem: false,
    message: 'Hot dish is still queued. Hold beverage preparation to preserve quality.',
  };
}
