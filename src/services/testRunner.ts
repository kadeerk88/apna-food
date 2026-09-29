import { appStore } from './store';
import { LedgerEngine } from './ledgerService';
import { Order, Restaurant, MenuItem } from '../types';

export interface TestResult {
  id: string;
  name: string;
  category: 'Cart' | 'Order Lifecycle' | 'Rider & COD' | 'Financial Ledger' | 'Settlement';
  status: 'passed' | 'failed';
  durationMs: number;
  message: string;
  details?: string;
}

export async function runAllAutomatedTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Helper
  const runTest = async (
    id: string,
    name: string,
    category: TestResult['category'],
    fn: () => void | Promise<void>
  ) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        id,
        name,
        category,
        status: 'passed',
        durationMs: Math.round(performance.now() - start),
        message: 'All assertions passed successfully.',
      });
    } catch (err: any) {
      results.push({
        id,
        name,
        category,
        status: 'failed',
        durationMs: Math.round(performance.now() - start),
        message: err.message || 'Assertion failed',
        details: err.stack,
      });
    }
  };

  // Test 1: Mandatory Cart Rule — Single Restaurant per Order
  await runTest(
    'test-cart-01',
    'Cart Single-Restaurant Isolation Rule',
    'Cart',
    () => {
      appStore.clearCart();
      const itemRest1: MenuItem = {
        id: 'mock-item-1',
        restaurantId: 'rest-001',
        categoryId: 'cat-01',
        name: 'Karahi',
        description: 'Tasty',
        price: 1200,
        imageUrl: '',
        isAvailable: true,
      };

      const itemRest2: MenuItem = {
        id: 'mock-item-2',
        restaurantId: 'rest-002',
        categoryId: 'cat-02',
        name: 'Biryani',
        description: 'Fragrant',
        price: 500,
        imageUrl: '',
        isAvailable: true,
      };

      const addedFirst = appStore.addToCart(itemRest1);
      if (!addedFirst) throw new Error('Failed to add first item to empty cart');
      if (appStore.cart.restaurantId !== 'rest-001') throw new Error('Cart restaurantId not set to rest-001');

      // Adding item from rest-002 must trigger conflict and return false
      const addedConflict = appStore.addToCart(itemRest2);
      if (addedConflict) throw new Error('Security flaw: Cart allowed item from a different restaurant into the same order!');
      if (!appStore.cartConflictModal.isOpen) throw new Error('Cart conflict dialog was not triggered');
      if (appStore.cart.items.length !== 1) throw new Error('Cart corrupted during conflict check');

      // Clean up
      appStore.resolveCartConflict(false);
      appStore.clearCart();
    }
  );

  // Test 2: Order State Machine Transitions
  await runTest(
    'test-order-02',
    'Order State Machine Valid Transitions',
    'Order Lifecycle',
    () => {
      // Create a test order
      const testOrder: Order = {
        id: `test-ord-${Date.now()}`,
        orderNumber: 'ALP-TEST-001',
        customerId: 'cust-t',
        customerName: 'Test Customer',
        customerPhone: '+92 300 0000000',
        deliveryAddress: 'Alipur Test Street',
        deliveryArea: 'Kutchery Chowk, Alipur',
        deliveryCoordinates: { lat: 29.38, lng: 70.91 },
        restaurantId: 'rest-001',
        restaurantName: 'Al-Madina Shinwari & Karahi',
        restaurantPhone: '+92 300 1234567',
        restaurantAddress: 'Kutchery Chowk',
        restaurantCoordinates: { lat: 29.38, lng: 70.91 },
        items: [],
        subtotal: 1000,
        deliveryCharge: 40,
        deliveryExpense: 70,
        deliveryFunding: 'platform_funded',
        discountAmount: 0,
        finalTotal: 1040,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'placed',
        platformFeeCharged: false,
        platformFeeAmount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [],
      };

      appStore.orders.unshift(testOrder);

      // Transition to accepted
      appStore.updateOrderStatus(testOrder.id, 'accepted', 'Kitchen accepted');
      if ((testOrder.status as string) !== 'accepted') throw new Error('Failed to transition to accepted');

      // Transition to preparing
      appStore.updateOrderStatus(testOrder.id, 'preparing', 'Chef cooking');
      if ((testOrder.status as string) !== 'preparing') throw new Error('Failed to transition to preparing');

      // Transition to ready_for_pickup
      appStore.updateOrderStatus(testOrder.id, 'ready_for_pickup', 'Packed in box');
      if ((testOrder.status as string) !== 'ready_for_pickup') throw new Error('Failed to transition to ready_for_pickup');

      // Transition to rider_assigned
      appStore.updateOrderStatus(testOrder.id, 'rider_assigned', 'Assigned', { riderId: 'rider-001' });
      if ((testOrder.status as string) !== 'rider_assigned') throw new Error('Failed to transition to rider_assigned');
      if (testOrder.riderId !== 'rider-001') throw new Error('Rider ID not attached');
    }
  );

  // Test 3: Restaurant Rejection with Mandatory Reason
  await runTest(
    'test-order-03',
    'Restaurant Rejection Reason Enforcement',
    'Order Lifecycle',
    () => {
      const testOrder: Order = {
        id: `test-reject-${Date.now()}`,
        orderNumber: 'ALP-TEST-REJECT',
        customerId: 'cust-t',
        customerName: 'Test Customer',
        customerPhone: '+92 300 0000000',
        deliveryAddress: 'Alipur Test Street',
        deliveryArea: 'Kutchery Chowk, Alipur',
        deliveryCoordinates: { lat: 29.38, lng: 70.91 },
        restaurantId: 'rest-001',
        restaurantName: 'Al-Madina Shinwari & Karahi',
        restaurantPhone: '+92 300 1234567',
        restaurantAddress: 'Kutchery Chowk',
        restaurantCoordinates: { lat: 29.38, lng: 70.91 },
        items: [],
        subtotal: 800,
        deliveryCharge: 40,
        deliveryExpense: 70,
        deliveryFunding: 'platform_funded',
        discountAmount: 0,
        finalTotal: 840,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'placed',
        platformFeeCharged: false,
        platformFeeAmount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [],
      };
      appStore.orders.unshift(testOrder);

      const rejectionReason = 'Kitchen overwhelmed with orders during peak dinner rush';
      appStore.updateOrderStatus(testOrder.id, 'rejected', 'Rejected by restaurant manager', {
        rejectionReason,
      });

      if (testOrder.status !== 'rejected') throw new Error('Order not marked as rejected');
      if (testOrder.rejectionReason !== rejectionReason) throw new Error('Rejection reason was not recorded');
      if (testOrder.platformFeeCharged) throw new Error('Violation: Platform fee was charged on a rejected order!');
    }
  );

  // Test 4: Platform Fee Policy — PKR 5 Charged Exactly Once on Completed Order
  await runTest(
    'test-ledger-04',
    'PKR 5 Platform Fee Charged Exactly Once on Delivery',
    'Financial Ledger',
    () => {
      const isolatedLedger = new LedgerEngine([]);
      const testOrder: Order = {
        id: `ord-complete-${Date.now()}`,
        orderNumber: 'APN-FEE-TEST',
        customerId: 'cust-t',
        customerName: 'Hamza',
        customerPhone: '+92 302 0000000',
        deliveryAddress: 'Main Bazaar Alipur',
        deliveryArea: 'Kutchery Chowk, Alipur',
        deliveryCoordinates: { lat: 29.38, lng: 70.91 },
        restaurantId: 'rest-001',
        restaurantName: 'Al-Madina',
        restaurantPhone: '123',
        restaurantAddress: 'Main St',
        restaurantCoordinates: { lat: 29.38, lng: 70.91 },
        items: [],
        subtotal: 1500,
        deliveryCharge: 40,
        deliveryExpense: 70,
        deliveryFunding: 'platform_funded',
        discountAmount: 0,
        finalTotal: 1540,
        paymentMethod: 'cod',
        paymentStatus: 'completed',
        status: 'delivered',
        riderId: 'rider-002',
        riderName: 'Bilal',
        riderType: 'platform_rider',
        platformFeeCharged: false,
        platformFeeAmount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [],
      };

      // First completion call
      const entries1 = isolatedLedger.recordOrderCompletion(testOrder);
      const feeEntries1 = entries1.filter((e) => e.entryType === 'PLATFORM_ORDER_FEE');
      if (feeEntries1.length !== 1) throw new Error(`Expected 1 fee entry, got ${feeEntries1.length}`);
      if (feeEntries1[0].amount !== 5) throw new Error(`Expected PKR 5 fee, got PKR ${feeEntries1[0].amount}`);

      // Second completion call (idempotency simulation)
      const entries2 = isolatedLedger.recordOrderCompletion(testOrder);
      const feeEntries2 = isolatedLedger.getAllEntries().filter((e) => e.entryType === 'PLATFORM_ORDER_FEE');
      if (feeEntries2.length !== 1) throw new Error('Duplicate platform fee posting detected! Idempotency failed.');
    }
  );

  // Test 5: Ledger Invariant — Total Debits Equal Total Credits
  await runTest(
    'test-ledger-05',
    'Double-Entry Ledger Debits == Credits Invariant',
    'Financial Ledger',
    () => {
      const balance = appStore.ledger.verifyLedgerBalance();
      if (!balance.isBalanced) throw new Error(`Ledger out of balance! Difference: ${balance.difference}`);
      if (balance.debitSum !== balance.creditSum) {
        throw new Error(`Debit sum (${balance.debitSum}) does not match Credit sum (${balance.creditSum})`);
      }
    }
  );

  // Test 6: Restaurant Onboarding PKR 1,000 Registration Fee & Verification
  await runTest(
    'test-ledger-06',
    'Restaurant Onboarding PKR 1,000 Fee Posting',
    'Financial Ledger',
    () => {
      const isolatedLedger = new LedgerEngine([]);
      const testRestaurant: Restaurant = {
        id: 'rest-new-001',
        name: 'New Punjab Dhaba',
        ownerName: 'Malik Zafar',
        phone: '+92 300 5551234',
        address: 'Bypass Road, Alipur',
        area: 'Bypass, Alipur',
        lat: 29.39,
        lng: 70.91,
        rating: 5,
        reviewCount: 0,
        deliveryTimeEstimate: '30 min',
        minOrder: 300,
        imageUrl: '',
        status: 'pending_verification',
        isListedOnApp: true,
        onboardingFeePaid: false,
        onboardingFeeAmount: 1000,
        cuisines: ['Dhaba'],
        riderModelDefault: 'platform_rider',
        isOpen: false,
        openingHours: '10 AM - 10 PM',
      };

      const entry = isolatedLedger.recordOnboardingPayment(
        testRestaurant,
        'bank_transfer',
        'BNK-ALIPUR-99120',
        'super_admin'
      );

      if (entry.amount !== 1000) throw new Error(`Expected PKR 1,000 onboarding fee, got PKR ${entry.amount}`);
      if (entry.creditAccount !== 'ONBOARDING_REVENUE') throw new Error('Credit account must be ONBOARDING_REVENUE');
    }
  );

  // Test 7: Rider COD Collection Segregation (Platform Rider vs Restaurant Rider)
  await runTest(
    'test-rider-07',
    'COD Segregation: Platform Rider vs Restaurant Rider',
    'Rider & COD',
    () => {
      const isolatedLedger = new LedgerEngine([]);

      // Case A: Platform Rider (Model B)
      const orderPlatformRider: Order = {
        id: 'ord-plt-1',
        orderNumber: 'ALP-PLT-1',
        customerId: 'cust-1',
        customerName: 'Ahmad',
        customerPhone: '123',
        deliveryAddress: 'Alipur',
        deliveryArea: 'Alipur',
        deliveryCoordinates: { lat: 29.38, lng: 70.91 },
        restaurantId: 'rest-001',
        restaurantName: 'Al-Madina',
        restaurantPhone: '123',
        restaurantAddress: 'Alipur',
        restaurantCoordinates: { lat: 29.38, lng: 70.91 },
        items: [],
        subtotal: 1000,
        deliveryCharge: 40,
        deliveryExpense: 70,
        deliveryFunding: 'platform_funded',
        discountAmount: 0,
        finalTotal: 1040,
        paymentMethod: 'cod',
        paymentStatus: 'completed',
        status: 'delivered',
        riderId: 'rider-002',
        riderType: 'platform_rider',
        platformFeeCharged: false,
        platformFeeAmount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [],
      };

      isolatedLedger.recordOrderCompletion(orderPlatformRider);
      const codEntriesPlt = isolatedLedger.getAllEntries().filter((e) => e.entryType === 'COD_COLLECTED_PLATFORM_RIDER');
      if (codEntriesPlt.length !== 1) throw new Error('COD for platform rider not recorded in PLATFORM_RIDER_CASH_HOLDINGS');
      if (codEntriesPlt[0].debitAccount !== 'PLATFORM_RIDER_CASH_HOLDINGS') throw new Error('Debit account must be PLATFORM_RIDER_CASH_HOLDINGS');

      // Case B: Restaurant Rider (Model A)
      const orderRestRider: Order = {
        ...orderPlatformRider,
        id: 'ord-rst-1',
        orderNumber: 'ALP-RST-1',
        riderId: 'rider-001',
        riderType: 'restaurant_rider',
      };

      isolatedLedger.recordOrderCompletion(orderRestRider);
      const codEntriesRst = isolatedLedger.getAllEntries().filter((e) => e.entryType === 'COD_COLLECTED_RESTAURANT_RIDER');
      if (codEntriesRst.length !== 1) throw new Error('COD for restaurant rider not recorded in RESTAURANT_OWN_CASH_REGISTER');
      if (codEntriesRst[0].debitAccount !== 'RESTAURANT_OWN_CASH_REGISTER') throw new Error('Debit account must be RESTAURANT_OWN_CASH_REGISTER');
    }
  );

  // Test 8: Weekly Settlement Reconciliation Formula
  await runTest(
    'test-settle-08',
    'Weekly Settlement Calculation & Net Payable Integrity',
    'Settlement',
    () => {
      const isolatedLedger = new LedgerEngine([]);
      const restaurant: Restaurant = {
        id: 'rest-settle-test',
        name: 'Test Biryani',
        ownerName: 'Owner',
        phone: '123',
        address: 'Alipur',
        area: 'Alipur',
        lat: 29.38,
        lng: 70.91,
        rating: 5,
        reviewCount: 10,
        deliveryTimeEstimate: '20 min',
        minOrder: 100,
        imageUrl: '',
        status: 'active',
        isListedOnApp: true,
        onboardingFeePaid: true,
        onboardingFeeAmount: 1000,
        cuisines: ['Rice'],
        riderModelDefault: 'platform_rider',
        isOpen: true,
        openingHours: '10-10',
      };

      // 5 delivered orders: 3 via Platform Rider COD (PKR 1,000 each = 3,000), 2 via Digital Prepaid (PKR 1,000 each = 2,000)
      const now = new Date();
      const periodStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      const periodEnd = new Date(now.getTime() + 1 * 86400000).toISOString();

      const testOrders: Order[] = [
        {
          id: 'ord-s1',
          orderNumber: 'S-1',
          customerId: 'c1',
          customerName: 'C1',
          customerPhone: '1',
          deliveryAddress: 'A',
          deliveryArea: 'A',
          deliveryCoordinates: { lat: 29.38, lng: 70.91 },
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantPhone: '1',
          restaurantAddress: 'A',
          restaurantCoordinates: { lat: 29.38, lng: 70.91 },
          items: [],
          subtotal: 1000,
          deliveryCharge: 40,
          deliveryExpense: 70,
          deliveryFunding: 'platform_funded',
          discountAmount: 0,
          finalTotal: 1040,
          paymentMethod: 'cod',
          paymentStatus: 'completed',
          status: 'delivered',
          riderType: 'platform_rider',
          platformFeeCharged: true,
          platformFeeAmount: 5,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          completedAt: now.toISOString(),
          statusHistory: [],
        },
        {
          id: 'ord-s2',
          orderNumber: 'S-2',
          customerId: 'c1',
          customerName: 'C1',
          customerPhone: '1',
          deliveryAddress: 'A',
          deliveryArea: 'A',
          deliveryCoordinates: { lat: 29.38, lng: 70.91 },
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantPhone: '1',
          restaurantAddress: 'A',
          restaurantCoordinates: { lat: 29.38, lng: 70.91 },
          items: [],
          subtotal: 1000,
          deliveryCharge: 40,
          deliveryExpense: 70,
          deliveryFunding: 'platform_funded',
          discountAmount: 0,
          finalTotal: 1040,
          paymentMethod: 'jazzcash',
          paymentStatus: 'completed',
          status: 'delivered',
          riderType: 'platform_rider',
          platformFeeCharged: true,
          platformFeeAmount: 5,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          completedAt: now.toISOString(),
          statusHistory: [],
        },
      ];

      const stmt = isolatedLedger.generateWeeklySettlement(
        restaurant,
        testOrders,
        periodStart,
        periodEnd,
        0
      );

      if (stmt.eligibleCompletedOrdersCount !== 2) throw new Error(`Expected 2 orders, got ${stmt.eligibleCompletedOrdersCount}`);
      if (stmt.totalPlatformFees !== 10) throw new Error(`Expected PKR 10 platform fees, got ${stmt.totalPlatformFees}`);
      // Gross sales = 2000. Funds held by platform = 1040 (COD) + 1040 (JazzCash) = 2080.
      // Net payable = 2080 - 10 (fees) = 2070.
      if (stmt.netPayableToRestaurant !== 2070) {
        throw new Error(`Expected net payable 2070, got ${stmt.netPayableToRestaurant}`);
      }
    }
  );

  return results;
}
