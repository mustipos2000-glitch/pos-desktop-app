import React from 'react';

/**
 * KioskModal - Full-screen modal for payment processing and confirmations
 * 
 * Features:
 * - Full-screen overlay
 * - Clear status indication
 * - Loading states
 */
const KioskModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showClose = true,
  loading = false,
  className = '' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-6">
      <div className={`bg-pos-bg-primary border-2 border-pos-border-primary rounded-3xl shadow-2xl w-full max-w-2xl p-8 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-pos-text-primary">
            {title}
          </h2>
          {showClose && !loading && (
            <button
              onClick={onClose}
              className="text-pos-text-muted hover:text-pos-text-primary text-4xl leading-none transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="text-pos-text-primary">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-pos-text-primary mb-6"></div>
              <p className="text-xl text-pos-text-secondary">Processing...</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default KioskModal;
