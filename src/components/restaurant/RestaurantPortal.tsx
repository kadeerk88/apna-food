import React, { useState } from 'react';
import { appStore } from '../../services/store';
import {
  Restaurant,
  MenuItem,
  Order,
  OrderStatus,
  Rider,
} from '../../types';
import {
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChefHat,
  Bike,
  Package,
  FileText,
  DollarSign,
  Plus,
  Power,
  ChevronDown,
  Download,
} from 'lucide-react';

export const RestaurantPortal: React.FC = () => {
  const currentRestaurantId = appStore.currentRestaurantId;
  const restaurant =
    appStore.restaurants.find((r) => r.id === currentRestaurantId) ||
    appStore.restaurants[0];

  const [activeTab, setActiveTab] = useState<'live_orders' | 'menu' | 'financials' | 'settings'>('live_orders');
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [assigningRiderOrder, setAssigningRiderOrder] = useState<Order | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');

  // New item modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  // Orders for this restaurant only (Strict restaurant isolation)
  const restaurantOrders = appStore.orders.filter((o) => o.restaurantId === restaurant.id);
  const pendingOrders = restaurantOrders.filter((o) => o.status === 'placed');
  const activeOrders = restaurantOrders.filter(
    (o) => !['delivered', 'rejected', 'cancelled'].includes(o.status)
  );
  const completedOrders = restaurantOrders.filter((o) => o.status === 'delivered');

  // Available riders (Restaurant riders + Platform riders)
  const restaurantRiders = appStore.riders.filter(
    (r) => r.restaurantId === restaurant.id || r.type === 'platform_rider'
  );

  // Financial summary
  const totalCompletedSales = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalPlatformFeesOwed = completedOrders.reduce(
    (sum, o) => sum + (o.platformFeeAmount || appStore.platformSettings.platformFeePerOrder || 5),
    0
  );
  const codCollectedOwnRiders = completedOrders
    .filter((o) => o.paymentMethod === 'cod' && o.riderType === 'restaurant_rider')
    .reduce((sum, o) => sum + o.finalTotal, 0);

  // Settlements for this restaurant
  const settlements = appStore.settlements.filter((s) => s.restaurantId === restaurant.id);

  const handleAcceptOrder = (orderId: string) => {
    appStore.updateOrderStatus(orderId, 'accepted', 'Kitchen accepted order. Cooking started.');
  };

  const handleStartPreparing = (orderId: string) => {
    appStore.updateOrderStatus(orderId, 'preparing', 'Food is currently on stove / grill.');
  };

  const handleMarkReady = (orderId: string) => {
    appStore.updateOrderStatus(orderId, 'ready_for_pickup', 'Food is packed and ready for pickup.');
  };

  const handleConfirmReject = () => {
    if (!rejectingOrder) return;
    if (!rejectionReasonText.trim()) {
      alert('A rejection reason is mandatory by platform policy.');
      return;
    }
    appStore.updateOrderStatus(
      rejectingOrder.id,
      'rejected',
      `Rejected by restaurant: ${rejectionReasonText}`,
      { rejectionReason: rejectionReasonText }
    );
    setRejectingOrder(null);
    setRejectionReasonText('');
  };

  const handleConfirmRiderAssignment = () => {
    if (!assigningRiderOrder || !selectedRiderId) return;
    appStore.updateOrderStatus(
      assigningRiderOrder.id,
      'rider_assigned',
      'Rider assigned for delivery',
      { riderId: selectedRiderId }
    );
    setAssigningRiderOrder(null);
    setSelectedRiderId('');
  };

  const handleCreateMenuItem = () => {
    if (!newItemName || !newItemPrice || !newItemCategory) {
      alert('Please provide item name, price, and category');
      return;
    }
    appStore.addMenuItem({
      restaurantId: restaurant.id,
      categoryId: newItemCategory,
      name: newItemName,
      description: newItemDesc,
      price: parseFloat(newItemPrice) || 0,
      imageUrl: restaurant.imageUrl,
      isAvailable: true,
    });
    setIsAddingItem(false);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Restaurant Selector & Onboarding Status */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={restaurant.id}
                onChange={(e) => appStore.setCurrentRestaurantId(e.target.value)}
                className="font-bold text-lg text-stone-900 bg-transparent border-b border-dashed border-stone-400 focus:outline-none cursor-pointer"
              >
                {appStore.restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                  restaurant.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {restaurant.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="mt-1 text-xs text-stone-500">
              {restaurant.address} · Owner: <strong>{restaurant.ownerName}</strong> ({restaurant.phone})
            </div>
          </div>
        </div>

        {/* Status indicator & Open/Close Toggle */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="text-right text-xs">
            <div className="text-stone-500">Store Status:</div>
            <div className="font-semibold text-stone-900">
              {restaurant.isOpen ? 'Accepting Orders' : 'Temporarily Closed'}
            </div>
          </div>

          <button
            onClick={() => appStore.toggleRestaurantOpen(restaurant.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              restaurant.isOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{restaurant.isOpen ? 'Open' : 'Closed'}</span>
          </button>
        </div>
      </div>

      {/* Onboarding Notice if Pending */}
      {restaurant.status !== 'active' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-semibold">Onboarding Status: Pending Super Admin Approval</strong>
              Registration fee is currently <strong>PKR {restaurant.onboardingFeeAmount}</strong> (Free Launch Promotion). Once approved by Super Admin, your restaurant will be listed on the customer app.
            </div>
          </div>
          <div className="font-mono font-bold text-amber-900">
            Fee: PKR {restaurant.onboardingFeeAmount}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveTab('live_orders')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'live_orders'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Live Kitchen Orders</span>
          {pendingOrders.length > 0 && (
            <span className="bg-amber-500 text-stone-900 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingOrders.length} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Menu & Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financials & Weekly Settlement</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeTab === 'live_orders' && (
        <div className="space-y-6">
          {/* Incoming orders queue alert */}
          {pendingOrders.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>You have {pendingOrders.length} new incoming order(s) waiting for kitchen confirmation!</span>
              </div>
              <span className="text-[10px] text-amber-700 uppercase tracking-wider font-mono">Real-time alert</span>
            </div>
          )}

          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-stone-200">
              <ChefHat className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="mt-3 text-sm font-bold text-stone-900">No Active Kitchen Orders</h3>
              <p className="mt-1 text-xs text-stone-500">
                New customer orders from Alipur will ring and appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-stone-900">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            order.status === 'placed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-stone-500">
                        Placed by: <strong className="text-stone-800">{order.customerName}</strong> ({order.customerPhone})
                      </div>
                      <div className="text-xs text-stone-500">
                        Area: {order.deliveryArea}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-stone-900">
                        PKR {order.subtotal}
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase font-mono">
                        Payment: {order.paymentMethod}
                      </div>
                    </div>
                  </div>

                  {/* Customer Delivery Note */}
                  {order.customerNote && (
                    <div className="p-2.5 bg-stone-50 rounded-lg text-xs text-stone-600 border border-stone-200">
                      <strong>Customer Note:</strong> {order.customerNote}
                    </div>
                  )}

                  {/* Items to prepare */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs">
                    <div className="font-semibold text-stone-800">Kitchen Checklist:</div>
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-stone-700">
                        <span>
                          <strong className="font-mono">{it.quantity}x</strong> {it.name}
                        </span>
                        <span className="font-mono">PKR {it.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  {/* Rider Assignment Info */}
                  <div className="pt-2 border-t border-stone-100 text-xs flex items-center justify-between text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        Rider: {order.riderName ? <strong>{order.riderName}</strong> : <span className="text-stone-400">Not assigned</span>}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 capitalize">
                      {order.riderType?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Action State Buttons */}
                  <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                    {order.status === 'placed' && (
                      <>
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => setRejectingOrder(order)}
                          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {order.status === 'accepted' && (
                      <button
                        onClick={() => handleStartPreparing(order.id)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Mark Preparing (Cooking)</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleMarkReady(order.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {order.status === 'ready_for_pickup' && !order.riderId && (
                      <button
                        onClick={() => setAssigningRiderOrder(order)}
                        className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Dispatch / Assign Rider</span>
                      </button>
                    )}

                    {['rider_assigned', 'picked_up', 'out_for_delivery'].includes(order.status) && (
                      <div className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium text-center">
                        Rider handling delivery in transit
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU CATALOG */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Menu Items for {restaurant.name}
            </h2>
            <button
              onClick={() => {
                const cats = appStore.categories.filter((c) => c.restaurantId === restaurant.id);
                setNewItemCategory(cats[0]?.id || '');
                setIsAddingItem(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="space-y-2">
            {appStore.menuItems
              .filter((i) => i.restaurantId === restaurant.id)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 border border-stone-200 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <div className="font-bold text-stone-900">{item.name}</div>
                      <div className="text-stone-500 text-[11px] line-clamp-1">
                        {item.description}
                      </div>
                      <div className="font-mono font-semibold text-stone-800 mt-0.5">
                        PKR {item.price}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Unavailable'}
                    </span>

                    <button
                      onClick={() =>
                        appStore.updateMenuItemAvailability(item.id, !item.isAvailable)
                      }
                      className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md cursor-pointer"
                    >
                      Toggle Availability
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIALS & SETTLEMENTS */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">Total Completed Sales</span>
              <div className="mt-1 font-mono text-xl font-bold text-stone-900">
                PKR {totalCompletedSales}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                {completedOrders.length} eligible delivered orders
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">
                Platform Order Fees (PKR {appStore.platformSettings.platformFeePerOrder}/order)
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-rose-600">
                PKR {totalPlatformFeesOwed}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                Fee applies only on successfully completed orders
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500">COD in Restaurant Cash Register</span>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-700">
                PKR {codCollectedOwnRiders}
              </div>
              <div className="mt-1 text-[11px] text-stone-400">
                Collected by your own restaurant riders
              </div>
            </div>
          </div>

          {/* Weekly Settlement Statements */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Weekly Settlement Statements
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Platform reconciles gross sales, PKR 10 platform fees, digital payments, and rider COD
                </p>
              </div>
            </div>

            {settlements.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No settlement statement generated for this period yet. Super Admin generates settlements weekly.
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">
                          {st.settlementNumber}
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
                      <div className="text-stone-600 mt-0.5">
                        {st.eligibleCompletedOrdersCount} completed orders · Platform Fees: PKR {st.totalPlatformFees}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-stone-500">Net Payable to Restaurant:</div>
                      <div className="font-mono text-base font-bold text-emerald-800">
                        PKR {st.netPayableToRestaurant}
                      </div>
                      {st.paymentReference && (
                        <div className="text-[10px] text-stone-400 font-mono">
                          Ref: {st.paymentReference}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal (Enforces mandatory rejection reason) */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900">
              Reject Order #{rejectingOrder.orderNumber}
            </h3>
            <p className="mt-1 text-xs text-stone-600">
              By platform policy, restaurants must provide an official reason for rejection so the customer can be notified immediately.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-stone-800">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Kitchen overwhelmed during rush, out of key fresh meat ingredients, closing early..."
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rider Assignment Modal */}
      {assigningRiderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900">
              Dispatch Rider for #{assigningRiderOrder.orderNumber}
            </h3>
            <p className="mt-1 text-xs text-stone-600">
              Choose between your own restaurant riders or request an active Alipur Food platform rider.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-stone-800">
                Select Available Rider
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {restaurantRiders.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRiderId(r.id)}
                    className={`p-2.5 rounded-lg border text-xs flex justify-between items-center cursor-pointer transition-colors ${
                      selectedRiderId === r.id
                        ? 'border-amber-600 bg-amber-50 text-stone-900 font-semibold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {r.type === 'restaurant_rider' ? 'Restaurant Own Rider' : 'Alipur Platform Fleet'} · {r.vehicleType}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {r.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setAssigningRiderOrder(null)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRiderAssignment}
                disabled={!selectedRiderId}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Assign & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Add New Dish</h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Ginger Handi"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Price (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 950"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  {appStore.categories
                    .filter((c) => c.restaurantId === restaurant.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Boneless chicken cooked with fresh julienne ginger"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMenuItem}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Save Dish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
