import { useState } from 'react';
import { Star } from 'lucide-react';

const FULL = [1, 2, 3, 4, 5];

export default function RatingStars({ rating, size = 4, readOnly = true, onChange }) {
  const [hover, setHover] = useState(0);
  const value = rating || 0;

  return (
    <div className="flex items-center gap-0.5">
      {FULL.map((n) => {
        const filled = n <= (hover || value);
        const sz = size <= 4 ? 'w-4 h-4' : `w-${size} h-${size}`;
        return (
          <Star
            key={n}
            className={sz}
            fill={filled ? '#f59e0b' : 'none'}
            stroke={filled ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange && onChange(n)}
          />
        );
      })}
    </div>
  );
}
