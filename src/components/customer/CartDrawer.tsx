import React, { useState } from 'react';
import { appStore } from '../../services/store';
import { PaymentMethod } from '../../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  Banknote,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const cart = appStore.cart;
  const restaurant = appStore.restaurants.find((r) => r.id === cart.restaurantId);

  // Form states
  const [customerName, setCustomerName] = useState('Muhammad Hamza');
  const [customerPhone, setCustomerPhone] = useState('+92 302 9182341');
  const [deliveryArea, setDeliveryArea] = useState('Kutchery Chowk, Alipur');
  const [deliveryAddress, setDeliveryAddress] = useState('House 14, Street 2, Near Eidgah Ground, Alipur');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const zone = appStore.deliveryZones[0];
  const deliveryCharge = zone?.customerDeliveryFee || 40;

  let discount = 0;
  if (appliedCoupon === 'ALIPUR100' && subtotal >= 500) {
    discount = 100;
  } else if (appliedCoupon === 'PEHLIORDER') {
    discount = 50;
  }

  const finalTotal = Math.max(0, subtotal + deliveryCharge - discount);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'ALIPUR100') {
      if (subtotal < 500) {
        setErrorMessage('Coupon ALIPUR100 requires minimum order of PKR 500');
        return;
      }
      setAppliedCoupon('ALIPUR100');
      setErrorMessage(null);
    } else if (code === 'PEHLIORDER') {
      setAppliedCoupon('PEHLIORDER');
      setErrorMessage(null);
    } else {
      setErrorMessage('Invalid coupon code. Try ALIPUR100 or PEHLIORDER');
    }
  };

  const handleCheckout = () => {
    if (!customerName || !customerPhone || !deliveryAddress) {
      setErrorMessage('Please provide customer name, phone, and complete delivery address in Alipur');
      return;
    }
    if (cart.items.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = appStore.placeOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryArea,
        customerNote,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
      });

      setIsSubmitting(false);
      onClose();
      onOrderSuccess(order.id);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to place order');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Your Food Order</h2>
            {restaurant && (
              <p className="text-xs text-stone-500">From {restaurant.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {cart.items.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <p className="text-sm">Your basket is currently empty.</p>
              <p className="text-xs mt-1">Select items from any restaurant menu to start.</p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-stone-900">{item.name}</div>
                      <div className="font-mono text-stone-600 mt-0.5">
                        PKR {item.price} each
                      </div>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[11px] text-amber-700 mt-1">
                          {item.selectedOptions.map((o) => o.optionName).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-stone-200">
                      <button
                        onClick={() => appStore.updateCartQuantity(item.id, -1)}
                        className="p-0.5 hover:text-amber-700 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-semibold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => appStore.updateCartQuantity(item.id, 1)}
                        className="p-0.5 hover:text-amber-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-mono font-bold text-stone-900 min-w-[60px] text-right">
                      PKR {item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Delivery Details in Alipur
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-stone-600 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">Phone Number (with OTP login)</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">Delivery Area</label>
                    <select
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="Kutchery Chowk, Alipur">Kutchery Chowk / Main Bazaar</option>
                      <option value="Seet Pur Road, Alipur">Seet Pur Road / Civil Hospital</option>
                      <option value="Circular Road, Alipur">Circular Road / Girls College</option>
                      <option value="Khangarh Road, Alipur">Khangarh Road / Purana Lari Adda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">Street Address & Landmark</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">Order Note / Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Ring bell, do not honk"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Payment Method
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>Cash on Delivery</div>
                      <div className="text-[10px] text-stone-500 font-normal">Pay cash to rider</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                      paymentMethod === 'jazzcash'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div>JazzCash / Digital</div>
                      <div className="text-[10px] text-stone-500 font-normal">Instant digital pay</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon / Promo Code */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. ALIPUR100)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs uppercase font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-1.5 text-[11px] text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Coupon {appliedCoupon} applied (- PKR {discount})</span>
                  </div>
                )}
              </div>

              {/* Error prompt */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Price Breakdown and CTA */}
        {cart.items.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">PKR {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge (Platform Subsidized)</span>
                <span className="font-mono">PKR {deliveryCharge}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">- PKR {discount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
                <span>Total Due</span>
                <span className="font-mono text-amber-700">PKR {finalTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm Order & Deliver'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
