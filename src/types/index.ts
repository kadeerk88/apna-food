export type UserRole = 'customer' | 'restaurant_admin' | 'rider' | 'super_admin';

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded';

export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type RiderType = 'restaurant_rider' | 'platform_rider';
export type DeliveryFunding = 'platform_funded' | 'customer_funded' | 'split';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  restaurantId?: string;
  riderId?: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  priceDelta: number; // in PKR
}

export interface MenuItemOptionGroup {
  id: string;
  name: string; // e.g. "Size", "Spice Level", "Add-ons"
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // PKR
  imageUrl: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isPopular?: boolean;
  optionGroups?: MenuItemOptionGroup[];
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export type RestaurantStatus = 'pending_verification' | 'active' | 'suspended' | 'rejected';

export interface PlatformSettings {
  restaurantOnboardingFee: number; // Initially PKR 0, super admin manageable
  platformFeePerOrder: number; // Initially PKR 5, super admin manageable
  currency: 'PKR';
  autoApproveRestaurants: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  area: string; // e.g. "Kutchery Chowk, Alipur"
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  deliveryTimeEstimate: string; // e.g. "25-35 min"
  minOrder: number; // PKR
  imageUrl: string;
  logoUrl?: string;
  status: RestaurantStatus;
  isListedOnApp: boolean; // Controlled by Super Admin to decide who is added or not
  onboardingFeePaid: boolean;
  onboardingPaymentRef?: string;
  onboardingFeeAmount: number; // Default PKR 0
  cuisines: string[];
  riderModelDefault: RiderType;
  isOpen: boolean;
  openingHours: string;
  bankAccountDetails?: string;
}

export interface CartItemOptionSelected {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number; // base price + selected options
  basePrice: number;
  quantity: number;
  selectedOptions: CartItemOptionSelected[];
  specialInstructions?: string;
  imageUrl?: string;
}

export interface Cart {
  restaurantId: string | null;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions: CartItemOptionSelected[];
  specialInstructions?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  actorId?: string;
  actorRole?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ALP-2026-1042"
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryCoordinates: { lat: number; lng: number };
  customerNote?: string;

  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantAddress: string;
  restaurantCoordinates: { lat: number; lng: number };

  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number; // charged to customer
  deliveryExpense: number; // actual cost incurred by platform
  deliveryFunding: DeliveryFunding; // platform_funded or customer_funded
  discountAmount: number;
  couponCode?: string;
  finalTotal: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  codCollectedBy?: string; // riderId who received cash

  status: OrderStatus;
  rejectionReason?: string;
  cancellationReason?: string;

  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderType?: RiderType;

  platformFeeCharged: boolean;
  platformFeeAmount: number; // PKR 10

  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  completedAt?: string;

  statusHistory: OrderStatusHistoryItem[];
  idempotencyKey?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: string; // "Honda 125 Motorcycle"
  licensePlate: string; // "MLN-4421"
  type: RiderType;
  restaurantId?: string; // if restaurant rider
  isOnline: boolean;
  currentLat: number;
  currentLng: number;
  activeOrderId?: string;
  rating: number;
  totalDeliveries: number;
  cashInHand: number; // COD accumulated
}

export type LedgerEntryType =
  | 'RESTAURANT_ONBOARDING_FEE'
  | 'ONBOARDING_FEE_PAYMENT'
  | 'CUSTOMER_DIGITAL_PAYMENT'
  | 'COD_COLLECTED_RESTAURANT_RIDER'
  | 'COD_COLLECTED_PLATFORM_RIDER'
  | 'PLATFORM_ORDER_FEE'
  | 'RESTAURANT_PAYABLE_CREDIT'
  | 'PLATFORM_DELIVERY_EXPENSE'
  | 'RIDER_PAYOUT'
  | 'RESTAURANT_SETTLEMENT_PAYOUT'
  | 'REFUND_DISBURSEMENT'
  | 'ADJUSTMENT_CORRECTION';

export interface FinancialLedgerEntry {
  id: string;
  timestamp: string;
  entryType: LedgerEntryType;
  debitAccount: string;
  creditAccount: string;
  amount: number; // in PKR
  currency: 'PKR';
  restaurantId?: string;
  orderId?: string;
  riderId?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber: string;
  description: string;
  recordedBy: string;
  idempotencyKey?: string;
}

export interface WeeklySettlementStatement {
  id: string;
  settlementNumber: string; // e.g. "SETTLE-ALP-2026-W38-001"
  restaurantId: string;
  restaurantName: string;
  periodStart: string;
  periodEnd: string;
  eligibleCompletedOrdersCount: number;
  grossSales: number; // sum of food subtotal
  totalPlatformFees: number; // count * PKR 10
  codCollectedByRestaurantRiders: number;
  codCollectedByPlatformRiders: number;
  digitalPaymentsReceived: number;
  platformFundedDeliveryAdjustment: number;
  previousBalance: number;
  netPayableToRestaurant: number; // if positive, platform owes restaurant. If negative, restaurant owes platform
  status: 'draft' | 'pending_approval' | 'approved' | 'paid';
  paidAt?: string;
  paymentReference?: string;
  generatedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  areaDescription: string;
  customerDeliveryFee: number; // e.g. 50 PKR
  platformDeliveryExpense: number; // e.g. 80 PKR
  isPlatformFunded: boolean;
  minFreeDeliveryThreshold: number; // e.g. 600 PKR
  isActive: boolean;
}
