import React, { useEffect, useState } from 'react';
import { Order } from '../../types';
import { Store, Home, Bike, Navigation, MapPin } from 'lucide-react';

interface InteractiveAlipurMapProps {
  order: Order;
}

export const InteractiveAlipurMap: React.FC<InteractiveAlipurMapProps> = ({ order }) => {
  const [progress, setProgress] = useState(0.45); // 0 to 1 between restaurant and customer

  // Simulate rider motion if order is out for delivery
  useEffect(() => {
    if (order.status === 'out_for_delivery') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 0.95) return 0.2; // loop for live animation preview
          return prev + 0.05;
        });
      }, 1500);
      return () => clearInterval(interval);
    } else if (order.status === 'delivered') {
      setProgress(1.0);
    } else if (order.status === 'picked_up') {
      setProgress(0.15);
    } else {
      setProgress(0.0);
    }
  }, [order.status]);

  // Coordinates on 500x320 SVG viewport
  const restPos = { x: 90, y: 160 };
  const custPos = { x: 420, y: 140 };

  // Calculate rider's current interpolated position along the road path
  const riderPos = {
    x: restPos.x + (custPos.x - restPos.x) * progress,
    y: restPos.y + (custPos.y - restPos.y) * progress + Math.sin(progress * Math.PI) * -35,
  };

  return (
    <div className="relative w-full h-72 sm:h-80 bg-stone-900 rounded-xl overflow-hidden border border-stone-800 shadow-inner">
      {/* Background Grid & Town Map SVG */}
      <svg
        className="w-full h-full"
        viewBox="0 0 500 300"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#262626" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="#171717" />
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Town Zones */}
        <circle cx="120" cy="150" r="85" fill="#f59e0b" fillOpacity="0.04" />
        <text x="50" y="70" fill="#737373" fontSize="10" fontFamily="sans-serif">
          Zone 1: Kutchery & Main Bazaar
        </text>

        <circle cx="380" cy="160" r="95" fill="#10b981" fillOpacity="0.04" />
        <text x="330" y="70" fill="#737373" fontSize="10" fontFamily="sans-serif">
          Zone 2: Seet Pur Link Area
        </text>

        {/* Alipur Arterial Roads */}
        {/* Main Multan-Alipur Road */}
        <path d="M 30 160 L 470 140" stroke="#404040" strokeWidth="12" strokeLinecap="round" />
        <path d="M 30 160 L 470 140" stroke="#262626" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 30 160 L 470 140"
          stroke="#525252"
          strokeWidth="1"
          strokeDasharray="6,6"
        />

        {/* Circular / College Road Cross Street */}
        <path d="M 220 30 L 250 270" stroke="#333333" strokeWidth="8" strokeLinecap="round" />
        <path d="M 360 40 L 340 260" stroke="#333333" strokeWidth="6" strokeLinecap="round" />

        {/* Road Labels */}
        <text x="140" y="145" fill="#a3a3a3" fontSize="9" fontFamily="sans-serif">
          Main Multan-Alipur Road
        </text>
        <text x="255" y="100" fill="#737373" fontSize="8" fontFamily="sans-serif">
          Circular Road
        </text>
        <text x="365" y="100" fill="#737373" fontSize="8" fontFamily="sans-serif">
          Seet Pur Road
        </text>

        {/* Active Delivery Route Arc */}
        <path
          d={`M ${restPos.x} ${restPos.y} Q 250 100 ${custPos.x} ${custPos.y}`}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="4"
          strokeDasharray="6,4"
          strokeLinecap="round"
        />

        {/* Restaurant Marker */}
        <g transform={`translate(${restPos.x - 14}, ${restPos.y - 14})`}>
          <circle cx="14" cy="14" r="16" fill="#f59e0b" fillOpacity="0.25" />
          <circle cx="14" cy="14" r="11" fill="#f59e0b" />
          <Store x="6" y="6" width="16" height="16" color="#ffffff" />
        </g>
        <text
          x={restPos.x}
          y={restPos.y + 26}
          fill="#fef3c7"
          fontSize="10"
          fontWeight="600"
          textAnchor="middle"
        >
          {order.restaurantName}
        </text>

        {/* Customer Marker */}
        <g transform={`translate(${custPos.x - 14}, ${custPos.y - 14})`}>
          <circle cx="14" cy="14" r="16" fill="#10b981" fillOpacity="0.25" />
          <circle cx="14" cy="14" r="11" fill="#10b981" />
          <Home x="6" y="6" width="16" height="16" color="#ffffff" />
        </g>
        <text
          x={custPos.x}
          y={custPos.y + 26}
          fill="#d1fae5"
          fontSize="10"
          fontWeight="600"
          textAnchor="middle"
        >
          {order.customerName}
        </text>

        {/* Animated Rider Marker */}
        {order.status !== 'delivered' && (
          <g transform={`translate(${riderPos.x - 14}, ${riderPos.y - 14})`}>
            <circle cx="14" cy="14" r="15" fill="#3b82f6" fillOpacity="0.3">
              <animate
                attributeName="r"
                values="12;18;12"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="14" cy="14" r="11" fill="#2563eb" />
            <Bike x="6" y="6" width="16" height="16" color="#ffffff" />
          </g>
        )}
      </svg>

      {/* Floating Live Telemetry Overlay Card */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-stone-900/90 backdrop-blur-md p-3 rounded-lg border border-stone-700/80 text-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md">
            <Navigation className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="font-semibold text-stone-200">
              {order.status === 'delivered'
                ? 'Delivery Completed'
                : order.status === 'out_for_delivery'
                ? 'Rider in Transit'
                : 'Order in Preparation'}
            </div>
            <div className="text-[11px] text-stone-400">
              {order.riderName ? `${order.riderName} (${order.riderType === 'restaurant_rider' ? 'Restaurant Rider' : 'Platform Rider'})` : 'Awaiting Rider Dispatch'}
            </div>
          </div>
        </div>

        <div className="text-right pl-3 border-l border-stone-800">
          <div className="font-mono font-medium text-amber-400 text-xs">
            {order.status === 'delivered' ? '0 min' : '12-18 min'}
          </div>
          <div className="text-[10px] text-stone-400">Est. Arrival</div>
        </div>
      </div>
    </div>
  );
};
