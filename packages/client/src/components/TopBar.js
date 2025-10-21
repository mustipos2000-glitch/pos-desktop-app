import React from 'react';
// import { useNavigate } from 'react-router-dom';
import './css/TopBar.css';

const TopBar = () => {
  // const navigate = useNavigate();
  // const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // const handleLogout = () => {
  //   localStorage.removeItem('currentUser');
  //   navigate('/');
  // };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button className="tab-btn active">
          <span className="icon">🪑</span>
          Tables (0)
        </button>
        <button className="tab-btn">
          <span className="icon">📋</span>
          Orders (0)
        </button>
      </div>
      <div className="top-bar-center">
        <button className="action-btn hold">On Hold</button>
        <button className="action-btn kitchen">Send To Kitchen</button>
      </div>
      <div className="top-bar-right">
        {/* {currentUser.name && (
          <div className="current-user">
            <div className="user-avatar-topbar" style={{ backgroundColor: currentUser.avatar_color }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="user-name-topbar">{currentUser.name}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        )} */}
        {/* <button className="filter-btn">Order</button>
        <button className="filter-btn">Room</button>
        <button className="filter-btn">Table</button>
        <button className="filter-btn">Customer</button> */}
        {/* <button className="fullscreen-btn">⛶</button> */}
      </div>
    </div>
  );
};

export default TopBar;
