import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Menu, Bell, LogOut, Truck } from 'lucide-react';

const cashierMobileNavItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/mobile/cashier' },
  { id: 'products', label: 'Products', icon: ShoppingBag, path: '/mobile/cashier/products' },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, path: '/mobile/cashier/cart' },
  { id: 'deliveries', label: 'Deliveries', icon: Truck, path: '/mobile/cashier/deliveries' },
  { id: 'more', label: 'More', icon: Menu, path: '/mobile/cashier/settings' },
];

export default function MobileCashierLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/mobile/cashier') return location.pathname === '/mobile/cashier';
    return location.pathname.startsWith(path);
  };

  const handleNav = (item) => {
    navigate(item.path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cashier POS</h1>
              <p className="text-xs text-gray-500 font-medium">Point of Sale</p>
            </div>
          </div>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 z-30 safe-bottom shadow-lg"
        style={{ height: 'auto' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {cashierMobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                type="button"
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                  active ? 'text-primary-600' : 'text-gray-400'
                }`}
                style={{ flex: 1 }}
              >
                <Icon className={`w-6 h-6 transition-all duration-200 ${active ? 'scale-110' : ''}`} />
                <span className={`text-[10px] mt-1 font-medium transition-all duration-200 ${active ? 'text-primary-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
