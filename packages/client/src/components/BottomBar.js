import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/BottomBar.css';

const BottomBar = ({ onOpenSettings }) => {
  const navigate = useNavigate();

  return (
    <div className="bottom-bar">
      <button className="bottom-btn admin" onClick={() => navigate('/admin')}>
        🔌 admin
      </button>
      <button className="bottom-btn settings" onClick={onOpenSettings}>
        ⚙️ Settings
      </button>
      <button className="bottom-btn">Eat In</button>
      <button className="bottom-btn">New Return</button>
      <button className="bottom-btn">Customer</button>
      {/* <button className="bottom-btn icon-btn">⚙️</button> */}
      <button className="bottom-btn">Drawer</button>
      <button className="bottom-btn">💳 Card</button>
      {/* <button className="bottom-btn cash">💵 Cash</button> */}
    </div>
  );
};

export default BottomBar;
