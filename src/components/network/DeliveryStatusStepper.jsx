import { Clock, Package } from 'lucide-react';

const STEPS = [
  { key: 'rider_requested', label: 'Rider Requested', icon: Package },
  { key: 'rider_assigned', label: 'Rider Assigned', icon: Package },
  { key: 'rider_going_to_pickup', label: 'En Route to Pickup', icon: Clock },
  { key: 'rider_at_pickup', label: 'At Pickup', icon: Package },
  { key: 'goods_collected', label: 'Goods Collected', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Clock },
  { key: 'near_destination', label: 'Near Destination', icon: Clock },
  { key: 'delivered_pending_confirmation', label: 'Awaiting Confirmation', icon: Package },
  { key: 'buyer_confirmed', label: 'Confirmed', icon: Package },
  { key: 'completed', label: 'Completed', icon: Package },
];

export default function DeliveryStatusStepper({ status, events = [] }) {
  const activeIndex = STEPS.findIndex((s) => s.key === status) + (status === 'cancelled' || status === 'failed' ? 0 : 0);
  const idx = Math.max(0, STEPS.findIndex((s) => s.key === status));
  const cancelled = status === 'cancelled' || status === 'failed';

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between text-xs font-medium ${cancelled ? 'text-red-600' : 'text-gray-600'}`}>
        <span>Delivery status</span>
        <span>{status?.replace(/_/g, ' ')}</span>
      </div>
      <div className="relative">
        <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200" />
        <div
          className="absolute top-3.5 left-0 h-0.5 bg-green-500 transition-all"
          style={{ width: idx >= 0 ? `${(idx / (STEPS.length - 1)) * 100}%` : '0%' }}
        />
        <div className="relative flex justify-between">
          {STEPS.map((s, i) => {
            const reached = i <= idx;
            const Icon = s.icon;
            let state = 'pending';
            if (cancelled) state = i <= idx ? 'done' : 'cancelled';
            else if (reached) state = 'done';
            const colors = {
              done: 'bg-green-500 text-white',
              pending: 'bg-gray-200 text-gray-600',
              cancelled: 'bg-red-400 text-white',
            };
            return (
              <div key={s.key} className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white ${colors[state]}`}> 
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="mt-1 text-[10px] text-center text-gray-600 leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {events?.length > 0 && (
        <div className="text-xs text-gray-500 space-y-0.5">
          {events.slice(-6).reverse().map((e) => (
            <div key={e.id} className="flex justify-between">
              <span>{e.statusTo?.replace(/_/g, ' ')}</span>
              <span>{new Date(e.createdAt || e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
