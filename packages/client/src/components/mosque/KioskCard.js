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
        ${className}
      `}
    >
      <div className="">
        {icon && (
          <div className="">
            {typeof icon === 'string' && icon.startsWith('/') ? (
              <img 
                src={icon} 
                alt={title}
                className="mx-auto object-contain rounded-3xl"
              />
            ) : (
              <div className="text-5xl">
                {icon}
              </div>
            )}
          </div>
        )}
        
        {/* <h3 className="text-2xl font-bold text-pos-text-primary leading-tight">
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
        )} */}
      </div>
    </button>
  );
};

export default KioskCard;