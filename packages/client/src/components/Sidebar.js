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
          <div className="flex">
            <div className='user-name-topbar'>
              <span className="RoleName">{currentUser.name} ({currentUser.role})</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        )}
        {/* <button className="nav-btn">Back</button> */}
      </div>
    </div>
  );
};

export default Sidebar;
