import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomBar = ({ onOpenSettings }) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 p-2 bg-pos-bg-primary border-t border-pos-border-primary">
      <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/admin')}>
        🔌 admin
      </button>
      <button className="btn-primary flex items-center gap-2" onClick={onOpenSettings}>
        ⚙️ Settings
      </button>
      {/* <button className="btn-primary">Eat In</button>
      <button className="btn-primary">New Return</button>
      <button className="btn-primary">Customer</button>
      <button className="btn-primary">Drawer</button>
      <button className="btn-primary flex items-center gap-2">💳 Card</button> */}
    </div>
  );
};

export default BottomBar;
