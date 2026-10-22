import React from 'react';

interface TrustWalletShieldProps {
  size?: number;
  className?: string;
}

export const TrustWalletShield: React.FC<TrustWalletShieldProps> = ({ size = 32, className = '' }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="tw_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0052FF" />
            <stop offset="60%" stopColor="#0570EB" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        {/* Outer Shield */}
        <path
          d="M50 0L95 21.2V58.4C95 87.2 75.8 107.5 50 115C24.2 107.5 5 87.2 5 58.4V21.2L50 0Z"
          fill="url(#tw_grad)"
        />
        {/* Inner Dark Cutout */}
        <path
          d="M50 14L83 29.5V56.8C83 78.8 68.9 94.6 50 100.8C31.1 94.6 17 78.8 17 56.8V29.5L50 14Z"
          fill="#070b13"
        />
        {/* Inner Core Shield */}
        <path
          d="M50 25L73 35.8V56.2C73 71.5 63.3 82.7 50 87.4C36.7 82.7 27 71.5 27 56.2V35.8L50 25Z"
          fill="url(#tw_grad)"
        />
      </svg>
    </div>
  );
};
