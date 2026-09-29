import React, { useState } from 'react';
import { appStore } from '../../services/store';
import {
  Restaurant,
  Order,
  Rider,
  WeeklySettlementStatement,
  FinancialLedgerEntry,
  PaymentMethod,
} from '../../types';
import {
  ShieldCheck,
  Store,
  DollarSign,
  TrendingUp,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
  Filter,
  RefreshCw,
  CreditCard,
  Building,
  UserCheck,
  Send,
  Layers,
  Settings,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Save,
} from 'lucide-react';

export const SuperAdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'restaurants' | 'settings' | 'settlements' | 'ledger' | 'zones' | 'orders'
  >('overview');

  // Fee settings form state
  const [onboardingFeeInput, setOnboardingFeeInput] = useState<number>(
    appStore.platformSettings.restaurantOnboardingFee ?? 0
  );
  const [platformFeePerOrderInput, setPlatformFeePerOrderInput] = useState<number>(
    appStore.platformSettings.platformFeePerOrder ?? 5
  );
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  // New restaurant modal state
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestOwner, setNewRestOwner] = useState('');
  const [newRestPhone, setNewRestPhone] = useState('+92 300 ');
  const [newRestAddress, setNewRestAddress] = useState('');
  const [newRestArea, setNewRestArea] = useState('Kutchery Chowk, Alipur');
  const [newRestCuisines, setNewRestCuisines] = useState('Desi Karahi, BBQ');
  const [newRestMinOrder, setNewRestMinOrder] = useState('300');
  const [newRestListed, setNewRestListed] = useState(true);

  // Onboarding verification modal
  const [verifyingRestaurant, setVerifyingRestaurant] = useState<Restaurant | null>(null);
  const [onboardingPayMethod, setOnboardingPayMethod] = useState<PaymentMethod>('bank_transfer');
  const [onboardingRefNumber, setOnboardingRefNumber] = useState('');

  // Settlement payout modal
  const [payoutSettlement, setPayoutSettlement] = useState<WeeklySettlementStatement | null>(null);
  const [settlementBankRef, setSettlementBankRef] = useState('');

  // Weekly settlement generation period
  const [settlePeriodStart, setSettlePeriodStart] = useState('2026-09-20');
  const [settlePeriodEnd, setSettlePeriodEnd] = useState('2026-09-27');

  // Ledger filter
  const [ledgerFilterType, setLedgerFilterType] = useState<string>('ALL');

  // Platform Metrics
  const totalOrders = appStore.orders.length;
  const completedOrders = appStore.orders.filter((o) => o.status === 'delivered');
  const gmv = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);

  // Platform Revenue
  const onboardingRevenue = appStore.restaurants
    .filter((r) => r.onboardingFeePaid)
    .reduce((sum, r) => sum + (r.onboardingFeeAmount || 0), 0);
  const platformOrderFeeRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.platformFeeAmount || appStore.platformSettings.platformFeePerOrder || 5),
    0
  );
  const totalPlatformRevenue = onboardingRevenue + platformOrderFeeRevenue;

  // Platform Delivery Expense funded
  const totalDeliveryExpenseFunded = completedOrders
    .filter((o) => o.deliveryFunding === 'platform_funded')
    .reduce((sum, o) => sum + o.deliveryExpense, 0);

  const pendingVerificationCount = appStore.restaurants.filter(
    (r) => r.status === 'pending_verification'
  ).length;

  // Ledger Entries
  const allLedgerEntries = appStore.ledger.getAllEntries();
  const filteredLedgerEntries = allLedgerEntries.filter((e) => {
    if (ledgerFilterType === 'ALL') return true;
    return e.entryType === ledgerFilterType;
  });

  const ledgerBalance = appStore.ledger.verifyLedgerBalance();

  const handleSavePlatformSettings = () => {
    appStore.updatePlatformSettings({
      restaurantOnboardingFee: Number(onboardingFeeInput) || 0,
      platformFeePerOrder: Number(platformFeePerOrderInput) || 0,
    });
    setSettingsSavedAlert(true);
    setTimeout(() => setSettingsSavedAlert(false), 3000);
  };

  const handleCreateRestaurant = () => {
    if (!newRestName.trim() || !newRestOwner.trim() || !newRestPhone.trim()) {
      alert('Restaurant name, owner, and phone number are required.');
      return;
    }

    appStore.addRestaurant({
      name: newRestName.trim(),
      ownerName: newRestOwner.trim(),
      phone: newRestPhone.trim(),
      address: newRestAddress.trim() || 'Main Bazaar, Alipur',
      area: newRestArea,
      lat: 29.385,
      lng: 70.912,
      rating: 4.8,
      reviewCount: 1,
      deliveryTimeEstimate: '25-35 min',
      minOrder: Number(newRestMinOrder) || 250,
      imageUrl: '/src/assets/images/karahi_specialty_1790524553281.jpg',
      status: 'active',
      isListedOnApp: newRestListed,
      onboardingFeePaid: appStore.platformSettings.restaurantOnboardingFee === 0,
      onboardingFeeAmount: appStore.platformSettings.restaurantOnboardingFee,
      cuisines: newRestCuisines.split(',').map((c) => c.trim()).filter(Boolean),
      riderModelDefault: 'platform_rider',
      isOpen: true,
      openingHours: '11:00 AM - 12:00 AM',
    });

    setIsAddingRestaurant(false);
    setNewRestName('');
    setNewRestOwner('');
    setNewRestAddress('');
  };

  const handleVerifyOnboarding = () => {
    if (!verifyingRestaurant || !onboardingRefNumber.trim()) {
      alert('Payment reference number is mandatory for audit verification.');
      return;
    }
    appStore.verifyRestaurantOnboarding(
      verifyingRestaurant.id,
      onboardingPayMethod,
      onboardingRefNumber.trim()
    );
    setVerifyingRestaurant(null);
    setOnboardingRefNumber('');
  };

  const handleRunWeeklySettlement = () => {
    const startIso = new Date(settlePeriodStart).toISOString();
    const endIso = new Date(settlePeriodEnd + 'T23:59:59').toISOString();
    appStore.generateWeeklySettlementsForPeriod(startIso, endIso);
    alert('Weekly settlement statements generated successfully for all restaurants.');
  };

  const handleDisburseSettlement = () => {
    if (!payoutSettlement || !settlementBankRef.trim()) {
      alert('Bank transaction reference is required for payment recording.');
      return;
    }
    appStore.disburseSettlement(payoutSettlement.id, settlementBankRef.trim());
    setPayoutSettlement(null);
    setSettlementBankRef('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-stone-900 text-white rounded-xl p-5 border border-stone-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Apna Food Central Operations & Governance</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
            Super Administrator Console
          </h1>
          <p className="mt-1 text-xs text-stone-300">
            Control restaurant listing on customer app, configure platform & onboarding fees, verify financial ledger, and manage settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700 text-xs">
            <span className="text-stone-400">Current Order Fee: </span>
            <strong className="text-amber-400 font-mono">
              PKR {appStore.platformSettings.platformFeePerOrder}/order
            </strong>
            <span className="text-stone-500 mx-1">·</span>
            <span className="text-stone-400">Onboarding: </span>
            <strong className="text-emerald-400 font-mono">
              PKR {appStore.platformSettings.restaurantOnboardingFee}
            </strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto scrollbar-none">
        {[
          { key: 'overview', label: 'Platform KPIs', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          {
            key: 'restaurants',
            label: `Manage Restaurants (${appStore.restaurants.length})`,
            icon: <Store className="w-3.5 h-3.5" />,
            badge: pendingVerificationCount > 0 ? `${pendingVerificationCount} Pending` : undefined,
          },
          { key: 'settings', label: 'Fees & Platform Settings', icon: <Settings className="w-3.5 h-3.5" /> },
          { key: 'settlements', label: 'Weekly Settlements', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
          { key: 'ledger', label: 'Financial Ledger', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { key: 'zones', label: 'Delivery Zones', icon: <Truck className="w-3.5 h-3.5" /> },
          { key: 'orders', label: 'Master Orders', icon: <Layers className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="bg-amber-500 text-stone-900 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: PLATFORM KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">Gross Marketplace Sales (GMV)</span>
              <div className="mt-1 font-mono text-xl font-bold text-stone-900">
                PKR {gmv.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                Food value delivered across Alipur
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">Platform Revenue (Net)</span>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-700">
                PKR {totalPlatformRevenue.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                PKR {onboardingRevenue} onboarding + PKR {platformOrderFeeRevenue} order fees (PKR {appStore.platformSettings.platformFeePerOrder}/order)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">Active Listed Kitchens</span>
              <div className="mt-1 font-mono text-xl font-bold text-stone-900">
                {appStore.restaurants.filter((r) => r.isListedOnApp && r.status === 'active').length} / {appStore.restaurants.length}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                Visible to customers on Apna Food app
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">Delivery Fleet</span>
              <div className="mt-1 font-mono text-xl font-bold text-stone-900">
                {appStore.riders.filter((r) => r.isOnline).length} / {appStore.riders.length} Online
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                Model A & Model B riders in Alipur
              </div>
            </div>
          </div>

          {/* Quick Configuration Highlights */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div>
              <strong className="block font-semibold">Current Platform Fee Policy</strong>
              Onboarding fee is set to <strong>PKR {appStore.platformSettings.restaurantOnboardingFee}</strong> (Free Launch Promo) and completed order fee is set to <strong>PKR {appStore.platformSettings.platformFeePerOrder} per order</strong>.
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 cursor-pointer"
            >
              Adjust Fee Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE RESTAURANTS & WHO IS ADDED OR NOT */}
      {activeTab === 'restaurants' && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Manage Restaurant List & Customer App Visibility
              </h3>
              <p className="text-xs text-stone-500">
                Super Admin decides who is added or not to the customer restaurant list, activates new applicants, and sets listing status.
              </p>
            </div>

            <button
              onClick={() => setIsAddingRestaurant(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Restaurant</span>
            </button>
          </div>

          <div className="space-y-3">
            {appStore.restaurants.map((rest) => (
              <div
                key={rest.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs transition-colors ${
                  rest.isListedOnApp
                    ? 'bg-stone-50 border-stone-200'
                    : 'bg-stone-100/60 border-dashed border-stone-300 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={rest.imageUrl}
                    alt={rest.name}
                    className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{rest.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          rest.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rest.status.replace(/_/g, ' ')}
                      </span>

                      {/* Listed or Hidden Pill */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          rest.isListedOnApp
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {rest.isListedOnApp ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Listed on Customer App</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden from Customers</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-stone-600 mt-1">
                      Owner: <strong>{rest.ownerName}</strong> ({rest.phone}) · Area: {rest.area}
                    </div>

                    <div className="text-stone-500 mt-0.5">
                      Onboarding Fee:{' '}
                      {rest.onboardingFeeAmount === 0 ? (
                        <span className="text-emerald-700 font-medium">
                          PKR 0 (Free Promotion Active)
                        </span>
                      ) : rest.onboardingFeePaid ? (
                        <span className="text-emerald-700 font-medium">
                          Paid PKR {rest.onboardingFeeAmount} (Ref: {rest.onboardingPaymentRef})
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">
                          Pending PKR {rest.onboardingFeeAmount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Toggle Listing, Approve, Suspend, Delete */}
                <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                  {/* Super Admin Manage Customer App Listing Toggle */}
                  <button
                    onClick={() => appStore.toggleRestaurantListing(rest.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                      rest.isListedOnApp
                        ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title={rest.isListedOnApp ? 'Hide from customer discovery' : 'Show on customer discovery'}
                  >
                    {rest.isListedOnApp ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide from App</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Add to App List</span>
                      </>
                    )}
                  </button>

                  {/* Verification if fee is required and unpaid */}
                  {!rest.onboardingFeePaid && rest.onboardingFeeAmount > 0 && (
                    <button
                      onClick={() => setVerifyingRestaurant(rest)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      Verify Fee
                    </button>
                  )}

                  {/* Activation / Suspension */}
                  {rest.status === 'active' ? (
                    <button
                      onClick={() => appStore.updateRestaurantStatus(rest.id, 'suspended')}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 text-rose-700 font-medium rounded-lg cursor-pointer"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => appStore.updateRestaurantStatus(rest.id, 'active')}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg cursor-pointer"
                    >
                      Activate
                    </button>
                  )}

                  {/* Delete / Remove */}
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${rest.name} from Apna Food marketplace?`)) {
                        appStore.deleteRestaurant(rest.id);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Delete Restaurant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM FEES & DYNAMIC CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Super Admin Fee Management & Policy Settings
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Adjust onboarding and per-order platform fees in real-time. Changes apply immediately to new orders and newly registered restaurant partners.
            </p>
          </div>

          {settingsSavedAlert && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Platform fees updated successfully! Changes are active in the system.</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Onboarding Fee Setting */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <label className="block font-bold text-stone-900">
                Restaurant Onboarding Registration Fee (PKR)
              </label>
              <p className="text-stone-500 text-[11px]">
                Currently set to <strong>PKR {appStore.platformSettings.restaurantOnboardingFee}</strong> (Zero registration promo). You can change this to any amount anytime.
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-stone-700">PKR</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={onboardingFeeInput}
                  onChange={(e) => setOnboardingFeeInput(parseFloat(e.target.value) || 0)}
                  className="w-40 p-2 bg-white border border-stone-300 rounded-lg font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setOnboardingFeeInput(0)}
                  className="px-2.5 py-1.5 text-[11px] bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg cursor-pointer"
                >
                  Set Free (0)
                </button>
              </div>
            </div>

            {/* Per-Order Platform Fee Setting */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <label className="block font-bold text-stone-900">
                Platform Service Fee per Completed Order (PKR)
              </label>
              <p className="text-stone-500 text-[11px]">
                Changed from PKR 10 to <strong>PKR {appStore.platformSettings.platformFeePerOrder} per delivered order</strong>. Charged to the restaurant only when an order is successfully completed.
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-stone-700">PKR</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={platformFeePerOrderInput}
                  onChange={(e) => setPlatformFeePerOrderInput(parseFloat(e.target.value) || 0)}
                  className="w-40 p-2 bg-white border border-stone-300 rounded-lg font-mono text-sm font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setPlatformFeePerOrderInput(5)}
                  className="px-2.5 py-1.5 text-[11px] bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg cursor-pointer"
                >
                  Reset to PKR 5
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePlatformSettings}
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save & Apply Platform Fee Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WEEKLY SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Weekly Restaurant Settlements
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Reconciles sales, platform fees (PKR {appStore.platformSettings.platformFeePerOrder}/order), digital prepaid amounts, and COD collections.
              </p>
            </div>

            {/* Run Settlement Tool */}
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={settlePeriodStart}
                onChange={(e) => setSettlePeriodStart(e.target.value)}
                className="p-1.5 border border-stone-300 rounded-lg text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={settlePeriodEnd}
                onChange={(e) => setSettlePeriodEnd(e.target.value)}
                className="p-1.5 border border-stone-300 rounded-lg text-xs"
              />
              <button
                onClick={handleRunWeeklySettlement}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Run Settlement Engine</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {appStore.settlements.map((st) => (
              <div
                key={st.id}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {st.settlementNumber}
                    </span>
                    <span className="font-semibold text-stone-700">
                      ({st.restaurantName})
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        st.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {st.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-stone-500 mt-1">
                    Period: {new Date(st.periodStart).toLocaleDateString()} — {new Date(st.periodEnd).toLocaleDateString()}
                  </div>

                  <div className="text-stone-600 mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Completed Orders: <strong>{st.eligibleCompletedOrdersCount}</strong></div>
                    <div>Gross Sales: <strong className="font-mono">PKR {st.grossSales}</strong></div>
                    <div>Platform Fees: <strong className="font-mono text-rose-600">PKR {st.totalPlatformFees}</strong></div>
                    <div>Digital/Platform Cash: <strong className="font-mono text-emerald-700">PKR {st.digitalPaymentsReceived + st.codCollectedByPlatformRiders}</strong></div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <div className="text-stone-500 text-[11px]">Net Payable to Restaurant:</div>
                    <div className="font-mono text-base font-bold text-emerald-800">
                      PKR {st.netPayableToRestaurant}
                    </div>
                  </div>

                  {st.status !== 'paid' ? (
                    <button
                      onClick={() => setPayoutSettlement(st)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      Disburse Payout
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-mono">
                      Paid: {st.paymentReference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Auditable Financial Ledger (Double-Entry)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Every transaction records immutable debits and credits with unique reference numbers and timestamps.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={ledgerFilterType}
                onChange={(e) => setLedgerFilterType(e.target.value)}
                className="p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              >
                <option value="ALL">All Entry Types</option>
                <option value="ONBOARDING_FEE_PAYMENT">Onboarding Fee Payment</option>
                <option value="PLATFORM_ORDER_FEE">Platform Order Fee</option>
                <option value="COD_COLLECTED_PLATFORM_RIDER">COD (Platform Rider)</option>
                <option value="COD_COLLECTED_RESTAURANT_RIDER">COD (Restaurant Rider)</option>
                <option value="CUSTOMER_DIGITAL_PAYMENT">Digital Prepaid</option>
                <option value="PLATFORM_DELIVERY_EXPENSE">Platform Delivery Expense</option>
                <option value="RESTAURANT_SETTLEMENT_PAYOUT">Settlement Payout</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2.5 px-3 font-semibold">Entry ID / Ref</th>
                  <th className="py-2.5 px-3 font-semibold">Entry Type</th>
                  <th className="py-2.5 px-3 font-semibold">Debit Account</th>
                  <th className="py-2.5 px-3 font-semibold">Credit Account</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount (PKR)</th>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLedgerEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/60 font-mono text-[11px]">
                    <td className="py-2 px-3 text-stone-900">
                      <div className="font-semibold">{e.referenceNumber}</div>
                      <div className="text-[10px] text-stone-400">{e.id}</div>
                    </td>
                    <td className="py-2 px-3 text-stone-700">
                      <span className="font-sans text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                        {e.entryType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-blue-800">{e.debitAccount}</td>
                    <td className="py-2 px-3 text-emerald-800">{e.creditAccount}</td>
                    <td className="py-2 px-3 text-right font-bold text-stone-900">
                      {e.amount.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-stone-500 font-sans text-[10px]">
                      {new Date(e.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DELIVERY ZONES */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Alipur Delivery Zones & Platform Funding Strategy
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure delivery fee charged to customer versus delivery expense compensated to rider.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {appStore.deliveryZones.map((z) => (
              <div
                key={z.id}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{z.name}</h4>
                  <p className="text-stone-500 text-[11px] mt-0.5">{z.areaDescription}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-stone-200">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Customer Delivery Charge:</span>
                    <span className="font-mono font-bold text-stone-900">PKR {z.customerDeliveryFee}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-600">Rider Compensation Expense:</span>
                    <span className="font-mono font-bold text-stone-900">PKR {z.platformDeliveryExpense}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-600">Funding Model:</span>
                    <span className={`font-semibold ${z.isPlatformFunded ? 'text-amber-700' : 'text-stone-700'}`}>
                      {z.isPlatformFunded ? 'Platform-Funded Subsidy' : 'Customer-Funded'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: MASTER ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-stone-900">Master Orders Board</h3>
          <div className="space-y-2">
            {appStore.orders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">{ord.orderNumber}</span>
                    <span className="text-stone-600">from {ord.restaurantName}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize bg-stone-200">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Customer: {ord.customerName} ({ord.customerPhone}) · {ord.deliveryArea}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-stone-900">PKR {ord.finalTotal}</div>
                  <div className="text-[10px] text-stone-400 uppercase font-mono">
                    Fee: PKR {ord.platformFeeAmount || 5}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Restaurant Modal */}
      {isAddingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Add New Restaurant Partner
            </h3>
            <p className="text-xs text-stone-500">
              Register a new food business into Apna Food. Super Admin can decide whether to immediately list it on the customer app.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Shinwari & BBQ"
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Owner Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Malik Naveed"
                  value={newRestOwner}
                  onChange={(e) => setNewRestOwner(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={newRestPhone}
                  onChange={(e) => setNewRestPhone(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Area / Landmark</label>
                <select
                  value={newRestArea}
                  onChange={(e) => setNewRestArea(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="Kutchery Chowk, Alipur">Kutchery Chowk, Alipur</option>
                  <option value="Seet Pur Road, Alipur">Seet Pur Road, Alipur</option>
                  <option value="Circular Road, Alipur">Circular Road, Alipur</option>
                  <option value="Khangarh Road, Alipur">Khangarh Road, Alipur</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Tehsil Complex"
                  value={newRestAddress}
                  onChange={(e) => setNewRestAddress(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Cuisines (comma separated)</label>
                <input
                  type="text"
                  value={newRestCuisines}
                  onChange={(e) => setNewRestCuisines(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <input
                  type="checkbox"
                  id="listCheckbox"
                  checked={newRestListed}
                  onChange={(e) => setNewRestListed(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="listCheckbox" className="font-semibold text-stone-800">
                  Immediately Show on Customer App
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setIsAddingRestaurant(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRestaurant}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Add Restaurant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Verification Modal */}
      {verifyingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Verify Onboarding Fee: {verifyingRestaurant.name}
            </h3>
            <p className="text-xs text-stone-600">
              Confirm receipt of onboarding fee. This action posts an auditable revenue transaction to the ledger and activates the restaurant.
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Settlement / Payment Channel</label>
                <select
                  value={onboardingPayMethod}
                  onChange={(e) => setOnboardingPayMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <option value="bank_transfer">HBL Bank Transfer / Cash Deposit</option>
                  <option value="jazzcash">JazzCash Merchant QR</option>
                  <option value="easypaisa">EasyPaisa Merchant</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Bank / Slip Reference Number *</label>
                <input
                  type="text"
                  placeholder="e.g. HBL-DEP-ALP-881920"
                  value={onboardingRefNumber}
                  onChange={(e) => setOnboardingRefNumber(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setVerifyingRestaurant(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOnboarding}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Approve & Post Ledger Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Payout Modal */}
      {payoutSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Disburse Weekly Payout: {payoutSettlement.restaurantName}
            </h3>
            <p className="text-xs text-stone-600">
              Disburse net settlement of <strong className="font-mono text-emerald-800">PKR {payoutSettlement.netPayableToRestaurant}</strong>. Enter the bank transfer / 1Link transaction reference.
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Bank Transaction Reference *</label>
                <input
                  type="text"
                  placeholder="e.g. 1LINK-FT-MEEZAN-99201"
                  value={settlementBankRef}
                  onChange={(e) => setSettlementBankRef(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setPayoutSettlement(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburseSettlement}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Mark Paid & Record in Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
