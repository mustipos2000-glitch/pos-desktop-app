import React from 'react';

/**
 * KioskHeader - Consistent header component for all kiosk screens
 * 
 * Features:
 * - Large, readable typography
 * - Clear visual hierarchy
 * - Optional progress indicator
 */
const KioskHeader = ({ 
  title, 
  subtitle, 
  step = null, 
  totalSteps = null,
  className = '' 
}) => {
  return (
    <div className={`text-center ${className}`}>
      {step !== null && totalSteps && (
        <div className="mb-3 flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full transition-all ${
                  i < step 
                    ? 'bg-green-500' 
                    : i === step 
                    ? 'bg-pos-text-primary' 
                    : 'bg-pos-border-primary'
                }`}
              />
            ))}
          </div>
        </div>
      )}
      
      <h1 className="text-3xl md:text-4xl font-bold text-pos-text-primary mb-2 leading-tight">
        {title}
      </h1>
      
      {subtitle && (
        <p className="text-lg md:text-xl text-pos-text-secondary max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default KioskHeader;
