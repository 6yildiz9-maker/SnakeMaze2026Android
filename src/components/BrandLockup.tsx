import React from 'react';

interface BrandLockupProps {
  layout?: 'stacked' | 'horizontal';
  className?: string;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({
  layout = 'stacked',
  className = '',
}) => (
  <div
    className={`flex items-center ${layout === 'stacked' ? 'flex-col gap-2' : 'gap-2'} ${className}`}
    role="img"
    aria-label="Pixelfang Snake Maze"
  >
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={layout === 'stacked' ? 'w-20 h-20' : 'w-9 h-9'}
      shapeRendering="crispEdges"
    >
      <rect x="4" y="4" width="88" height="88" rx="18" fill="#1E2328" />
      <path
        fill="#79FF4A"
        d="M25 17h46v7h7v7h7v34h-7v10H69v7H27v-7H18V65h-7V33h7v-9h7z"
      />
      <path fill="#1E2328" d="M27 37h10v10H27zM59 37h10v10H59z" />
      <path fill="#FFD65A" d="M30 59h11v10l-5.5 8L30 69zM55 59h11v10l-5.5 8L55 69z" />
      <path fill="#1E2328" d="M43 57h10v6H43z" />
    </svg>
    <span className={layout === 'stacked' ? 'text-center' : 'text-left'}>
      <span className="block font-mono-retro font-black tracking-[0.16em] text-[#1E2328] text-2xl sm:text-3xl leading-none">
        PIXELFANG
      </span>
      <span className="block mt-1 font-mono-retro font-bold tracking-[0.28em] text-[#3A3F44]/75 text-xs sm:text-sm leading-none">
        SNAKE MAZE
      </span>
    </span>
  </div>
);
