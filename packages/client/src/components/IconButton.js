import React from 'react';
import './css/IconButton.css';

const IconButton = ({ icon, onClick, title, className = '' }) => {
  return (
    <button 
      className={`icon-button ${className}`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </button>
  );
};

export default IconButton;