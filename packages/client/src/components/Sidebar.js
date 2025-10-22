import React from 'react';
import './css/Sidebar.css';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ categories, selectedCategory, onSelectCategory }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

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
        {currentUser.name && (
          <div className="user-nav-container">
            <div className='user-info'>
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role user-name">({currentUser.role})</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Log Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
