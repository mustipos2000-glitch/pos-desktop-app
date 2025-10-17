import React from 'react';
import './css/Sidebar.css';

const Sidebar = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-scroll">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="sidebar-nav">
        <button className="nav-btn">▲</button>
        <button className="nav-btn">▼</button>
      </div>
    </div>
  );
};

export default Sidebar;
