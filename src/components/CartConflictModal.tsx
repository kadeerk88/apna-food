import React from 'react';
import { appStore } from '../services/store';
import { AlertCircle, Trash2, ArrowRight } from 'lucide-react';

interface CartConflictModalProps {
  isOpen: boolean;
  newRestaurantName?: string;
  onResolve: (replace: boolean) => void;
}

export const CartConflictModal: React.FC<CartConflictModalProps> = ({
  isOpen,
  newRestaurantName,
  onResolve,
}) => {
  if (!isOpen) return null;

  const currentRest = appStore.restaurants.find((r) => r.id === appStore.cart.restaurantId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-900">
              Replace Cart Items?
            </h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              Your cart currently contains food from{' '}
              <span className="font-semibold text-stone-900">
                {currentRest?.name || 'another restaurant'}
              </span>
              . Each delivery order can only be placed with a single restaurant in Alipur.
            </p>
            <p className="mt-2 text-xs text-stone-500">
              Do you want to discard your current cart and start a new order with{' '}
              <span className="font-semibold text-stone-800">
                {newRestaurantName || 'this restaurant'}
              </span>
              ?
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => onResolve(false)}
            className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Keep Current Order
          </button>
          <button
            onClick={() => onResolve(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard & Replace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
