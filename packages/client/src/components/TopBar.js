import React from 'react';
// import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  // const navigate = useNavigate();
  // const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // const handleLogout = () => {
  //   localStorage.removeItem('currentUser');
  //   navigate('/');
  // };

  return (
    <div className="flex justify-between items-center bg-pos-bg-secondary px-5 py-2.5 border-b border-pos-border-primary">
      <div className="flex gap-2.5">
        <button className="bg-pos-interactive-primary text-white border-none px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 hover:bg-pos-interactive-hover">
          <span className="text-lg">🪑</span>
          Tables (0)
        </button>
        <button className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white">
          <span className="text-lg">📋</span>
          Orders (0)
        </button>
      </div>
      <div className="flex gap-2.5">
        <button className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white">
          On Hold
        </button>
        <button className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white">
          Send To Kitchen
        </button>
      </div>
      <div className="flex gap-2.5 items-center">
        {/* {currentUser.name && (
          <div className="flex items-center gap-2.5 mr-4 pr-4 border-r border-pos-border-secondary">
            <div className="w-8 h-8 flex items-center justify-center text-white" style={{ backgroundColor: currentUser.avatar_color }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">{currentUser.name}</span>
            <button className="btn-danger text-xs px-3 py-1.5" onClick={handleLogout}>Logout</button>
          </div>
        )} */}
        {/* <button className="btn-secondary">Order</button>
        <button className="btn-secondary">Room</button>
        <button className="btn-secondary">Table</button>
        <button className="btn-secondary">Customer</button> */}
        {/* <button className="bg-transparent text-pos-text-muted border-none p-2 cursor-pointer text-lg transition-colors duration-200 hover:text-white">⛶</button> */}
      </div>
    </div>
  );
};

export default TopBar;
