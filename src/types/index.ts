/**
 * CanteenOS — Shared Domain Types & State Models
 * High-performance campus canteen operating system data contracts.
 */

export type Role = 'STUDENT' | 'VISITOR' | 'KITCHEN_STAFF' | 'PICKUP_COORDINATOR' | 'COLLEGE_ADMIN';

export type DietaryType = 'VEG' | 'NON_VEG' | 'EGG';

export type MealPeriod = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';

export type PaymentMode = 'UPI' | 'CARD' | 'CASH_AT_COUNTER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type OrderStatus =
  | 'PLACED'
  | 'PREPARING'
  | 'READY_FOR_CONSOLIDATION'
  | 'READY_FOR_PICKUP'
  | 'COLLECTED'
  | 'CANCELLED_BY_STUDENT'
  | 'CANCELLED_BY_CANTEEN';

export type ItemPrepStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'READY_AT_COUNTER'
  | 'TRANSFERRED_TO_PICKUP';

export type RushLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface College {
  id: string;
  name: string;
  code: string; // e.g. "NIT-BLR"
  campusCity?: string;
  city?: string;
  state?: string;
}

export interface Canteen {
  id: string;
  collegeId: string;
  name: string;
  code?: string;
  currency?: string;
  operatingHours?: string;
  isRushModeActive?: boolean;
  defaultOnlineCapacityPercent?: number;
  defaultWalkinCapacityPercent?: number;
  cancellationRules: CancellationPolicy;
}

export interface CancellationPolicy {
  studentCutoffStatus?: OrderStatus;
  studentCutoffMinutes?: number;
  allowStudentCancelDuringPrep?: boolean;
  studentRefundRateBeforePrep?: number;
  studentRefundRateAfterPrep?: number;
  studentRefundPercentage?: number;
  canteenRefundPercentage?: number;
  canteenCancellationRefundRate?: number;
}

export type CancellationRules = CancellationPolicy;

export interface Counter {
  id: string;
  canteenId: string;
  counterNumber: number; // 1, 2, 3
  name: string; // e.g. "Counter 1: Biryani & Fried Rice"
  staffName?: string;
  stationLead?: string;
  stationType?: 'HOT_WOK_DUM' | 'CONTINUOUS_ASSEMBLY' | 'FAST_SNACK_BAR';
  leadTimeMinutes?: number;
  isActive?: boolean;
}

export interface MenuItem {
  id: string;
  canteenId: string;
  counterId: string;
  name: string;
  description: string;
  price: number;
  category: 'biryani_rice' | 'meals_breads' | 'snacks_drinks';
  dietaryType: DietaryType;
  imageUrl?: string;
  prepLeadTimeMinutes: number;
  isFastItem: boolean; // Fast items like drinks held until hot items ready
  dailyPreparedQty: number; // Live prepared batch capacity
  committedQty: number; // Portions committed to placed orders
  isSoldOut: boolean;
}

export interface PickupSlot {
  id: string;
  canteenId: string;
  mealPeriod: MealPeriod;
  startTime: string; // e.g. "19:00"
  endTime: string; // e.g. "19:10"
  displayLabel: string; // e.g. "7:00 – 7:10 PM"
  totalCapacity: number; // Total slots available (e.g. 100)
  onlineCapacityQuota: number; // Online portion (e.g. 70)
  walkinCapacityQuota: number; // Counter 3 walk-in portion (e.g. 30)
  currentOnlineBookings: number;
  currentWalkinBookings: number;
  isActive: boolean;
}

export interface SlotItemCapacity {
  id: string;
  pickupSlotId: string;
  menuItemId: string;
  maxItemCapacity: number;
  currentItemCount: number;
}

export interface PickupShelf {
  id: string; // e.g. "Shelf A1"
  shelfCode: string; // "A1"
  zone: 'A' | 'B' | 'C' | 'D';
  isOccupied: boolean;
  currentOrderId: string | null;
  assignedAt: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  counterId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  friendName?: string; // Optional "Order for Friends" tag
  itemStatus: ItemPrepStatus;
  isFastItem: boolean;
  preparedAt?: string;
  transferredAt?: string;
}

export interface Order {
  id: string;
  tokenNumber: string; // Display token: "A127"
  collegeId: string;
  canteenId: string;
  userId: string;
  userName: string;
  isWalkinOrder: boolean;
  pickupSlotId: string;
  slotDisplayLabel: string;
  totalAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cancellationReason?: string;
  refundAmount?: number;
  shelfId: string | null; // e.g. "Shelf A3"
  pickupPin: string; // 4-digit numeric fallback PIN, e.g. "4829"
  qrCodeHash: string; // Unique cryptographic token for camera QR scanner
  items: OrderItem[];
  createdAt: string;
  readyAt?: string;
  collectedAt?: string;
  delayMinutes?: number; // Operational exception tracking
  isDelayed?: boolean;
}

export interface DemoPersona {
  id: string;
  name: string;
  role: Role;
  label: string;
  email: string;
  pin: string;
  counterId?: string; // If Kitchen staff (Counter 1, 2, or 3)
  avatar: string;
  description: string;
  visitorType?: 'ALUMNI_PASSED_OUT' | 'CAMPUS_GUEST';
  passoutYear?: number;
}

export interface ExceptionLog {
  id: string;
  orderId: string;
  exceptionType: 
    | 'DELAYED_FOOD_ITEM'
    | 'MISSING_ITEM'
    | 'PAYMENT_MISMATCH'
    | 'NETWORK_RECOVERY'
    | 'QR_SCAN_FAILURE_PIN_USED'
    | 'STATUS_ROLLBACK'
    | 'SHELF_OVERFLOW'
    | 'UNEXPECTED_STOCKOUT'
    | 'DUPLICATE_PICKUP_ATTEMPT'
    | 'STUDENT_CANCELLATION';
  message: string;
  description?: string;
  timestamp: string;
  resolved: boolean;
}
