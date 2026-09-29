import React, { useState } from 'react';
import { UserRole } from '../types';
import { appStore } from '../services/store';
import { APNA_FOOD_LOGO } from '../data/initialData';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  Smartphone,
  Monitor,
  Code2,
  CheckCircle2,
  ChevronDown,
  ArrowLeft,
  MapPin,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  viewMode: 'desktop_web' | 'mobile_app';
  cartCount: number;
  onOpenCart: () => void;
  onOpenTests: () => void;
  onOpenBackendDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  viewMode,
  cartCount,
  onOpenCart,
  onOpenTests,
  onOpenBackendDocs,
}) => {
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  // Non-customer portal view: display dedicated portal navigation with clean exit back to customer storefront
  if (currentRole !== 'customer') {
    return (
      <header className="sticky top-0 z-40 bg-stone-900 text-white border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => appStore.setRole('customer')}
              className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Apna Food Customer App</span>
            </button>

            <div className="h-4 w-px bg-stone-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <img
                src={APNA_FOOD_LOGO}
                alt="Apna Food"
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/50"
              />
              <span className="text-sm font-bold text-white hidden md:inline">
                Apna Food
              </span>
              <span className="text-xs text-amber-400 font-medium">
                {currentRole === 'restaurant_admin' && '— Restaurant Management Portal'}
                {currentRole === 'rider' && '— Rider Delivery Terminal'}
                {currentRole === 'super_admin' && '— Central Super Admin Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport switch */}
            <div className="hidden md:flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700 text-stone-400">
              <button
                onClick={() => appStore.setViewMode('desktop_web')}
                title="Desktop Web Mode"
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'desktop_web' ? 'bg-stone-700 text-white shadow-xs' : 'hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => appStore.setViewMode('mobile_app')}
                title="Mobile Device Shell"
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'mobile_app' ? 'bg-stone-700 text-white shadow-xs' : 'hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Switcher among admin roles */}
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg border border-stone-700 text-xs">
              <button
                onClick={() => appStore.setRole('restaurant_admin')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  currentRole === 'restaurant_admin'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Restaurant
              </button>
              <button
                onClick={() => appStore.setRole('rider')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  currentRole === 'rider'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Rider
              </button>
              <button
                onClick={() => appStore.setRole('super_admin')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  currentRole === 'super_admin'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Pure Customer Experience Header (No admin panels in main navigation!)
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark with Attractive Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => appStore.setRole('customer')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs ring-1 ring-stone-200">
              <img
                src={APNA_FOOD_LOGO}
                alt="Apna Food Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-stone-900 group-hover:text-amber-700 transition-colors">
                Apna Food
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-normal text-stone-500">
                Alipur, Punjab
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Delivery Area Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Delivering to: <strong className="text-stone-900">Alipur City & Suburbs</strong></span>
        </div>

        {/* Zone 3: Actions (Mobile Switcher, Cart, and Discreet Separate Portals Access) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-stone-600">
            <button
              onClick={() => appStore.setViewMode('desktop_web')}
              title="Desktop Web Mode"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'desktop_web' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => appStore.setViewMode('mobile_app')}
              title="Mobile Device Shell"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'mobile_app' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Test Runner */}
          <button
            onClick={onOpenTests}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Run automated test suite"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Tests</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Separate Portals Dropdown (For restaurant owners & super admin to manage panels separately) */}
          <div className="relative">
            <button
              onClick={() => setPortalMenuOpen(!portalMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-stone-500" />
              <span className="hidden sm:inline">Partner Portals</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {portalMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPortalMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-stone-100 font-semibold text-stone-400 uppercase text-[10px] tracking-wider">
                    Separate Management Panels
                  </div>
                  <button
                    onClick={() => {
                      appStore.setRole('restaurant_admin');
                      setPortalMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Store className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-semibold text-stone-900">Restaurant Dashboard</div>
                      <div className="text-[10px] text-stone-500">Menu, kitchen queue, orders</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      appStore.setRole('rider');
                      setPortalMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Bike className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-stone-900">Rider App Terminal</div>
                      <div className="text-[10px] text-stone-500">Pickups, transit, COD cash</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      appStore.setRole('super_admin');
                      setPortalMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer border-t border-stone-100"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-stone-900">Super Admin Console</div>
                      <div className="text-[10px] text-stone-500">Fee settings, approve restaurants</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onOpenBackendDocs();
                      setPortalMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer border-t border-stone-100 text-[11px]"
                  >
                    <Code2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Python FastAPI Architecture</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
