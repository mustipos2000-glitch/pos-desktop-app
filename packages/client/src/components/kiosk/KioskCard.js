import React from 'react';

/**
 * KioskCard - Touch-optimized card component for selections
 * 
 * Features:
 * - Large touch area
 * - Clear visual hierarchy
 * - Multilingual support
 * - Active state indication
 */
const KioskCard = ({ 
  title, 
  subtitle, 
  subtitleNl, 
  subtitleAr,
  onClick, 
  selected = false,
  icon = null,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-8 rounded-3xl transition-all duration-200
        border-3 min-h-[140px]
        active:scale-[0.97]
        ${selected 
          ? 'bg-pos-interactive-hover border-white shadow-2xl' 
          : 'bg-pos-bg-secondary border-pos-border-primary hover:border-pos-interactive-hover shadow-lg hover:shadow-xl'
        }
        ${className}
      `}
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        {icon && (
          <div className="text-5xl mb-2">
            {icon}
          </div>
        )}
        
        <h3 className="text-2xl font-bold text-pos-text-primary leading-tight">
          {title}
        </h3>
        
        {subtitle && (
          <p className="text-lg text-pos-text-secondary">
            {subtitle}
          </p>
        )}
        
        {subtitleNl && (
          <p className="text-base text-pos-text-muted">
            {subtitleNl}
          </p>
        )}
        
        {subtitleAr && (
          <p className="text-lg text-pos-text-muted" dir="rtl">
            {subtitleAr}
          </p>
        )}
      </div>
    </button>
  );
};

export default KioskCard;
