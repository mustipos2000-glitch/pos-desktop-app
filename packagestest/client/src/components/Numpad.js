import React from 'react';

const Numpad = ({ onInput, onEnter, onBackspace, onClear, showDecimal = true, className = '' }) => {
  const numbers = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0']
  ];

  const handleNumberPress = (number) => {
    if (onInput) {
      onInput(number);
    }
  };

  const handleDecimal = () => {
    if (onInput) {
      onInput('.');
    }
  };

  const handleBackspace = () => {
    if (onBackspace) {
      onBackspace();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    }
  };

  return (
    <div className={`bg-pos-bg-secondary p-3 rounded-lg border border-pos-border-secondary ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        {/* Number rows */}
        {numbers.slice(0, 3).map((row, rowIndex) => 
          row.map((number) => (
            <button
              key={number}
              onClick={() => handleNumberPress(number)}
              className="w-12 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-lg font-medium rounded border border-pos-border-secondary transition-colors"
            >
              {number}
            </button>
          ))
        )}
        
        {/* Bottom row with 0 and special buttons */}
        <button
          onClick={() => handleNumberPress('0')}
          className="col-span-2 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-lg font-medium rounded border border-pos-border-secondary transition-colors"
        >
          0
        </button>
        
        {showDecimal && (
          <button
            onClick={handleDecimal}
            className="w-12 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-lg font-medium rounded border border-pos-border-secondary transition-colors"
          >
            .
          </button>
        )}
        
        {/* Action buttons */}
        <button
          onClick={handleBackspace}
          className="w-12 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
        >
          ⌫
        </button>
        
        <button
          onClick={handleClear}
          className="w-12 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
        >
          Clear
        </button>
        
        <button
          onClick={handleEnter}
          className="w-12 h-10 bg-pos-info hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

export default Numpad;