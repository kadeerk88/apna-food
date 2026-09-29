import React, { useState } from 'react';
import { appStore } from '../../services/store';
import { Rider, Order } from '../../types';
import {
  Bike,
  Navigation,
  MapPin,
  CheckCircle2,
  Banknote,
  Phone,
  Power,
  Package,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const RiderPortal: React.FC = () => {
  const currentRiderId = appStore.currentRiderId;
  const rider =
    appStore.riders.find((r) => r.id === currentRiderId) || appStore.riders[0];

  const [deliveryOTP, setDeliveryOTP] = useState('');
  const [cashCollectedInput, setCashCollectedInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'current_task' | 'history'>('current_task');

  // Find active orders assigned to this rider
  const assignedOrders = appStore.orders.filter(
    (o) =>
      o.riderId === rider.id &&
      ['rider_assigned', 'picked_up', 'out_for_delivery'].includes(o.status)
  );

  const activeOrder = assignedOrders[0];

  const deliveredOrders = appStore.orders.filter(
    (o) => o.riderId === rider.id && o.status === 'delivered'
  );

  const handleConfirmPickup = (order: Order) => {
    appStore.updateOrderStatus(
      order.id,
      'picked_up',
      `Order parcel picked up by rider ${rider.name} from kitchen`
    );
  };

  const handleStartTransit = (order: Order) => {
    appStore.updateOrderStatus(
      order.id,
      'out_for_delivery',
      `Rider ${rider.name} is on the road heading to customer address`
    );
  };

  const handleConfirmDelivery = (order: Order) => {
    if (order.paymentMethod === 'cod') {
      const amount = parseFloat(cashCollectedInput || order.finalTotal.toString());
      if (isNaN(amount) || amount < order.finalTotal) {
        alert(`Please verify full COD amount of PKR ${order.finalTotal} was collected from customer.`);
        return;
      }
    }

    appStore.updateOrderStatus(
      order.id,
      'delivered',
      `Successfully delivered to customer by rider ${rider.name}. Payment confirmed.`
    );
    setDeliveryOTP('');
    setCashCollectedInput('');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Rider Header Card & Switcher */}
      <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={rider.id}
                onChange={(e) => appStore.setCurrentRiderId(e.target.value)}
                className="font-bold text-lg text-stone-900 bg-transparent border-b border-dashed border-stone-400 focus:outline-none cursor-pointer"
              >
                {appStore.riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type === 'restaurant_rider' ? 'Model A: Restaurant Rider' : 'Model B: Platform Rider'})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-1 text-xs text-stone-500">
              {rider.vehicleType} · Plate: <strong className="font-mono text-stone-700">{rider.licensePlate}</strong> · Phone: {rider.phone}
            </div>
          </div>
        </div>

        {/* Online / Offline Status Button */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right text-xs">
            <div className="text-stone-500">Duty Status:</div>
            <div className="font-semibold text-stone-900">
              {rider.isOnline ? 'Online (Ready)' : 'Offline'}
            </div>
          </div>

          <button
            onClick={() => appStore.toggleRiderOnline(rider.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              rider.isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{rider.isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-stone-500">Deliveries Completed</span>
          <div className="font-mono text-lg font-bold text-stone-900 mt-1">
            {rider.totalDeliveries}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-stone-500">COD Cash in Pocket</span>
          <div className="font-mono text-lg font-bold text-emerald-700 mt-1">
            PKR {rider.cashInHand}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-stone-500">Rider Model</span>
          <div className="font-semibold text-stone-900 mt-1">
            {rider.type === 'restaurant_rider' ? 'Restaurant Fleet' : 'Platform Fleet'}
          </div>
        </div>
      </div>

      {/* ACTIVE TASK VIEW */}
      {!activeOrder ? (
        <div className="bg-white rounded-xl p-12 text-center border border-stone-200">
          <Navigation className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-stone-900">
            No Active Delivery Assignment
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Keep your duty status Online to receive new pickup alerts from kitchens in Alipur.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-xs text-stone-500">Active Task</span>
              <h2 className="text-base font-bold text-stone-900">
                Order #{activeOrder.orderNumber}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 font-mono">STATUS</span>
              <div className="text-xs font-bold text-amber-700 capitalize">
                {activeOrder.status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Route details: Step 1 Pickup vs Step 2 Dropoff */}
          <div className="space-y-4 text-xs">
            {/* Pickup Location */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  1. Pickup: {activeOrder.restaurantName}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {activeOrder.status === 'rider_assigned' ? 'Awaiting Pickup' : 'Picked Up'}
                </span>
              </div>
              <div className="text-stone-600 pl-5">
                {activeOrder.restaurantAddress}
              </div>
              <div className="text-stone-500 pl-5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{activeOrder.restaurantPhone}</span>
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  2. Dropoff: {activeOrder.customerName}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {activeOrder.deliveryArea}
                </span>
              </div>
              <div className="text-stone-600 pl-5">
                {activeOrder.deliveryAddress}
              </div>
              <div className="text-stone-500 pl-5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{activeOrder.customerPhone}</span>
              </div>
              {activeOrder.customerNote && (
                <div className="mt-2 text-stone-600 italic bg-white p-2 rounded border border-stone-200">
                  Note: "{activeOrder.customerNote}"
                </div>
              )}
            </div>
          </div>

          {/* Payment & COD Verification Section */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-stone-900">
                Payment Collection Mode:
              </span>
              <span className="font-bold uppercase text-stone-900">
                {activeOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid Digital'}
              </span>
            </div>

            {activeOrder.paymentMethod === 'cod' ? (
              <div className="space-y-2 pt-1 border-t border-amber-200">
                <div className="flex justify-between items-center text-amber-950 font-bold">
                  <span>Exact Cash to Collect:</span>
                  <span className="font-mono text-sm text-emerald-700">
                    PKR {activeOrder.finalTotal}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    Confirm Cash Received Amount (PKR)
                  </label>
                  <input
                    type="number"
                    defaultValue={activeOrder.finalTotal}
                    onChange={(e) => setCashCollectedInput(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="text-emerald-700 font-medium">
                Customer has already paid digitally via {activeOrder.paymentMethod.toUpperCase()} (Ref: {activeOrder.paymentReference || 'VERIFIED'}). Do NOT collect cash.
              </div>
            )}
          </div>

          {/* Action Step Buttons */}
          <div className="space-y-2 pt-2">
            {activeOrder.status === 'rider_assigned' && (
              <button
                onClick={() => handleConfirmPickup(activeOrder)}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Package className="w-4 h-4" />
                <span>Confirm Food Pickup from Kitchen</span>
              </button>
            )}

            {activeOrder.status === 'picked_up' && (
              <button
                onClick={() => handleStartTransit(activeOrder)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Start Transit (Out for Delivery)</span>
              </button>
            )}

            {activeOrder.status === 'out_for_delivery' && (
              <button
                onClick={() => handleConfirmDelivery(activeOrder)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery to Customer Doorstep</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delivered orders past history */}
      {deliveredOrders.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Today's Completed Deliveries ({deliveredOrders.length})
          </h3>
          <div className="space-y-2 text-xs">
            {deliveredOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center"
              >
                <div>
                  <span className="font-mono font-bold text-stone-900">
                    {ord.orderNumber}
                  </span>
                  <div className="text-stone-500 text-[11px]">
                    {ord.restaurantName} → {ord.deliveryArea}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-stone-800">
                    PKR {ord.finalTotal}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                    Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
