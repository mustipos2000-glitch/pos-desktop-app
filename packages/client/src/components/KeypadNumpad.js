import { useState } from 'react';

const KeypadNumpad = ({ 
  onInput, 
  onEnter, 
  onBackspace, 
  onClear, 
  className = ''
}) => {
  const [isShifted, setIsShifted] = useState(false);

  const keys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const shiftedSymbols = {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')'
  };

  const handleKeyPress = (key) => {
    if (onInput) {
      let inputValue = key;
      if (isShifted) {
        if (shiftedSymbols[key]) {
          inputValue = shiftedSymbols[key];
        } else if (key.match(/[a-zA-Z]/)) {
          inputValue = key.toUpperCase();
        }
      } else {
        inputValue = key.toLowerCase();
      }
      onInput(inputValue);
    }
  };

  const handleShift = () => {
    setIsShifted(!isShifted);
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

  const getDisplayKey = (key) => {
    if (isShifted) {
      if (shiftedSymbols[key]) {
        return shiftedSymbols[key];
      }
      // For letters, show uppercase when shifted
      if (key.match(/[a-zA-Z]/)) {
        return key.toUpperCase();
      }
    }
    return key.toLowerCase();
  };

  return (
    <div className={`bg-pos-bg-tertiary px-1 py-1 mx-auto ${className}`}>
      <div className="space-y-1">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {/* Add Shift button at the beginning of the last letter row */}
            {rowIndex === 2 && (
              <button
                onClick={handleShift}
                className={`px-3 h-10 ${isShifted ? 'bg-pos-interactive-primary' : 'bg-pos-bg-primary'} hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors`}
              >
                Shift
              </button>
            )}
            
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
              >
                {getDisplayKey(key)}
              </button>
            ))}
            
            {/* Add decimal point and backspace to the last letter row */}
            {rowIndex === 3 && (
              <>
                <button
                  onClick={() => handleKeyPress('.')}
                  className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
                >
                  .
                </button>
                <button
                  onClick={handleBackspace}
                  className="px-4 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
                >
                  ⌫
                </button>
              </>
            )}
          </div>
        ))}
        
        {/* Function keys row */}
        <div className="flex gap-1 justify-center">
          <button
            onClick={handleClear}
            className="px-4 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress(',')}
            className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            ,
          </button>
          <button
            onClick={() => handleKeyPress(' ')}
            className="w-20 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            Space
          </button>
          <button
            onClick={() => handleKeyPress('/')}
            className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            /
          </button>
          <button
            onClick={() => handleKeyPress('*')}
            className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            *
          </button>
          <button
            onClick={() => handleKeyPress('-')}
            className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            -
          </button>
          <button
            onClick={() => handleKeyPress('+')}
            className="w-10 h-10 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            +
          </button>
          <button
            onClick={handleEnter}
            className="px-6 h-10 bg-pos-info hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeypadNumpad;