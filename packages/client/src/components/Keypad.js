import React from 'react';

const Keypad = ({ onInput, onEnter, onBackspace, onClear, className = '' }) => {
  const keys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const handleKeyPress = (key) => {
    if (onInput) {
      onInput(key);
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

  const handleSpace = () => {
    if (onInput) {
      onInput(' ');
    }
  };

  return (
    <div className={`bg-pos-bg-secondary p-3 rounded-lg border border-pos-border-secondary ${className}`}>
      <div className="space-y-2">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        
        {/* Bottom row with special keys */}
        <div className="flex justify-center gap-1 mt-2">
          <button
            onClick={handleClear}
            className="px-3 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSpace}
            className="w-20 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
          >
            Space
          </button>
          <button
            onClick={handleBackspace}
            className="px-3 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
          >
            ⌫
          </button>
          <button
            onClick={handleEnter}
            className="px-3 h-8 bg-pos-info hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Keypad;