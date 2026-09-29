import {
  Restaurant,
  MenuItem,
  MenuCategory,
  Rider,
  DeliveryZone,
  Order,
  Cart,
  CartItem,
  UserRole,
  WeeklySettlementStatement,
  OrderStatus,
  PaymentMethod,
  RiderType,
  PlatformSettings,
} from '../types';
import {
  INITIAL_RESTAURANTS,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_RIDERS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_ORDERS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_SETTLEMENTS,
  INITIAL_PLATFORM_SETTINGS,
} from '../data/initialData';
import { LedgerEngine } from './ledgerService';

const STORAGE_KEY_PREFIX = 'apna_food_';

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
  } catch {
    return false;
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (!isStorageAvailable()) return fallback;
    const item = window.localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    if (!isStorageAvailable()) return;
    window.localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch {
    // Silently fall back if storage quota exceeded or storage disabled in iframe
  }
}

export type Listener = () => void;

class AppStore {
  private listeners: Set<Listener> = new Set();

  public restaurants: Restaurant[];
  public categories: MenuCategory[];
  public menuItems: MenuItem[];
  public riders: Rider[];
  public deliveryZones: DeliveryZone[];
  public orders: Order[];
  public settlements: WeeklySettlementStatement[];
  public ledger: LedgerEngine;
  public platformSettings: PlatformSettings;

  // UI / session state
  public currentRole: UserRole = 'customer';
  public currentRestaurantId: string = 'rest-001';
  public currentRiderId: string = 'rider-001';
  public viewMode: 'desktop_web' | 'mobile_app' = 'desktop_web';
  public activeOrderIdForTracking: string | null = 'ord-1042';

  // Customer Cart (Enforces 1 restaurant rule strictly)
  public cart: Cart = {
    restaurantId: null,
    items: [],
  };

  // Cart conflict state
  public cartConflictModal: {
    isOpen: boolean;
    pendingItem?: MenuItem;
    pendingOptions?: any[];
    newRestaurantName?: string;
  } = { isOpen: false };

  constructor() {
    this.restaurants = loadFromStorage('restaurants', INITIAL_RESTAURANTS);
    this.categories = loadFromStorage('categories', INITIAL_CATEGORIES);
    this.menuItems = loadFromStorage('menu_items', INITIAL_MENU_ITEMS);
    this.riders = loadFromStorage('riders', INITIAL_RIDERS);
    this.deliveryZones = loadFromStorage('delivery_zones', INITIAL_DELIVERY_ZONES);
    this.orders = loadFromStorage('orders', INITIAL_ORDERS);
    this.settlements = loadFromStorage('settlements', INITIAL_SETTLEMENTS);
    this.platformSettings = loadFromStorage('platform_settings', INITIAL_PLATFORM_SETTINGS);

    const storedLedgerEntries = loadFromStorage('ledger_entries', INITIAL_LEDGER_ENTRIES);
    this.ledger = new LedgerEngine(storedLedgerEntries);
    this.cart = loadFromStorage('cart', { restaurantId: null, items: [] });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    saveToStorage('restaurants', this.restaurants);
    saveToStorage('categories', this.categories);
    saveToStorage('menu_items', this.menuItems);
    saveToStorage('riders', this.riders);
    saveToStorage('delivery_zones', this.deliveryZones);
    saveToStorage('orders', this.orders);
    saveToStorage('settlements', this.settlements);
    saveToStorage('ledger_entries', this.ledger.getAllEntries());
    saveToStorage('cart', this.cart);
    saveToStorage('platform_settings', this.platformSettings);

    this.listeners.forEach((l) => l());
  }

  public updatePlatformSettings(settings: Partial<PlatformSettings>): void {
    this.platformSettings = {
      ...this.platformSettings,
      ...settings,
    };
    this.notify();
  }

  // --- Super Admin Restaurant List Governance ---
  public toggleRestaurantListing(restaurantId: string): void {
    const rest = this.restaurants.find((r) => r.id === restaurantId);
    if (rest) {
      rest.isListedOnApp = !rest.isListedOnApp;
      this.notify();
    }
  }

  public addRestaurant(restaurantData: Omit<Restaurant, 'id'>): Restaurant {
    const newId = `rest-${Date.now().toString().slice(-4)}`;
    const newRestaurant: Restaurant = {
      id: newId,
      ...restaurantData,
      onboardingFeeAmount: this.platformSettings.restaurantOnboardingFee,
      onboardingFeePaid: this.platformSettings.restaurantOnboardingFee === 0,
      isListedOnApp: restaurantData.isListedOnApp ?? true,
    };
    this.restaurants.unshift(newRestaurant);
    this.notify();
    return newRestaurant;
  }

  public deleteRestaurant(restaurantId: string): void {
    this.restaurants = this.restaurants.filter((r) => r.id !== restaurantId);
    this.notify();
  }

  public updateRestaurant(restaurantId: string, updates: Partial<Restaurant>): void {
    const rest = this.restaurants.find((r) => r.id === restaurantId);
    if (rest) {
      Object.assign(rest, updates);
      this.notify();
    }
  }

  public setRole(role: UserRole): void {
    this.currentRole = role;
    this.notify();
  }

  public setViewMode(mode: 'desktop_web' | 'mobile_app'): void {
    this.viewMode = mode;
    this.notify();
  }

  public setCurrentRestaurantId(id: string): void {
    this.currentRestaurantId = id;
    this.notify();
  }

  public setCurrentRiderId(id: string): void {
    this.currentRiderId = id;
    this.notify();
  }

  public setActiveOrderForTracking(id: string | null): void {
    this.activeOrderIdForTracking = id;
    this.notify();
  }

  // --- Cart Operations with strict Single Restaurant Constraint ---
  public addToCart(item: MenuItem, selectedOptions: any[] = [], instructions?: string): boolean {
    // If cart has items from another restaurant, trigger conflict dialog
    if (this.cart.restaurantId && this.cart.restaurantId !== item.restaurantId && this.cart.items.length > 0) {
      const rest = this.restaurants.find((r) => r.id === item.restaurantId);
      this.cartConflictModal = {
        isOpen: true,
        pendingItem: item,
        pendingOptions: selectedOptions,
        newRestaurantName: rest?.name || 'Another Restaurant',
      };
      this.notify();
      return false; // Prevented
    }

    let calculatedPrice = item.price;
    selectedOptions.forEach((opt) => {
      calculatedPrice += opt.priceDelta || 0;
    });

    this.cart.restaurantId = item.restaurantId;
    const existingIndex = this.cart.items.findIndex(
      (ci) =>
        ci.menuItemId === item.id &&
        JSON.stringify(ci.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (existingIndex > -1) {
      this.cart.items[existingIndex].quantity += 1;
    } else {
      const newCartItem: CartItem = {
        id: `ci-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        price: calculatedPrice,
        quantity: 1,
        selectedOptions,
        specialInstructions: instructions,
        imageUrl: item.imageUrl,
      };
      this.cart.items.push(newCartItem);
    }

    this.notify();
    return true;
  }

  public resolveCartConflict(replace: boolean): void {
    if (replace && this.cartConflictModal.pendingItem) {
      const item = this.cartConflictModal.pendingItem;
      const opts = this.cartConflictModal.pendingOptions || [];
      this.cart = {
        restaurantId: item.restaurantId,
        items: [],
      };
      this.cartConflictModal = { isOpen: false };
      this.addToCart(item, opts);
    } else {
      this.cartConflictModal = { isOpen: false };
      this.notify();
    }
  }

  public updateCartQuantity(cartItemId: string, delta: number): void {
    const itemIndex = this.cart.items.findIndex((ci) => ci.id === cartItemId);
    if (itemIndex === -1) return;

    const newQty = this.cart.items[itemIndex].quantity + delta;
    if (newQty <= 0) {
      this.cart.items.splice(itemIndex, 1);
    } else {
      this.cart.items[itemIndex].quantity = newQty;
    }

    if (this.cart.items.length === 0) {
      this.cart.restaurantId = null;
    }

    this.notify();
  }

  public clearCart(): void {
    this.cart = {
      restaurantId: null,
      items: [],
    };
    this.notify();
  }

  // --- Order Placement ---
  public placeOrder(orderData: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryArea: string;
    customerNote?: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }): Order {
    if (!this.cart.restaurantId || this.cart.items.length === 0) {
      throw new Error('Cannot place order: cart is empty');
    }

    const restaurant = this.restaurants.find((r) => r.id === this.cart.restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const zone = this.deliveryZones.find((z) => z.isActive) || this.deliveryZones[0];
    const subtotal = this.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Apply coupon discounts
    let discountAmount = 0;
    if (orderData.couponCode?.trim().toUpperCase() === 'ALIPUR100' && subtotal >= 500) {
      discountAmount = 100;
    } else if (orderData.couponCode?.trim().toUpperCase() === 'PEHLIORDER') {
      discountAmount = 50;
    }

    const deliveryCharge = zone.customerDeliveryFee;
    const deliveryExpense = zone.platformDeliveryExpense;
    const deliveryFunding = zone.isPlatformFunded ? 'platform_funded' : 'customer_funded';
    const finalTotal = Math.max(0, subtotal + deliveryCharge - discountAmount);

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `APN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: 'cust-current',
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      deliveryArea: orderData.deliveryArea,
      deliveryCoordinates: { lat: 29.386, lng: 70.914 },
      customerNote: orderData.customerNote,

      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantPhone: restaurant.phone,
      restaurantAddress: restaurant.address,
      restaurantCoordinates: { lat: restaurant.lat, lng: restaurant.lng },

      items: this.cart.items.map((ci) => ({
        id: `oi-${Math.random()}`,
        menuItemId: ci.menuItemId,
        name: ci.name,
        quantity: ci.quantity,
        unitPrice: ci.price,
        totalPrice: ci.price * ci.quantity,
        selectedOptions: ci.selectedOptions,
        specialInstructions: ci.specialInstructions,
      })),

      subtotal,
      deliveryCharge,
      deliveryExpense,
      deliveryFunding,
      discountAmount,
      couponCode: orderData.couponCode,
      finalTotal,

      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : 'completed',
      paymentReference: orderData.paymentMethod !== 'cod' ? `TXN-${Math.floor(100000 + Math.random() * 900000)}` : undefined,

      status: 'placed',
      riderType: restaurant.riderModelDefault,

      platformFeeCharged: false,
      platformFeeAmount: this.platformSettings.platformFeePerOrder ?? 5,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDeliveryTime: '30-40 min',

      statusHistory: [
        {
          status: 'placed',
          timestamp: new Date().toISOString(),
          note: `Order placed by ${orderData.customerName} via ${orderData.paymentMethod.toUpperCase()}`,
          actorRole: 'customer',
        },
      ],
    };

    this.orders.unshift(newOrder);
    this.activeOrderIdForTracking = newOrder.id;
    this.clearCart();
    this.notify();
    return newOrder;
  }

  // --- Order Lifecycle State Machine Transitions ---
  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    metadata?: { rejectionReason?: string; cancellationReason?: string; riderId?: string }
  ): Order {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    // Valid state transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending_payment: ['placed', 'cancelled'],
      placed: ['accepted', 'rejected', 'cancelled'],
      accepted: ['preparing', 'cancelled'],
      preparing: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['rider_assigned', 'picked_up'],
      rider_assigned: ['picked_up', 'cancelled'],
      picked_up: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered: [], // terminal
      rejected: [], // terminal
      cancelled: ['refund_pending', 'refunded'],
      refund_pending: ['refunded'],
      refunded: [], // terminal
    };

    if (order.status !== newStatus && !validTransitions[order.status]?.includes(newStatus)) {
      console.warn(`Attempting unusual transition from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (metadata?.rejectionReason) {
      order.rejectionReason = metadata.rejectionReason;
    }
    if (metadata?.cancellationReason) {
      order.cancellationReason = metadata.cancellationReason;
    }

    if (metadata?.riderId) {
      const rider = this.riders.find((r) => r.id === metadata.riderId);
      if (rider) {
        order.riderId = rider.id;
        order.riderName = rider.name;
        order.riderPhone = rider.phone;
        order.riderType = rider.type;
        rider.activeOrderId = order.id;
      }
    }

    // If order reaches DELIVERED:
    if (newStatus === 'delivered') {
      order.completedAt = new Date().toISOString();
      order.paymentStatus = 'completed';
      if (order.riderId) {
        order.codCollectedBy = order.riderId;
        const rider = this.riders.find((r) => r.id === order.riderId);
        if (rider) {
          rider.totalDeliveries += 1;
          rider.activeOrderId = undefined;
          if (order.paymentMethod === 'cod') {
            rider.cashInHand += order.finalTotal;
          }
        }
      }

      // Record in Financial Ledger: PKR 10 platform fee, payment record, delivery expense
      this.ledger.recordOrderCompletion(order, 'system_lifecycle_engine');
      order.platformFeeCharged = true;
    }

    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Order updated to ${newStatus}`,
      actorRole: this.currentRole,
    });

    this.notify();
    return order;
  }

  // --- Restaurant Management ---
  public verifyRestaurantOnboarding(
    restaurantId: string,
    paymentMethod: PaymentMethod,
    referenceNumber: string
  ): void {
    const restaurant = this.restaurants.find((r) => r.id === restaurantId);
    if (!restaurant) return;

    restaurant.onboardingFeePaid = true;
    restaurant.onboardingPaymentRef = referenceNumber;
    restaurant.status = 'active';

    // Post to financial ledger (PKR 1,000 onboarding revenue)
    this.ledger.recordOnboardingPayment(restaurant, paymentMethod, referenceNumber, 'super_admin');
    this.notify();
  }

  public updateRestaurantStatus(restaurantId: string, status: Restaurant['status']): void {
    const rest = this.restaurants.find((r) => r.id === restaurantId);
    if (rest) {
      rest.status = status;
      this.notify();
    }
  }

  public toggleRestaurantOpen(restaurantId: string): void {
    const rest = this.restaurants.find((r) => r.id === restaurantId);
    if (rest) {
      rest.isOpen = !rest.isOpen;
      this.notify();
    }
  }

  public updateMenuItemAvailability(itemId: string, isAvailable: boolean): void {
    const item = this.menuItems.find((i) => i.id === itemId);
    if (item) {
      item.isAvailable = isAvailable;
      this.notify();
    }
  }

  public addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      ...item,
    };
    this.menuItems.push(newItem);
    this.notify();
    return newItem;
  }

  // --- Rider Management ---
  public toggleRiderOnline(riderId: string): void {
    const rider = this.riders.find((r) => r.id === riderId);
    if (rider) {
      rider.isOnline = !rider.isOnline;
      this.notify();
    }
  }

  public updateRiderLocation(riderId: string, lat: number, lng: number): void {
    const rider = this.riders.find((r) => r.id === riderId);
    if (rider) {
      rider.currentLat = lat;
      rider.currentLng = lng;
      this.notify();
    }
  }

  // --- Settlement Actions ---
  public generateWeeklySettlementsForPeriod(periodStart: string, periodEnd: string): WeeklySettlementStatement[] {
    const generated: WeeklySettlementStatement[] = [];
    for (const rest of this.restaurants) {
      const stmt = this.ledger.generateWeeklySettlement(rest, this.orders, periodStart, periodEnd);
      this.settlements.unshift(stmt);
      generated.push(stmt);
    }
    this.notify();
    return generated;
  }

  public approveSettlement(settlementId: string): void {
    const stmt = this.settlements.find((s) => s.id === settlementId);
    if (stmt) {
      stmt.status = 'approved';
      this.notify();
    }
  }

  public disburseSettlement(settlementId: string, paymentReference: string): void {
    const stmt = this.settlements.find((s) => s.id === settlementId);
    if (stmt) {
      stmt.status = 'paid';
      stmt.paidAt = new Date().toISOString();
      stmt.paymentReference = paymentReference;
      this.ledger.executeSettlementPayout(stmt, paymentReference, 'super_admin');
      this.notify();
    }
  }

  // --- Reset to initial state ---
  public resetToInitial(): void {
    localStorage.clear();
    this.restaurants = [...INITIAL_RESTAURANTS];
    this.categories = [...INITIAL_CATEGORIES];
    this.menuItems = [...INITIAL_MENU_ITEMS];
    this.riders = [...INITIAL_RIDERS];
    this.deliveryZones = [...INITIAL_DELIVERY_ZONES];
    this.orders = [...INITIAL_ORDERS];
    this.settlements = [...INITIAL_SETTLEMENTS];
    this.ledger = new LedgerEngine([...INITIAL_LEDGER_ENTRIES]);
    this.cart = { restaurantId: null, items: [] };
    this.activeOrderIdForTracking = 'ord-1042';
    this.notify();
  }
}

export const appStore = new AppStore();
