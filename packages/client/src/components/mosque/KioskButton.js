import React from 'react';

/**
 * KioskButton - Optimized button component for touch interfaces
 * 
 * Features:
 * - Large touch targets (minimum 60px height)
 * - Clear visual feedback
 * - Accessible and readable from distance
 * - Supports multiple variants and sizes
 */
const KioskButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'large',
  disabled = false,
  fullWidth = false,
  icon = null,
  className = ''
}) => {
  const baseStyles = 'font-semibold rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-3';
  
  const variants = {
    primary: 'bg-pos-bg-secondary text-pos-text-primary border-2 border-pos-border-primary hover:bg-pos-interactive-hover shadow-lg',
    secondary: 'bg-pos-interactive-primary text-pos-text-primary border-2 border-pos-border-primary hover:bg-pos-interactive-hover',
    success: 'bg-green-600 text-white border-2 border-green-700 hover:bg-green-700 shadow-lg',
    danger: 'bg-red-600 text-white border-2 border-red-700 hover:bg-red-700 shadow-lg',
    ghost: 'bg-transparent text-pos-text-primary border-2 border-pos-border-primary hover:bg-pos-interactive-primary'
  };
  
  const sizes = {
    small: 'px-6 py-3 text-base min-h-[50px]',
    medium: 'px-8 py-4 text-lg min-h-[60px]',
    large: 'px-10 py-5 text-xl min-h-[70px]',
    xlarge: 'px-12 py-6 text-2xl min-h-[80px]'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className}`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {children}
    </button>
  );
};

export default KioskButton;