import React from 'react';

const IconButton = ({ icon, onClick, title, className = '', variant = 'default' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'edit':
        return 'icon-btn-edit';
      case 'delete':
        return 'icon-btn-delete';
      default:
        return 'icon-btn';
    }
  };

  return (
    <button 
      className={`${getVariantClasses()} ${className}`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </button>
  );
};

export default IconButton;