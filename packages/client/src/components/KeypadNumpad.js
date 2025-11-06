import React, { useState } from 'react';

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
    <div className={`bg-pos-bg-tertiary px-3 py-1 rounded-lg border border-pos-border-secondary ${className}`} style={{maxWidth: "24rem"}}>
      <div className="">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-0.5">
            {/* Add Shift button at the beginning of the last letter row */}
            {rowIndex === 2 && (
              <button
                onClick={handleShift}
                className={`px-2 h-8 ${isShifted ? 'bg-pos-interactive-primary' : 'bg-pos-bg-primary'} hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors`}
              >
                Shift
              </button>
            )}
            
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
              >
                {getDisplayKey(key)}
              </button>
            ))}
            
            {/* Add decimal point and backspace to the last letter row */}
            {rowIndex === 3 && (
              <>
                <button
                  onClick={() => handleKeyPress('.')}
                  className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
                >
                  .
                </button>
                <button
                  onClick={handleBackspace}
                  className="px-4 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
                >
                  ⌫
                </button>
              </>
            )}
          </div>
        ))}
        
        {/* Function keys row */}
        <div className="flex gap-0.5">
          <button
            onClick={handleClear}
            className="px-3 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress(',')}
            className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            ,
          </button>
          <button
            onClick={() => handleKeyPress(' ')}
            className="w-16 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-xs font-medium rounded border border-pos-border-secondary transition-colors"
          >
            Space
          </button>
          <button
            onClick={() => handleKeyPress('/')}
            className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            /
          </button>
          <button
            onClick={() => handleKeyPress('*')}
            className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            *
          </button>
          <button
            onClick={() => handleKeyPress('-')}
            className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            -
          </button>
          <button
            onClick={() => handleKeyPress('+')}
            className="w-8 h-8 bg-pos-bg-primary hover:bg-pos-interactive-primary text-pos-text-primary text-sm font-medium rounded border border-pos-border-secondary transition-colors"
          >
            +
          </button>
            {/* Add Enter button to the ASDFGHJKL row */}
            {/* {rowIndex === 2 && ( */}
              <button
                onClick={handleEnter}
                className="px-4 h-8 bg-pos-info hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
              >
                Enter
              </button>
            {/* )} */}
        </div>
      </div>
    </div>
  );
};

export default KeypadNumpad;