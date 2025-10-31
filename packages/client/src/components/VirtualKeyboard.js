import { useState, useEffect } from 'react';

const VirtualKeyboard = ({ onKeyPress, onClose, inputType = 'text', currentValue = '' }) => {
  const [capsLock, setCapsLock] = useState(false);
  const [shift, setShift] = useState(false);

  // Keyboard layouts
  const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const topRowKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const middleRowKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const bottomRowKeys = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const handleKeyClick = (key) => {
    let finalKey = key;
    
    // Apply shift/caps lock for letters
    if (key.match(/[a-z]/i)) {
      if (capsLock || shift) {
        finalKey = key.toUpperCase();
      }
    }
    
    // Reset shift after key press
    if (shift) {
      setShift(false);
    }
    
    onKeyPress(finalKey);
  };

  const handleSpecialKey = (action) => {
    switch (action) {
      case 'backspace':
        onKeyPress('Backspace');
        break;
      case 'space':
        onKeyPress(' ');
        break;
      case 'enter':
        onKeyPress('Enter');
        break;
      case 'tab':
        onKeyPress('Tab');
        break;
      case 'clear':
        onKeyPress('Clear');
        break;
      case 'capslock':
        setCapsLock(!capsLock);
        break;
      case 'shift':
        setShift(!shift);
        break;
      default:
        break;
    }
  };

  // Numeric keypad for number inputs
  const NumericKeypad = () => (
    <div className="numeric-keypad">
      <div className="keypad-grid">
        {['7', '8', '9'].map(num => (
          <button key={num} className="key-btn numpad-key" onClick={() => handleKeyClick(num)}>
            {num}
          </button>
        ))}
        {['4', '5', '6'].map(num => (
          <button key={num} className="key-btn numpad-key" onClick={() => handleKeyClick(num)}>
            {num}
          </button>
        ))}
        {['1', '2', '3'].map(num => (
          <button key={num} className="key-btn numpad-key" onClick={() => handleKeyClick(num)}>
            {num}
          </button>
        ))}
        <button className="key-btn numpad-key" onClick={() => handleKeyClick('0')}>0</button>
        <button className="key-btn numpad-key" onClick={() => handleKeyClick('.')}>.</button>
        <button className="key-btn special-key" onClick={() => handleSpecialKey('backspace')}>⌫</button>
      </div>
    </div>
  );

  // Full QWERTY keyboard
  const FullKeyboard = () => (
    <div className="full-keyboard">
      {/* Number row */}
      <div className="keyboard-row">
        {numberKeys.map(num => (
          <button key={num} className="key-btn" onClick={() => handleKeyClick(num)}>
            {num}
          </button>
        ))}
        <button className="key-btn special-key backspace-key" onClick={() => handleSpecialKey('backspace')}>
          ⌫ Backspace
        </button>
      </div>

      {/* Top letter row */}
      <div className="keyboard-row">
        <button className="key-btn special-key tab-key" onClick={() => handleSpecialKey('tab')}>
          Tab ⇥
        </button>
        {topRowKeys.map(key => (
          <button key={key} className="key-btn" onClick={() => handleKeyClick(key)}>
            {(capsLock || shift) ? key.toUpperCase() : key}
          </button>
        ))}
      </div>

      {/* Middle letter row */}
      <div className="keyboard-row">
        <button 
          className={`key-btn special-key caps-key ${capsLock ? 'active' : ''}`} 
          onClick={() => handleSpecialKey('capslock')}
        >
          ⇪ Caps
        </button>
        {middleRowKeys.map(key => (
          <button key={key} className="key-btn" onClick={() => handleKeyClick(key)}>
            {(capsLock || shift) ? key.toUpperCase() : key}
          </button>
        ))}
        <button className="key-btn special-key enter-key" onClick={() => handleSpecialKey('enter')}>
          Enter ↵
        </button>
      </div>

      {/* Bottom letter row */}
      <div className="keyboard-row">
        <button 
          className={`key-btn special-key shift-key ${shift ? 'active' : ''}`} 
          onClick={() => handleSpecialKey('shift')}
        >
          ⇧ Shift
        </button>
        {bottomRowKeys.map(key => (
          <button key={key} className="key-btn" onClick={() => handleKeyClick(key)}>
            {(capsLock || shift) ? key.toUpperCase() : key}
          </button>
        ))}
        <button className="key-btn special-key" onClick={() => handleKeyClick('-')}>-</button>
        <button className="key-btn special-key" onClick={() => handleKeyClick('_')}>_</button>
      </div>

      {/* Space bar row */}
      <div className="keyboard-row">
        <button className="key-btn special-key clear-key" onClick={() => handleSpecialKey('clear')}>
          Clear
        </button>
        <button className="key-btn space-key" onClick={() => handleSpecialKey('space')}>
          Space
        </button>
        <button className="key-btn special-key" onClick={() => handleKeyClick('.')}>.</button>
        <button className="key-btn special-key" onClick={() => handleKeyClick('@')}>@</button>
      </div>
    </div>
  );

  return (
    <div className="virtual-keyboard-overlay" onClick={onClose}>
      <div className="virtual-keyboard-container" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-header">
          <h4 className="keyboard-title">Virtual Keyboard</h4>
          <button className="keyboard-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="keyboard-body">
          {inputType === 'number' ? <NumericKeypad /> : <FullKeyboard />}
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
