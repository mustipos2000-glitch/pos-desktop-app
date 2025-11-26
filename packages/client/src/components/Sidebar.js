import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ categories, selectedCategory, onSelectCategory }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="mt-1 mb-2 bg-pos-bg-secondary mr-1 rounded-lg flex flex-col border-r border-pos-border-primary">
      <div className="flex-1 overflow-y-auto py-4 px-2.5 flex flex-col gap-2 scrollbar-custom">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn border-2 min-w-[160px] border-pos-border-primary rounded-lg px-3 text-lg py-1 cursor-pointer text-left whitespace-normal break-words leading-tight ${
              selectedCategory === category 
                ? 'active text-white' 
                : 'text-pos-text-muted hover:text-white'
            }`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="p-4 mb-0">
        {currentUser.name && (
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col flex-1">
              <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
              <span className="text-xs text-pos-text-muted leading-tight">({currentUser.role})</span>
            </div>
            <button 
              className="bg-transparent border border-pos-border-secondary text-pos-text-muted cursor-pointer p-2 rounded flex items-center justify-center transition-all duration-200 min-w-[32px] h-8 hover:bg-pos-interactive-primary hover:text-white hover:border-pos-interactive-active" 
              onClick={handleLogout} 
              title="Log Out"
            >
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
