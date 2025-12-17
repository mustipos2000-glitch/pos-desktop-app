import React from 'react';

/**
 * KioskLayout - Consistent layout wrapper for all kiosk screens
 * 
 * Features:
 * - Responsive padding and spacing
 * - Centered content with max-width
 * - Handles scrolling for overflow content
 */
const KioskLayout = ({ children, maxWidth = '6xl', className = '' }) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  return (
    <div className="min-h-screen bg-pos-bg-primary flex items-center justify-center p-6 md:p-8 overflow-y-auto">
      <div className={`w-full ${maxWidthClasses[maxWidth]} ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default KioskLayout;
