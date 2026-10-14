/**
 * CanteenOS — Differential Cancellation & Refund Engine
 * Handles student cancellations vs canteen cancellations, enforces policy cutoffs,
 * calculates refund amounts, and manages inventory rollback.
 */

import type { Order, CancellationRules, OrderStatus } from '@/types';

export interface CancellationEvaluation {
  canCancel: boolean;
  reason?: string;
  refundAmount: number;
  refundPercentage: number;
  targetStatus: OrderStatus;
}

export function evaluateStudentCancellation(
  order: Order,
  rules: CancellationRules
): CancellationEvaluation {
  if (['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(order.orderStatus)) {
    return {
      canCancel: false,
      reason: `Order is already in terminal status: ${order.orderStatus}`,
      refundAmount: 0,
      refundPercentage: 0,
      targetStatus: order.orderStatus,
    };
  }

  if (order.orderStatus === 'READY_FOR_PICKUP' || order.orderStatus === 'READY_FOR_CONSOLIDATION') {
    return {
      canCancel: false,
      reason: 'Food is already prepared and at the pickup zone. Cancellation is no longer permitted.',
      refundAmount: 0,
      refundPercentage: 0,
      targetStatus: order.orderStatus,
    };
  }

  if (order.orderStatus === 'PREPARING' && !rules.allowStudentCancelDuringPrep) {
    return {
      canCancel: false,
      reason: 'Kitchen has already started batch preparation for your order. Non-refundable per canteen policy.',
      refundAmount: 0,
      refundPercentage: 0,
      targetStatus: order.orderStatus,
    };
  }

  const refundPercentage = rules.studentRefundPercentage ?? 100;
  const refundAmount = Number(((order.totalAmount * refundPercentage) / 100).toFixed(2));

  return {
    canCancel: true,
    refundAmount,
    refundPercentage,
    targetStatus: 'CANCELLED_BY_STUDENT',
  };
}

export function evaluateCanteenCancellation(
  order: Order,
  rules: CancellationRules,
  cancellationReason: string
): CancellationEvaluation {
  if (['COLLECTED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_CANTEEN'].includes(order.orderStatus)) {
    return {
      canCancel: false,
      reason: `Cannot cancel an order that is already ${order.orderStatus}`,
      refundAmount: 0,
      refundPercentage: 0,
      targetStatus: order.orderStatus,
    };
  }

  const refundPercentage = rules.canteenRefundPercentage ?? 100;
  const refundAmount = order.totalAmount;

  return {
    canCancel: true,
    reason: cancellationReason || 'Canteen operational cancellation',
    refundAmount,
    refundPercentage,
    targetStatus: 'CANCELLED_BY_CANTEEN',
  };
}
