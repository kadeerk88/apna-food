import React, { useState } from 'react';
import {
  Restaurant,
  MenuItem,
  Order,
  PaymentMethod,
  OrderStatus,
} from '../../types';
import { appStore } from '../../services/store';
import { HERO_BANNER_IMAGE } from '../../data/initialData';
import { InteractiveAlipurMap } from './InteractiveAlipurMap';
import {
  Search,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  ArrowLeft,
  X,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface CustomerPortalProps {
  onOpenCart: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onOpenCart }) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'explore' | 'track_order' | 'history'>('explore');

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [itemInstructions, setItemInstructions] = useState('');

  const restaurants = appStore.restaurants.filter(
    (r) => r.status === 'active' && r.isListedOnApp !== false
  );
  const allOrders = appStore.orders;
  const activeOrder = allOrders.find((o) => o.id === appStore.activeOrderIdForTracking) || allOrders[0];

  // Filtering
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisines.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === 'All' || r.cuisines.includes(selectedCuisine);
    return matchesSearch && matchesCuisine;
  });

  const cuisinesList = [
    'All',
    'Desi Karahi',
    'Biryani',
    'Shinwari',
    'Shawarma',
    'Fast Food',
    'Desi Nashta',
  ];

  const handleOpenCustomize = (item: MenuItem) => {
    if (item.optionGroups && item.optionGroups.length > 0) {
      setCustomizingItem(item);
      // Pre-select first required option
      const defaults: any[] = [];
      item.optionGroups.forEach((g) => {
        if (g.required && g.options.length > 0) {
          defaults.push({
            groupId: g.id,
            groupName: g.name,
            optionId: g.options[0].id,
            optionName: g.options[0].name,
            priceDelta: g.options[0].priceDelta,
          });
        }
      });
      setSelectedOptions(defaults);
      setItemInstructions('');
    } else {
      appStore.addToCart(item, []);
    }
  };

  const handleConfirmCustomize = () => {
    if (customizingItem) {
      appStore.addToCart(customizingItem, selectedOptions, itemInstructions);
      setCustomizingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-bar for Customer */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'explore'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Explore Restaurants
          </button>
          <button
            onClick={() => setActiveTab('track_order')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'track_order'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Active Order</span>
            {activeOrder && activeOrder.status !== 'delivered' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Order History
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          <span>Delivering to: <strong className="text-stone-800">Alipur City, Punjab</strong></span>
        </div>
      </div>

      {/* TAB 1: EXPLORE / CATALOG */}
      {activeTab === 'explore' && !selectedRestaurant && (
        <div className="space-y-8">
          {/* Hero Banner Section */}
          <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white min-h-[220px] sm:min-h-[260px] flex items-center shadow-md">
            <img
              src={HERO_BANNER_IMAGE}
              alt="Alipur Food Feast"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
              <div className="text-xs font-semibold tracking-wide text-amber-400 uppercase">
                Apna Food · Alipur, Punjab
              </div>
              <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Apna Food — Hot, Fresh Meals to Your Doorstep
              </h1>
              <p className="mt-2 text-sm text-stone-300">
                Order from premier local kitchens across Alipur (Kutchery Chowk, Seet Pur Road, Circular Road) with live rider tracking and Cash on Delivery.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-stone-300">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified Local Kitchens
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-amber-400" />
                  Fast Local Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Search & Cuisines Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search restaurants, dishes (Karahi, Biryani, Shawarma), or areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              />
            </div>

            {/* Segmented Cuisine Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {cuisinesList.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCuisine === c
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Restaurant Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">
                Featured Restaurants in Alipur ({filteredRestaurants.length})
              </h2>
              <span className="text-xs text-stone-500">
                Strict 1 restaurant per order rule enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* Image container */}
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-xs font-semibold text-stone-900 flex items-center gap-1 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{restaurant.rating}</span>
                      <span className="text-stone-400 font-normal">({restaurant.reviewCount})</span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-xs font-medium text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{restaurant.deliveryTimeEstimate}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                        {restaurant.name}
                      </h3>
                      <div className="mt-1 text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                        <span className="truncate">{restaurant.area}</span>
                      </div>

                      {/* Clean unboxed cuisines metadata */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-600 flex-wrap">
                        {restaurant.cuisines.map((c, idx) => (
                          <React.Fragment key={c}>
                            <span>{c}</span>
                            {idx < restaurant.cuisines.length - 1 && (
                              <span className="text-stone-300" aria-hidden="true">·</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500">
                        Min. Order: <strong className="text-stone-800">PKR {restaurant.minOrder}</strong>
                      </span>
                      <span className="text-amber-700 font-medium flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        View Menu <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Restaurant Partner Promotional Banner */}
            <div className="mt-10 p-6 bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-stone-700 shadow-sm">
              <div>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                  Grow Your Business with Apna Food
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Own a Restaurant or Dhaba in Alipur?
                </h3>
                <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
                  Join Apna Food today with <strong>PKR 0 Onboarding Registration Fee</strong> and reach thousands of hungry customers across Alipur with transparent weekly payouts and low PKR 5 per-order platform fee.
                </p>
              </div>
              <button
                onClick={() => appStore.setRole('restaurant_admin')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Go to Restaurant Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT MENU VIEW */}
      {activeTab === 'explore' && selectedRestaurant && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedRestaurant(null)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Restaurants</span>
          </button>

          {/* Restaurant Header Banner */}
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedRestaurant.imageUrl}
                alt={selectedRestaurant.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-stone-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {selectedRestaurant.name}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold text-stone-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {selectedRestaurant.rating} ({selectedRestaurant.reviewCount} reviews)
                  </span>
                  <span>·</span>
                  <span>{selectedRestaurant.deliveryTimeEstimate}</span>
                  <span>·</span>
                  <span>{selectedRestaurant.area}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-600">
                  {selectedRestaurant.cuisines.join(' · ')}
                </div>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-xs text-stone-500">Minimum Order</div>
              <div className="font-mono text-base font-bold text-stone-900">
                PKR {selectedRestaurant.minOrder}
              </div>
            </div>
          </div>

          {/* Menu Items by Category */}
          <div className="space-y-8">
            {appStore.categories
              .filter((c) => c.restaurantId === selectedRestaurant.id)
              .map((category) => {
                const categoryItems = appStore.menuItems.filter(
                  (i) => i.categoryId === category.id && i.isAvailable
                );
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-4">
                    <h2 className="text-lg font-bold text-stone-900 pb-2 border-b border-stone-200">
                      {category.name}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-4 border border-stone-200 flex justify-between gap-4 hover:border-amber-200 transition-colors"
                        >
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-stone-900">
                                  {item.name}
                                </h3>
                                {item.isPopular && (
                                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="font-mono text-sm font-bold text-stone-900">
                                PKR {item.price}
                              </span>
                              <button
                                onClick={() => handleOpenCustomize(item)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>

                          {item.imageUrl && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: TRACK ACTIVE ORDER & ALIPUR MAP */}
      {activeTab === 'track_order' && (
        <div className="space-y-6">
          {!activeOrder ? (
            <div className="bg-white rounded-xl p-12 text-center border border-stone-200">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="mt-3 text-base font-bold text-stone-900">No Active Order</h3>
              <p className="mt-1 text-xs text-stone-500">
                You haven't placed an order yet. Browse Alipur's top restaurants and order delicious food!
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                Explore Restaurants
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map & Live Progress Visualizer (2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs text-stone-500">Order Number</span>
                      <h2 className="text-base font-bold text-stone-900">
                        {activeOrder.orderNumber}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-500">Estimated Delivery</span>
                      <div className="font-mono text-sm font-bold text-amber-700">
                        {activeOrder.estimatedDeliveryTime || '25-35 min'}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Alipur Route Map */}
                  <InteractiveAlipurMap order={activeOrder} />

                  {/* Stepper Progress Indicator */}
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-3">
                      <span>Order Progression</span>
                      <span className="text-amber-700 capitalize">
                        {activeOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center">
                      {[
                        { key: 'placed', label: 'Placed' },
                        { key: 'accepted', label: 'Accepted' },
                        { key: 'preparing', label: 'Cooking' },
                        { key: 'out_for_delivery', label: 'In Transit' },
                        { key: 'delivered', label: 'Delivered' },
                      ].map((step, idx) => {
                        const statusOrder: OrderStatus[] = [
                          'placed',
                          'accepted',
                          'preparing',
                          'ready_for_pickup',
                          'rider_assigned',
                          'picked_up',
                          'out_for_delivery',
                          'delivered',
                        ];
                        const currentIndex = statusOrder.indexOf(activeOrder.status);
                        const stepIndex = statusOrder.indexOf(step.key as OrderStatus);
                        const isDone = currentIndex >= stepIndex;
                        const isCurrent = activeOrder.status === step.key;

                        return (
                          <div key={step.key} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                isDone
                                  ? 'bg-emerald-600'
                                  : isCurrent
                                  ? 'bg-amber-500'
                                  : 'bg-stone-200'
                              }`}
                            />
                            <div
                              className={`text-[11px] truncate ${
                                isDone ? 'text-stone-900 font-medium' : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Audit Status Log */}
                <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
                  <h3 className="text-xs font-bold text-stone-900 mb-3 uppercase tracking-wider">
                    Live Status History
                  </h3>
                  <div className="space-y-3">
                    {activeOrder.statusHistory.map((sh, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-stone-900 capitalize">
                            {sh.status.replace(/_/g, ' ')}
                          </div>
                          <div className="text-stone-600 text-[11px]">{sh.note}</div>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(sh.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary & Details Card (1 Col) */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
                    Order Details
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="text-stone-500">Restaurant:</div>
                    <div className="font-semibold text-stone-900">
                      {activeOrder.restaurantName}
                    </div>
                    <div className="text-stone-500 mt-2">Delivery Address:</div>
                    <div className="font-medium text-stone-800">
                      {activeOrder.deliveryAddress}
                    </div>
                    {activeOrder.customerNote && (
                      <div className="mt-1 p-2 bg-stone-50 rounded text-stone-600 italic">
                        "{activeOrder.customerNote}"
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                    <div className="font-semibold text-stone-900">Items Ordered:</div>
                    {activeOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-stone-700">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-mono">PKR {it.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Bill Summary */}
                  <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Food Subtotal</span>
                      <span className="font-mono">PKR {activeOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>
                        Delivery Fee ({activeOrder.deliveryFunding === 'platform_funded' ? 'Platform Subsidized' : 'Standard'})
                      </span>
                      <span className="font-mono">PKR {activeOrder.deliveryCharge}</span>
                    </div>
                    {activeOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Promo Discount ({activeOrder.couponCode})</span>
                        <span className="font-mono">- PKR {activeOrder.discountAmount}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
                      <span>Total Amount</span>
                      <span className="font-mono text-amber-700">
                        PKR {activeOrder.finalTotal}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 pt-1">
                      Payment:{' '}
                      <strong className="text-stone-800 uppercase">
                        {activeOrder.paymentMethod}
                      </strong>{' '}
                      ({activeOrder.paymentStatus})
                    </div>
                  </div>

                  {/* Cancellation option if order is still placed */}
                  {activeOrder.status === 'placed' && (
                    <button
                      onClick={() =>
                        appStore.updateOrderStatus(
                          activeOrder.id,
                          'cancelled',
                          'Order cancelled by customer before kitchen accepted',
                          { cancellationReason: 'Changed mind / mistaken order' }
                        )
                      }
                      className="w-full py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDER HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Your Past Orders in Alipur</h2>
          <div className="space-y-3">
            {allOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-xl p-4 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-2xs transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {ord.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.status === 'rejected' || ord.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-stone-600">
                    {ord.restaurantName} · {ord.items.length} items
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                    {new Date(ord.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-stone-900">
                      PKR {ord.finalTotal}
                    </div>
                    <div className="text-[10px] text-stone-500 uppercase">
                      {ord.paymentMethod}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      appStore.setActiveOrderForTracking(ord.id);
                      setActiveTab('track_order');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Customize: {customizingItem.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Base Price: PKR {customizingItem.price}
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {customizingItem.optionGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
                    <span>{group.name}</span>
                    {group.required && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </label>

                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions.some((so) => so.optionId === opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            // If single select
                            const filtered = selectedOptions.filter((so) => so.groupId !== group.id);
                            setSelectedOptions([
                              ...filtered,
                              {
                                groupId: group.id,
                                groupName: group.name,
                                optionId: opt.id,
                                optionName: opt.name,
                                priceDelta: opt.priceDelta,
                              },
                            ]);
                          }}
                          className={`p-2.5 rounded-lg border text-xs flex justify-between items-center cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/50 text-stone-900 font-medium'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="font-mono text-stone-500">
                            {opt.priceDelta > 0 ? `+ PKR ${opt.priceDelta}` : 'Free'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-800">
                  Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. less oil, extra green chilies, separate packaging"
                  value={itemInstructions}
                  onChange={(e) => setItemInstructions(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setCustomizingItem(null)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCustomize}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
