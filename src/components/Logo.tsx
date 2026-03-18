import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md', showText = true }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] shadow-lg shadow-gold/20 overflow-hidden",
        sizes[size]
      )}>
        {/* Stylized Building/A Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-3/5 h-3/5 z-10"
        >
          <path d="M3 21h18" />
          <path d="M9 21V9l3-3 3 3v12" />
          <path d="M2 21l7-7" />
          <path d="M22 21l-7-7" />
        </svg>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={cn("font-black tracking-tighter text-gray-900 leading-none", textSizes[size])}>
            ALEHEGNE<span className="text-gold">SEWNET</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mt-0.5">
            Apartment AS
          </p>
        </div>
      )}
    </div>
  );
};
