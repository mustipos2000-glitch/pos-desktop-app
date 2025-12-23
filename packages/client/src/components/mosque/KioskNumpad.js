import React from 'react';

/**
 * KioskNumpad - Large, touch-optimized numeric keypad
 * 
 * Features:
 * - Extra large buttons for easy touch
 * - Clear visual feedback
 * - Optimized layout for amount entry
 */
const KioskNumpad = ({ value, onChange, onClear, onBackspace }) => {
  const handleNumberClick = (num) => {
    if (value === '0') {
      onChange(num);
    } else {
      onChange(value + num);
    }
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '←']
  ];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
      {buttons.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((btn) => {
            const isSpecial = btn === 'C' || btn === '←';
            
            return (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') onClear();
                  else if (btn === '←') onBackspace();
                  else handleNumberClick(btn);
                }}
                className={`
                  text-2xl font-bold py-6 rounded-xl
                  transition-all duration-150 active:scale-95
                  border-2 shadow-lg min-h-[70px]
                  ${isSpecial 
                    ? 'bg-pos-interactive-primary text-pos-text-secondary border-pos-border-primary hover:bg-pos-interactive-hover' 
                    : 'bg-pos-bg-secondary text-pos-text-primary border-pos-border-primary hover:bg-pos-interactive-hover'
                  }
                `}
              >
                {btn}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default KioskNumpad;