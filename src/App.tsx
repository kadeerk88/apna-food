import React, { useState, useEffect } from 'react';
import { appStore } from './services/store';
import { Header } from './components/Header';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CartConflictModal } from './components/CartConflictModal';
import { RestaurantPortal } from './components/restaurant/RestaurantPortal';
import { RiderPortal } from './components/rider/RiderPortal';
import { SuperAdminPortal } from './components/admin/SuperAdminPortal';
import { TestRunnerModal } from './components/test_runner/TestRunnerModal';
import { BackendDocsModal } from './components/backend_docs/BackendDocsModal';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [, setTick] = useState(0);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isBackendDocsOpen, setIsBackendDocsOpen] = useState(false);

  // Subscribe to central reactive store
  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const currentRole = appStore.currentRole;
  const viewMode = appStore.viewMode;
  const cartCount = appStore.cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrderSuccess = (orderId: string) => {
    appStore.setActiveOrderForTracking(orderId);
    appStore.setRole('customer');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Bar Header */}
      <Header
        currentRole={currentRole}
        viewMode={viewMode}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenBackendDocs={() => setIsBackendDocsOpen(true)}
      />

      {/* Main Container: Desktop full width or Mobile Shell Simulation */}
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        {viewMode === 'mobile_app' ? (
          /* Mobile Device Frame Simulation */
          <div className="max-w-md mx-auto">
            <div className="bg-stone-900 rounded-[40px] p-3 shadow-2xl border-4 border-stone-800 ring-1 ring-stone-900/10">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-stone-900 mx-auto rounded-full mb-2 flex items-center justify-center">
                <div className="w-12 h-1 bg-stone-800 rounded-full" />
              </div>

              {/* Screen Canvas */}
              <div className="bg-stone-50 rounded-[32px] overflow-hidden min-h-[720px] max-h-[820px] overflow-y-auto p-4 shadow-inner">
                {currentRole === 'customer' && (
                  <CustomerPortal onOpenCart={() => setIsCartOpen(true)} />
                )}
                {currentRole === 'restaurant_admin' && <RestaurantPortal />}
                {currentRole === 'rider' && <RiderPortal />}
                {currentRole === 'super_admin' && <SuperAdminPortal />}
              </div>

              {/* Phone Bottom Home Bar */}
              <div className="w-32 h-1 bg-stone-700 mx-auto rounded-full mt-3 mb-1" />
            </div>

            <div className="mt-3 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <span>Simulated Mobile View (Android / iOS)</span>
              <span>·</span>
              <button
                onClick={() => appStore.setViewMode('desktop_web')}
                className="text-amber-700 font-medium hover:underline cursor-pointer"
              >
                Switch to Desktop Web
              </button>
            </div>
          </div>
        ) : (
          /* Desktop Web View */
          <div className="max-w-7xl mx-auto">
            {currentRole === 'customer' && (
              <CustomerPortal onOpenCart={() => setIsCartOpen(true)} />
            )}
            {currentRole === 'restaurant_admin' && <RestaurantPortal />}
            {currentRole === 'rider' && <RiderPortal />}
            {currentRole === 'super_admin' && <SuperAdminPortal />}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Cart Conflict Modal (1 Restaurant per order rule) */}
      <CartConflictModal
        isOpen={appStore.cartConflictModal.isOpen}
        newRestaurantName={appStore.cartConflictModal.newRestaurantName}
        onResolve={(replace) => appStore.resolveCartConflict(replace)}
      />

      {/* Automated Tests Modal */}
      <TestRunnerModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
      />

      {/* Python FastAPI Backend Specs Modal */}
      <BackendDocsModal
        isOpen={isBackendDocsOpen}
        onClose={() => setIsBackendDocsOpen(false)}
      />
    </div>
  );
}
