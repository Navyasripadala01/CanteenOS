/**
 * CanteenOS — Central State Store (Zustand)
 * Provides synchronized in-memory state with cross-tab BroadcastChannel,
 * atomic commit-on-placement, 24-shelf manager, and demo persona switching.
 */

import { create } from 'zustand';
import {
  MenuItem,
  PickupSlot,
  PickupShelf,
  Order,
  OrderItem,
  DemoPersona,
  SlotItemCapacity,
  ExceptionLog,
  ItemPrepStatus,
  OrderStatus,
} from '@/types';
import {
  SEED_MENU_ITEMS,
  SEED_PICKUP_SLOTS,
  SEED_SLOT_ITEM_CAPACITIES,
  SEED_PICKUP_SHELVES,
  SEED_INITIAL_ORDERS,
  DEMO_PERSONAS,
  SEED_CANTEEN,
} from '@/data/seedData';
import { allocateNextAvailableShelf, releaseShelfByOrderId } from '@/lib/shelfEngine';
import { validateOrderCapacity } from '@/lib/capacityEngine';
import { evaluateStudentCancellation, evaluateCanteenCancellation } from '@/lib/cancellationEngine';
import { verifyPickupToken, createExceptionLog } from '@/lib/exceptionHandler';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  friendName?: string;
}

export interface VerificationResult {
  success: boolean;
  order?: Order;
  deallocatedShelfId?: string | null;
  usedPinFallback?: boolean;
  errorMessage?: string;
}

interface CanteenState {
  // Active Persona & Demo Authentication
  activePersona: DemoPersona;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setActivePersona: (persona: DemoPersona) => void;
  loginWithCredentials: (identifier: string, pin: string) => { success: boolean; errorMessage?: string; persona?: DemoPersona };
  loginAsPersona: (personaId: string) => boolean;
  logout: () => void;
  hydrateAuth: () => void;

  // Domain Entities
  menuItems: MenuItem[];
  pickupSlots: PickupSlot[];
  slotItemCapacities: SlotItemCapacity[];
  pickupShelves: PickupShelf[];
  orders: Order[];
  exceptionLogs: ExceptionLog[];

  // Student Cart
  cart: CartItem[];
  selectedSlotId: string | null;
  addToCart: (menuItem: MenuItem, friendName?: string) => void;
  removeFromCart: (menuItemId: string, friendName?: string) => void;
  updateCartQuantity: (menuItemId: string, quantity: number, friendName?: string) => void;
  setSelectedSlotId: (slotId: string | null) => void;
  clearCart: () => void;

  // Order Placement (Commit-on-placement)
  placeOrder: (params: {
    userName: string;
    isWalkin: boolean;
    paymentMode: 'UPI' | 'CARD' | 'CASH_AT_COUNTER';
  }) => { success: boolean; order?: Order; errorMessage?: string };

  // Kitchen Status Transitions
  updateItemPrepStatus: (orderId: string, itemId: string, newStatus: ItemPrepStatus) => void;
  batchUpdateSlotStatus: (slotId: string, counterId: string, newStatus: ItemPrepStatus) => void;

  // Pickup Coordination & Shelf Assignment
  assignShelfToOrder: (orderId: string, manualShelfId?: string) => { success: boolean; shelfId?: string; shelfCode?: string; errorMessage?: string };
  consolidateAndAssignShelf: (orderId: string, manualShelfId?: string) => { success: boolean; shelfId?: string; shelfCode?: string; errorMessage?: string };
  verifyAndCollectOrder: (tokenOrPin: string, optionalToken?: string) => VerificationResult;

  // Exception Handling
  flagOrderDelay: (orderId: string, additionalMinutes: number) => void;
  flagMissingItem: (orderId: string, itemId: string, message: string) => void;
  recordException: (exceptionType: any, description: string, orderId?: string) => void;
  cancelOrderAsStudent: (orderId: string) => { success: boolean; refundAmount?: number; errorMessage?: string };
  cancelOrderAsCanteen: (orderId: string, reason: string) => { success: boolean; refundAmount?: number; errorMessage?: string };
  toggleItemSoldOut: (itemId: string) => void;

  // Reset Demo State
  resetToSeedData: () => void;
}

// Demo Session Storage
const SESSION_STORAGE_KEY = 'canteenos_demo_session';

function getStoredSession(): { isAuthenticated: boolean; personaId: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session: { isAuthenticated: boolean; personaId: string } | null) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {}
}

// Broadcast Channel for live cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('canteenos_state_sync');
}

export const useCanteenStore = create<CanteenState>((set, get) => {
  // Listen for cross-tab state broadcasts
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE') {
        const { menuItems, pickupSlots, pickupShelves, orders, exceptionLogs, activePersona, isAuthenticated } = event.data.payload;
        set((prev) => ({
          menuItems,
          pickupSlots,
          pickupShelves,
          orders,
          exceptionLogs,
          activePersona: activePersona || prev.activePersona,
          isAuthenticated: isAuthenticated !== undefined ? isAuthenticated : prev.isAuthenticated,
        }));
      }
    };
  }

  const broadcastCurrentState = () => {
    if (broadcastChannel) {
      const state = get();
      broadcastChannel.postMessage({
        type: 'SYNC_STATE',
        payload: {
          menuItems: state.menuItems,
          pickupSlots: state.pickupSlots,
          pickupShelves: state.pickupShelves,
          orders: state.orders,
          exceptionLogs: state.exceptionLogs,
          activePersona: state.activePersona,
          isAuthenticated: state.isAuthenticated,
        },
      });
    }
  };

  const assignShelfInternal = (orderId: string, manualShelfId?: string) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, errorMessage: 'Order not found.' };

    let targetShelfId = manualShelfId;
    let targetShelfCode: string | null = null;

    if (!targetShelfId) {
      const { updatedShelves, result } = allocateNextAvailableShelf(state.pickupShelves, orderId);
      if (!result.success) {
        return { success: false, errorMessage: result.errorMessage };
      }
      targetShelfId = result.assignedShelfId!;
      targetShelfCode = result.shelfCode!;
      set({ pickupShelves: updatedShelves });
    } else {
      const matched = state.pickupShelves.find((s) => s.id === targetShelfId || s.shelfCode === targetShelfId);
      targetShelfCode = matched ? matched.shelfCode : targetShelfId;
      targetShelfId = matched ? matched.id : targetShelfId;

      const updatedShelves = state.pickupShelves.map((s) => {
        if (s.id === targetShelfId) {
          return { ...s, isOccupied: true, currentOrderId: orderId, assignedAt: new Date().toISOString() };
        }
        return s;
      });
      set({ pickupShelves: updatedShelves });
    }

    const updatedOrders = state.orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          shelfId: targetShelfCode || targetShelfId,
          orderStatus: 'READY_FOR_PICKUP' as OrderStatus,
          readyAt: new Date().toISOString(),
        };
      }
      return o;
    });

    set({ orders: updatedOrders });
    broadcastCurrentState();
    return { success: true, shelfId: targetShelfId, shelfCode: targetShelfCode || targetShelfId };
  };

  return {
    activePersona: DEMO_PERSONAS[0],
    isAuthenticated: false,
    isHydrated: false,
    menuItems: JSON.parse(JSON.stringify(SEED_MENU_ITEMS)),
    pickupSlots: JSON.parse(JSON.stringify(SEED_PICKUP_SLOTS)),
    slotItemCapacities: JSON.parse(JSON.stringify(SEED_SLOT_ITEM_CAPACITIES)),
    pickupShelves: JSON.parse(JSON.stringify(SEED_PICKUP_SHELVES)),
    orders: JSON.parse(JSON.stringify(SEED_INITIAL_ORDERS)),
    exceptionLogs: [],

    cart: [],
    selectedSlotId: 'slot-1930', // Default to 7:30-7:40 PM recommended slot

    setActivePersona: (persona) => {
      saveStoredSession({ isAuthenticated: true, personaId: persona.id });
      set({ activePersona: persona, isAuthenticated: true, isHydrated: true });
      broadcastCurrentState();
    },

    loginWithCredentials: (identifier, pin) => {
      const trimmedId = identifier.trim().toLowerCase();
      const trimmedPin = pin.trim();

      const matched = DEMO_PERSONAS.find(
        (p) =>
          (p.email.toLowerCase() === trimmedId ||
            p.id.toLowerCase() === trimmedId ||
            p.name.toLowerCase().includes(trimmedId)) &&
          p.pin === trimmedPin
      );

      if (!matched) {
        return {
          success: false,
          errorMessage: 'Invalid demo identifier or 4-digit PIN. Please use the predefined demo credentials.',
        };
      }

      saveStoredSession({ isAuthenticated: true, personaId: matched.id });
      set({ isAuthenticated: true, activePersona: matched, isHydrated: true });
      broadcastCurrentState();
      return { success: true, persona: matched };
    },

    loginAsPersona: (personaId) => {
      const matched = DEMO_PERSONAS.find((p) => p.id === personaId);
      if (!matched) return false;
      saveStoredSession({ isAuthenticated: true, personaId: matched.id });
      set({ isAuthenticated: true, activePersona: matched, isHydrated: true });
      broadcastCurrentState();
      return true;
    },

    logout: () => {
      saveStoredSession(null);
      set({ isAuthenticated: false, isHydrated: true });
      broadcastCurrentState();
    },

    hydrateAuth: () => {
      const stored = getStoredSession();
      if (stored && stored.isAuthenticated) {
        const persona = DEMO_PERSONAS.find((p) => p.id === stored.personaId);
        if (persona) {
          set({ isAuthenticated: true, activePersona: persona, isHydrated: true });
          return;
        }
      }
      set({ isHydrated: true });
    },

    addToCart: (menuItem, friendName) => {
      set((state) => {
        const existingIndex = state.cart.findIndex(
          (c) => c.menuItem.id === menuItem.id && c.friendName === friendName
        );
        if (existingIndex > -1) {
          const updated = [...state.cart];
          updated[existingIndex].quantity += 1;
          return { cart: updated };
        }
        return { cart: [...state.cart, { menuItem, quantity: 1, friendName }] };
      });
    },

    removeFromCart: (menuItemId, friendName) => {
      set((state) => ({
        cart: state.cart.filter(
          (c) => !(c.menuItem.id === menuItemId && c.friendName === friendName)
        ),
      }));
    },

    updateCartQuantity: (menuItemId, quantity, friendName) => {
      set((state) => {
        if (quantity <= 0) {
          return {
            cart: state.cart.filter(
              (c) => !(c.menuItem.id === menuItemId && c.friendName === friendName)
            ),
          };
        }
        return {
          cart: state.cart.map((c) =>
            c.menuItem.id === menuItemId && c.friendName === friendName
              ? { ...c, quantity }
              : c
          ),
        };
      });
    },

    setSelectedSlotId: (slotId) => set({ selectedSlotId: slotId }),

    clearCart: () => set({ cart: [] }),

    placeOrder: ({ userName, isWalkin, paymentMode }) => {
      const state = get();
      if (state.cart.length === 0) {
        return { success: false, errorMessage: 'Cart is empty.' };
      }

      const slot = state.pickupSlots.find((s) => s.id === state.selectedSlotId);
      if (!slot) {
        return { success: false, errorMessage: 'Please select a valid pickup slot.' };
      }

      // 1. Capacity & Inventory Validation
      const validation = validateOrderCapacity(
        slot,
        isWalkin,
        state.cart,
        state.slotItemCapacities
      );
      if (!validation.allowed) {
        return { success: false, errorMessage: validation.reason };
      }

      // 2. Generate New Order ID and Token
      const orderId = `ord-${Date.now()}`;
      const tokenNumber = `A${120 + state.orders.length + 1}`; // e.g. A127
      const pickupPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
      const qrCodeHash = `canteen-os:qr:${orderId}:${pickupPin}`;

      let totalAmount = 0;
      const orderItems: OrderItem[] = state.cart.map((c, index) => {
        const itemTotal = c.menuItem.price * c.quantity;
        totalAmount += itemTotal;
        return {
          id: `oi-${orderId}-${index + 1}`,
          orderId,
          menuItemId: c.menuItem.id,
          counterId: c.menuItem.counterId,
          itemName: c.menuItem.name,
          unitPrice: c.menuItem.price,
          quantity: c.quantity,
          friendName: c.friendName,
          itemStatus: 'QUEUED',
          isFastItem: c.menuItem.isFastItem,
        };
      });

      const newOrder: Order = {
        id: orderId,
        tokenNumber,
        collegeId: 'col-campus-01',
        canteenId: 'can-main-01',
        userId: state.activePersona.id,
        userName: userName || state.activePersona.name,
        isWalkinOrder: isWalkin,
        pickupSlotId: slot.id,
        slotDisplayLabel: slot.displayLabel,
        totalAmount,
        paymentMode,
        paymentStatus: 'COMPLETED',
        orderStatus: 'PLACED',
        shelfId: null,
        pickupPin,
        qrCodeHash,
        items: orderItems,
        createdAt: new Date().toISOString(),
      };

      // 3. Atomically Commit Inventory and Increment Slot Bookings
      const updatedMenuItems = state.menuItems.map((m) => {
        const cartEntry = state.cart.find((c) => c.menuItem.id === m.id);
        if (cartEntry) {
          const newCommitted = m.committedQty + cartEntry.quantity;
          return {
            ...m,
            committedQty: newCommitted,
            isSoldOut: newCommitted >= m.dailyPreparedQty,
          };
        }
        return m;
      });

      const updatedSlots = state.pickupSlots.map((s) => {
        if (s.id === slot.id) {
          return {
            ...s,
            currentOnlineBookings: isWalkin ? s.currentOnlineBookings : s.currentOnlineBookings + 1,
            currentWalkinBookings: isWalkin ? s.currentWalkinBookings + 1 : s.currentWalkinBookings,
          };
        }
        return s;
      });

      set({
        orders: [newOrder, ...state.orders],
        menuItems: updatedMenuItems,
        pickupSlots: updatedSlots,
        cart: [],
      });

      broadcastCurrentState();
      return { success: true, order: newOrder };
    },

    updateItemPrepStatus: (orderId, itemId, newStatus) => {
      set((state) => {
        const updatedOrders = state.orders.map((o) => {
          if (o.id !== orderId) return o;

          const updatedItems = o.items.map((i) => {
            if (i.id === itemId) {
              return {
                ...i,
                itemStatus: newStatus,
                preparedAt: newStatus === 'READY_AT_COUNTER' ? new Date().toISOString() : i.preparedAt,
                transferredAt: newStatus === 'TRANSFERRED_TO_PICKUP' ? new Date().toISOString() : i.transferredAt,
              };
            }
            return i;
          });

          // Check if all items are now at pickup zone
          const allTransferred = updatedItems.every(
            (i) => i.itemStatus === 'TRANSFERRED_TO_PICKUP' || i.itemStatus === 'READY_AT_COUNTER'
          );
          const anyPreparing = updatedItems.some((i) => i.itemStatus === 'PREPARING');

          let newOrderStatus: OrderStatus = o.orderStatus;
          if (allTransferred && o.orderStatus !== 'READY_FOR_PICKUP' && o.orderStatus !== 'COLLECTED') {
            newOrderStatus = 'READY_FOR_CONSOLIDATION';
          } else if (anyPreparing && o.orderStatus === 'PLACED') {
            newOrderStatus = 'PREPARING';
          }

          return {
            ...o,
            items: updatedItems,
            orderStatus: newOrderStatus,
          };
        });

        return { orders: updatedOrders };
      });
      broadcastCurrentState();
    },

    batchUpdateSlotStatus: (slotId, counterId, newStatus) => {
      set((state) => {
        const updatedOrders = state.orders.map((o) => {
          if (o.pickupSlotId !== slotId) return o;

          const updatedItems = o.items.map((i) => {
            if (i.counterId === counterId) {
              return {
                ...i,
                itemStatus: newStatus,
                preparedAt: newStatus === 'READY_AT_COUNTER' ? new Date().toISOString() : i.preparedAt,
                transferredAt: newStatus === 'TRANSFERRED_TO_PICKUP' ? new Date().toISOString() : i.transferredAt,
              };
            }
            return i;
          });

          const allTransferred = updatedItems.every(
            (i) => i.itemStatus === 'TRANSFERRED_TO_PICKUP' || i.itemStatus === 'READY_AT_COUNTER'
          );

          return {
            ...o,
            items: updatedItems,
            orderStatus: allTransferred && o.orderStatus !== 'COLLECTED' ? 'READY_FOR_CONSOLIDATION' : o.orderStatus,
          };
        });

        return { orders: updatedOrders };
      });
      broadcastCurrentState();
    },

    assignShelfToOrder: (orderId, manualShelfId) => assignShelfInternal(orderId, manualShelfId),
    consolidateAndAssignShelf: (orderId, manualShelfId) => assignShelfInternal(orderId, manualShelfId),

    verifyAndCollectOrder: (firstArg, secondArg) => {
      const state = get();
      let order: Order | undefined;
      let tokenOrPin = firstArg;

      if (secondArg) {
        order = state.orders.find((o) => o.id === firstArg);
        tokenOrPin = secondArg;
      } else {
        order = state.orders.find(
          (o) =>
            o.qrCodeHash === tokenOrPin ||
            o.pickupPin === tokenOrPin ||
            o.tokenNumber === tokenOrPin ||
            o.id === tokenOrPin
        );
      }

      if (!order) {
        return { success: false, errorMessage: 'No active order matching this pickup code.' };
      }

      if (order.orderStatus === 'COLLECTED') {
        return {
          success: false,
          errorMessage: `Duplicate redemption blocked — Order #${order.tokenNumber} was already collected.`,
        };
      }

      const verification = verifyPickupToken(order, tokenOrPin);
      if (!verification.valid) {
        return { success: false, errorMessage: verification.errorMessage };
      }

      const allocatedShelf = state.pickupShelves.find((s) => s.currentOrderId === order!.id);
      const shelfToDeallocate = allocatedShelf?.shelfCode || order.shelfId || null;

      const { updatedShelves } = releaseShelfByOrderId(state.pickupShelves, order.id);

      const updatedOrders = state.orders.map((o) => {
        if (o.id === order!.id) {
          return {
            ...o,
            orderStatus: 'COLLECTED' as OrderStatus,
            collectedAt: new Date().toISOString(),
          };
        }
        return o;
      });

      const finalCollectedOrder = updatedOrders.find((o) => o.id === order!.id);

      set({
        orders: updatedOrders,
        pickupShelves: updatedShelves,
      });

      broadcastCurrentState();
      return {
        success: true,
        order: finalCollectedOrder,
        deallocatedShelfId: shelfToDeallocate,
        usedPinFallback: verification.usedPinFallback,
      };
    },

    flagOrderDelay: (orderId, additionalMinutes) => {
      set((state) => {
        const updatedOrders = state.orders.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              isDelayed: true,
              delayMinutes: (o.delayMinutes || 0) + additionalMinutes,
            };
          }
          return o;
        });
        return {
          orders: updatedOrders,
          exceptionLogs: [
            ...state.exceptionLogs,
            createExceptionLog(orderId, 'DELAYED_FOOD_ITEM', `Kitchen added +${additionalMinutes} min prep delay.`),
          ],
        };
      });
      broadcastCurrentState();
    },

    flagMissingItem: (orderId, itemId, message) => {
      set((state) => ({
        exceptionLogs: [
          ...state.exceptionLogs,
          createExceptionLog(orderId, 'MISSING_ITEM', `Item ${itemId}: ${message}`),
        ],
      }));
      broadcastCurrentState();
    },

    recordException: (exceptionType, description, orderId) => {
      set((state) => ({
        exceptionLogs: [
          ...state.exceptionLogs,
          createExceptionLog(orderId || 'system', exceptionType, description),
        ],
      }));
      broadcastCurrentState();
    },

    cancelOrderAsStudent: (orderId) => {
      const state = get();
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return { success: false, errorMessage: 'Order not found.' };

      const evalResult = evaluateStudentCancellation(order, SEED_CANTEEN.cancellationRules);
      if (!evalResult.canCancel) {
        return { success: false, errorMessage: evalResult.reason };
      }

      const updatedMenuItems = state.menuItems.map((m) => {
        const orderItem = order.items.find((i) => i.menuItemId === m.id);
        if (orderItem) {
          return {
            ...m,
            committedQty: Math.max(0, m.committedQty - orderItem.quantity),
            isSoldOut: false,
          };
        }
        return m;
      });

      const { updatedShelves } = releaseShelfByOrderId(state.pickupShelves, orderId);

      const updatedOrders = state.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: evalResult.targetStatus,
            refundAmount: evalResult.refundAmount,
            cancellationReason: 'Cancelled by student before preparation.',
          };
        }
        return o;
      });

      set({
        orders: updatedOrders,
        menuItems: updatedMenuItems,
        pickupShelves: updatedShelves,
      });

      broadcastCurrentState();
      return { success: true, refundAmount: evalResult.refundAmount };
    },

    cancelOrderAsCanteen: (orderId, reason) => {
      const state = get();
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return { success: false, errorMessage: 'Order not found.' };

      const evalResult = evaluateCanteenCancellation(order, SEED_CANTEEN.cancellationRules, reason);
      if (!evalResult.canCancel) {
        return { success: false, errorMessage: evalResult.reason };
      }

      const { updatedShelves } = releaseShelfByOrderId(state.pickupShelves, orderId);

      const updatedOrders = state.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: evalResult.targetStatus,
            refundAmount: evalResult.refundAmount,
            cancellationReason: reason,
          };
        }
        return o;
      });

      set({
        orders: updatedOrders,
        pickupShelves: updatedShelves,
      });

      broadcastCurrentState();
      return { success: true, refundAmount: evalResult.refundAmount };
    },

    toggleItemSoldOut: (itemId) => {
      set((state) => {
        const updatedMenuItems = state.menuItems.map((m) => {
          if (m.id === itemId) {
            const nextSoldOut = !m.isSoldOut;
            return {
              ...m,
              isSoldOut: nextSoldOut,
              committedQty: nextSoldOut ? m.dailyPreparedQty : m.committedQty,
            };
          }
          return m;
        });
        return { menuItems: updatedMenuItems };
      });
      broadcastCurrentState();
    },

    resetToSeedData: () => {
      saveStoredSession(null);
      set({
        menuItems: JSON.parse(JSON.stringify(SEED_MENU_ITEMS)),
        pickupSlots: JSON.parse(JSON.stringify(SEED_PICKUP_SLOTS)),
        slotItemCapacities: JSON.parse(JSON.stringify(SEED_SLOT_ITEM_CAPACITIES)),
        pickupShelves: JSON.parse(JSON.stringify(SEED_PICKUP_SHELVES)),
        orders: JSON.parse(JSON.stringify(SEED_INITIAL_ORDERS)),
        exceptionLogs: [],
        cart: [],
        selectedSlotId: 'slot-1930',
        isAuthenticated: false,
        activePersona: DEMO_PERSONAS[0],
        isHydrated: true,
      });
      broadcastCurrentState();
    },
  };
});
