import React from 'react';

/**
 * KioskInfoPanel - Display contextual information
 * 
 * Features:
 * - Clear information display
 * - Compact but readable
 * - Supports key-value pairs
 */
const KioskInfoPanel = ({ items, className = '' }) => {
  return (
    <div className={`bg-pos-bg-secondary rounded-2xl p-6 border-2 border-pos-border-primary ${className}`}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-lg">
            <span className="text-pos-text-secondary font-medium">{item.label}:</span>
            <span className="text-pos-text-primary font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KioskInfoPanel;