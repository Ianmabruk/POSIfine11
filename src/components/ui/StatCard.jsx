import { memo } from 'react';

const StatCard = memo(function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'from-primary-500 to-brand-500',
  bgColor = 'bg-white',
  delay = 0 
}) {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <div 
      className={`card hover-lift animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {trend && trendValue && (
        <div className={`mt-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trendColors[trend]}`}>
          <span>{trendIcon}</span>
          <span>{trendValue}</span>
          <span className="text-gray-400 ml-0.5">vs last period</span>
        </div>
      )}
    </div>
  );
});

export default StatCard;
