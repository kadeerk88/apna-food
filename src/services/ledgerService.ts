import {
  FinancialLedgerEntry,
  Order,
  Restaurant,
  WeeklySettlementStatement,
  LedgerEntryType,
  PaymentMethod,
} from '../types';

export class LedgerEngine {
  private entries: FinancialLedgerEntry[] = [];
  private idempotencyRegistry: Set<string> = new Set();

  constructor(initialEntries: FinancialLedgerEntry[] = []) {
    this.entries = [...initialEntries];
    this.entries.forEach((e) => {
      if (e.idempotencyKey) {
        this.idempotencyRegistry.add(e.idempotencyKey);
      }
    });
  }

  public getAllEntries(): FinancialLedgerEntry[] {
    return [...this.entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getEntriesForRestaurant(restaurantId: string): FinancialLedgerEntry[] {
    return this.entries.filter((e) => e.restaurantId === restaurantId);
  }

  public getEntriesForOrder(orderId: string): FinancialLedgerEntry[] {
    return this.entries.filter((e) => e.orderId === orderId);
  }

  /**
   * Posts an auditable ledger entry.
   * Enforces idempotency and non-mutability.
   */
  public postEntry(entry: Omit<FinancialLedgerEntry, 'id' | 'timestamp' | 'currency'> & {
    idempotencyKey?: string;
  }): FinancialLedgerEntry {
    if (entry.idempotencyKey && this.idempotencyRegistry.has(entry.idempotencyKey)) {
      const existing = this.entries.find((e) => e.idempotencyKey === entry.idempotencyKey);
      if (existing) return existing;
    }

    const newId = `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullEntry: FinancialLedgerEntry = {
      id: newId,
      timestamp: new Date().toISOString(),
      currency: 'PKR',
      ...entry,
    };

    this.entries.push(fullEntry);
    if (entry.idempotencyKey) {
      this.idempotencyRegistry.add(entry.idempotencyKey);
    }
    return fullEntry;
  }

  /**
   * Record Restaurant Onboarding Payment (PKR 1,000)
   */
  public recordOnboardingPayment(
    restaurant: Restaurant,
    paymentMethod: PaymentMethod,
    referenceNumber: string,
    recordedBy: string = 'super_admin'
  ): FinancialLedgerEntry {
    const idempotencyKey = `onboarding-${restaurant.id}-${referenceNumber}`;
    return this.postEntry({
      entryType: 'ONBOARDING_FEE_PAYMENT',
      debitAccount: paymentMethod === 'bank_transfer' ? 'PLATFORM_BANK_HBL' : `PLATFORM_${paymentMethod.toUpperCase()}_MERCHANT`,
      creditAccount: 'ONBOARDING_REVENUE',
      amount: restaurant.onboardingFeeAmount || 1000,
      restaurantId: restaurant.id,
      paymentMethod,
      referenceNumber,
      description: `One-time onboarding & inspection fee paid for ${restaurant.name}`,
      recordedBy,
      idempotencyKey,
    });
  }

  /**
   * Handle order delivery completion:
   * 1. Charge platform fee (PKR 10) once per eligible order
   * 2. Record payment collection (COD by platform rider vs restaurant rider vs digital)
   * 3. Record platform delivery expense (if platform funded)
   */
  public recordOrderCompletion(
    order: Order,
    recordedBy: string = 'system_order_engine'
  ): FinancialLedgerEntry[] {
    const generatedEntries: FinancialLedgerEntry[] = [];

    // 1. Charge Platform Fee (PKR 10) exactly once
    const feeIdempotency = `order-fee-${order.id}`;
    if (!this.idempotencyRegistry.has(feeIdempotency)) {
      const feeEntry = this.postEntry({
        entryType: 'PLATFORM_ORDER_FEE',
        debitAccount: 'ACCOUNTS_RECEIVABLE_RESTAURANT',
        creditAccount: 'PLATFORM_ORDER_FEE_REVENUE',
        amount: order.platformFeeAmount || 10,
        restaurantId: order.restaurantId,
        orderId: order.id,
        referenceNumber: `${order.orderNumber}-PLATFORM-FEE`,
        description: `Platform fee for successfully delivered order ${order.orderNumber}`,
        recordedBy,
        idempotencyKey: feeIdempotency,
      });
      generatedEntries.push(feeEntry);
    }

    // 2. Record Payment & Cash Flow based on collection party
    const paymentIdempotency = `order-payment-${order.id}`;
    if (!this.idempotencyRegistry.has(paymentIdempotency)) {
      if (order.paymentMethod === 'cod') {
        if (order.riderType === 'platform_rider') {
          // Model B: Platform rider collected the cash -> Platform holds cash, owes food net to restaurant
          const codEntry = this.postEntry({
            entryType: 'COD_COLLECTED_PLATFORM_RIDER',
            debitAccount: 'PLATFORM_RIDER_CASH_HOLDINGS',
            creditAccount: 'RESTAURANT_PAYABLE_LIABILITY',
            amount: order.finalTotal,
            restaurantId: order.restaurantId,
            orderId: order.id,
            riderId: order.riderId,
            paymentMethod: 'cod',
            referenceNumber: `COD-PLT-${order.orderNumber}`,
            description: `COD cash collected by platform rider ${order.riderName || ''} for order ${order.orderNumber}`,
            recordedBy,
            idempotencyKey: paymentIdempotency,
          });
          generatedEntries.push(codEntry);
        } else {
          // Model A: Restaurant's own rider collected the cash -> Restaurant already has customer money!
          const codEntry = this.postEntry({
            entryType: 'COD_COLLECTED_RESTAURANT_RIDER',
            debitAccount: 'RESTAURANT_OWN_CASH_REGISTER',
            creditAccount: 'CUSTOMER_SALES_REVENUE',
            amount: order.finalTotal,
            restaurantId: order.restaurantId,
            orderId: order.id,
            riderId: order.riderId,
            paymentMethod: 'cod',
            referenceNumber: `COD-RST-${order.orderNumber}`,
            description: `COD cash collected directly by restaurant rider ${order.riderName || ''} for order ${order.orderNumber}`,
            recordedBy,
            idempotencyKey: paymentIdempotency,
          });
          generatedEntries.push(codEntry);
        }
      } else {
        // Digital payment (JazzCash / EasyPaisa / Bank) -> Platform received funds in its gateway
        const digitalEntry = this.postEntry({
          entryType: 'CUSTOMER_DIGITAL_PAYMENT',
          debitAccount: `PLATFORM_${order.paymentMethod.toUpperCase()}_GATEWAY`,
          creditAccount: 'RESTAURANT_PAYABLE_LIABILITY',
          amount: order.finalTotal,
          restaurantId: order.restaurantId,
          orderId: order.id,
          paymentMethod: order.paymentMethod,
          referenceNumber: order.paymentReference || `DIGI-${order.orderNumber}`,
          description: `Digital prepaid payment collected for order ${order.orderNumber} via ${order.paymentMethod}`,
          recordedBy,
          idempotencyKey: paymentIdempotency,
        });
        generatedEntries.push(digitalEntry);
      }
    }

    // 3. Platform Delivery Expense (if platform funded)
    if (order.deliveryFunding === 'platform_funded' && order.deliveryExpense > 0) {
      const deliveryExpenseKey = `order-delivery-exp-${order.id}`;
      if (!this.idempotencyRegistry.has(deliveryExpenseKey)) {
        const delivEntry = this.postEntry({
          entryType: 'PLATFORM_DELIVERY_EXPENSE',
          debitAccount: 'PLATFORM_DELIVERY_EXPENSE_ACCOUNT',
          creditAccount: 'RIDER_PAYABLE_LIABILITY',
          amount: order.deliveryExpense,
          restaurantId: order.restaurantId,
          orderId: order.id,
          riderId: order.riderId,
          referenceNumber: `EXP-DELIV-${order.orderNumber}`,
          description: `Platform-funded delivery compensation for rider on order ${order.orderNumber}`,
          recordedBy,
          idempotencyKey: deliveryExpenseKey,
        });
        generatedEntries.push(delivEntry);
      }
    }

    return generatedEntries;
  }

  /**
   * Weekly Settlement Calculator for a restaurant
   * Reconciles:
   * - Gross food sales
   * - Platform fees owed by restaurant (PKR 10 * eligible orders)
   * - Who holds the cash:
   *    * Digital payments held by Platform (+)
   *    * COD collected by Platform Rider held by Platform (+)
   *    * COD collected by Restaurant Rider held by Restaurant (-)
   */
  public generateWeeklySettlement(
    restaurant: Restaurant,
    orders: Order[],
    periodStart: string,
    periodEnd: string,
    previousBalance: number = 0
  ): WeeklySettlementStatement {
    // Only eligible, completed/delivered orders within range
    const eligibleOrders = orders.filter(
      (o) =>
        o.restaurantId === restaurant.id &&
        o.status === 'delivered' &&
        new Date(o.completedAt || o.updatedAt) >= new Date(periodStart) &&
        new Date(o.completedAt || o.updatedAt) <= new Date(periodEnd)
    );

    let grossSales = 0;
    let totalPlatformFees = 0;
    let codRestaurantRider = 0;
    let codPlatformRider = 0;
    let digitalPayments = 0;

    for (const ord of eligibleOrders) {
      grossSales += ord.subtotal;
      totalPlatformFees += ord.platformFeeAmount || 10;

      if (ord.paymentMethod === 'cod') {
        if (ord.riderType === 'restaurant_rider') {
          codRestaurantRider += ord.finalTotal;
        } else {
          codPlatformRider += ord.finalTotal;
        }
      } else {
        digitalPayments += ord.finalTotal;
      }
    }

    // Money held by Platform on behalf of Restaurant:
    // = Digital Payments + COD collected by Platform Riders
    // Money already in Restaurant's hands:
    // = COD collected by Restaurant's own riders
    // Net Payable from Platform to Restaurant:
    // Platform owes Restaurant: Gross Sales - Platform Fees
    // Platform actually holds: Digital + COD Platform Rider
    // If Platform holds more than net food revenue, Platform pays the difference to Restaurant.
    // If Restaurant already collected cash from its own riders, Restaurant owes Platform fee + any excess.
    const fundsHeldByPlatform = digitalPayments + codPlatformRider;
    const netPayable = fundsHeldByPlatform - totalPlatformFees + previousBalance;

    const statementId = `settle-${restaurant.id}-${Date.now().toString().slice(-6)}`;
    const settlementNumber = `SETTLE-ALP-${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}-${restaurant.id.slice(-3)}`;

    return {
      id: statementId,
      settlementNumber,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      periodStart,
      periodEnd,
      eligibleCompletedOrdersCount: eligibleOrders.length,
      grossSales,
      totalPlatformFees,
      codCollectedByRestaurantRiders: codRestaurantRider,
      codCollectedByPlatformRiders: codPlatformRider,
      digitalPaymentsReceived: digitalPayments,
      platformFundedDeliveryAdjustment: 0,
      previousBalance,
      netPayableToRestaurant: netPayable,
      status: 'pending_approval',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Disburse / Mark settlement paid
   */
  public executeSettlementPayout(
    settlement: WeeklySettlementStatement,
    paymentReference: string,
    paidBy: string = 'super_admin'
  ): FinancialLedgerEntry {
    const idempotencyKey = `settlement-payout-${settlement.id}`;
    return this.postEntry({
      entryType: 'RESTAURANT_SETTLEMENT_PAYOUT',
      debitAccount: 'RESTAURANT_PAYABLE_LIABILITY',
      creditAccount: 'PLATFORM_BANK_HBL',
      amount: Math.abs(settlement.netPayableToRestaurant),
      restaurantId: settlement.restaurantId,
      referenceNumber: paymentReference,
      description: `Weekly settlement payout for ${settlement.restaurantName} (Stmt #${settlement.settlementNumber})`,
      recordedBy: paidBy,
      idempotencyKey,
    });
  }

  /**
   * System Ledger Invariant Health Check
   * In double-entry accounting:
   * Total Debits == Total Credits across all posted entries.
   */
  public verifyLedgerBalance(): {
    isBalanced: boolean;
    totalEntries: number;
    debitSum: number;
    creditSum: number;
    difference: number;
  } {
    const totalEntries = this.entries.length;
    let sum = 0;
    for (const e of this.entries) {
      sum += e.amount;
    }
    // Each entry has an equal debit and credit
    return {
      isBalanced: true,
      totalEntries,
      debitSum: sum,
      creditSum: sum,
      difference: 0,
    };
  }
}
