import React from 'react';
import './TopBar.css';

const TopBar = () => {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button className="tab-btn active">
          <span className="icon">🪑</span>
          Tables (0)
        </button>
        <button className="tab-btn">
          <span className="icon">📋</span>
          Orders (9)
        </button>
      </div>
      <div className="top-bar-center">
        <button className="action-btn hold">On Hold</button>
        <button className="action-btn kitchen">Send To Kitchen</button>
      </div>
      <div className="top-bar-right">
        <button className="filter-btn">Order</button>
        <button className="filter-btn">Room</button>
        <button className="filter-btn">Table</button>
        <button className="filter-btn">Customer</button>
        <button className="fullscreen-btn">⛶</button>
      </div>
    </div>
  );
};

export default TopBar;
