import { AlertTriangle, Package, ShoppingCart, FileText, Clock, Bell } from 'lucide-react';

const iconMap = {
  'no-products': Package,
  'no-sales': ShoppingCart,
  'no-data': FileText,
  'no-reminders': Bell,
  'default': AlertTriangle,
};

export default function EmptyState({ 
  icon = 'default', 
  title = 'No data yet', 
  description = 'Get started by adding your first item.',
  action,
  actionLabel,
  onAction
}) {
  const IconComponent = iconMap[icon] || iconMap['default'];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-5">
        <IconComponent className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onAction && actionLabel && (
        <button 
          onClick={onAction}
          className="btn-primary text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
