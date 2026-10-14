/**
 * CanteenOS — Operational Exception Coordinator
 * Handles edge cases, missing items, prep delays, QR scan fallback,
 * and status transition rollbacks to prevent lost orders.
 */

import type { Order, ExceptionLog } from '@/types';

export function verifyPickupToken(
  order: Order,
  inputToken: string
): { valid: boolean; usedPinFallback: boolean; errorMessage?: string } {
  const trimmed = inputToken.trim();

  if (order.orderStatus !== 'READY_FOR_PICKUP') {
    return {
      valid: false,
      usedPinFallback: false,
      errorMessage: `Order #${order.tokenNumber} is not ready for pickup (Current status: ${order.orderStatus}).`,
    };
  }

  // 1. Direct 4-digit PIN fallback match
  if (order.pickupPin === trimmed) {
    return { valid: true, usedPinFallback: true };
  }

  // 2. Exact QR Hash or QR URI scanner match
  if (
    order.qrCodeHash === trimmed ||
    (trimmed.startsWith('canteen-os:qr:') && (trimmed.includes(order.id) || trimmed.includes(order.pickupPin)))
  ) {
    return { valid: true, usedPinFallback: false };
  }

  return {
    valid: false,
    usedPinFallback: false,
    errorMessage: `Invalid pickup code for Order #${order.tokenNumber}. Please verify PIN or re-scan.`,
  };
}

export function createExceptionLog(
  orderId: string,
  type: ExceptionLog['exceptionType'],
  message: string
): ExceptionLog {
  return {
    id: `exc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    orderId,
    exceptionType: type,
    message,
    description: message,
    timestamp: new Date().toISOString(),
    resolved: false,
  };
}
