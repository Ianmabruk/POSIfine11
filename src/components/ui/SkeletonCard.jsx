export default function SkeletonCard({ variant = 'stat', className = '' }) {
  if (variant === 'stat') {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded-lg w-20 animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`card overflow-hidden ${className}`}>
        <div className="h-6 bg-gray-200 rounded-lg w-32 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`card ${className}`}>
        <div className="h-6 bg-gray-200 rounded-lg w-40 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (variant === 'product') {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
        <div className="w-full h-40 bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="h-4 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded-lg w-5/6 animate-pulse" />
    </div>
  );
}
