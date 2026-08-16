import { Home, ShoppingBag, ShoppingCart, Menu } from 'lucide-react';

export default function BottomNavBar({ activeTab, onTabChange, cartItemCount }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartItemCount },
    { id: 'more', label: 'More', icon: Menu },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 safe-bottom shadow-lg"
      style={{ height: 'auto' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 rounded-lg transition-all duration-200 touch-manipulation"
              style={{ flex: 1 }}
            >
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  {tab.badge > 0 && (
                    <span
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center pointer-events-none"
                      style={{ minWidth: '20px', height: '20px', padding: '2px 4px' }}
                    >
                      {tab.badge}
                    </span>
                  )}
                  <Icon
                    className={`w-6 h-6 transition-all duration-200 ${
                      isActive
                        ? 'text-green-600 scale-110'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs mt-1 font-medium transition-all duration-200 ${
                    isActive ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
