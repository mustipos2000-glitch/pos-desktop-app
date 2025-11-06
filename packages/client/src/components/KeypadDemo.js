import { useState } from 'react';
import KeypadNumpad from './KeypadNumpad';
import Keypad from './Keypad';

const KeypadDemo = () => {
  const [inputValue, setInputValue] = useState('');
  const [activeKeypad, setActiveKeypad] = useState('combined'); // 'combined', 'keypad'

  const handleInput = (input) => {
    setInputValue(prev => prev + input);
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleEnter = () => {
    alert(`Entered: ${inputValue}`);
  };

  return (
    <div className="p-6 bg-pos-bg-primary min-h-screen">
      <h1 className="text-2xl font-bold text-pos-text-primary mb-6">Keypad Components Demo</h1>
      
      {/* Input Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-pos-text-muted mb-2">
          Input Value:
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full max-w-md bg-pos-bg-secondary border border-pos-border-secondary text-pos-text-primary px-4 py-3 rounded-lg text-lg focus:outline-none focus:border-pos-info transition-colors"
          placeholder="Type or use keypad..."
        />
      </div>

      {/* Keypad Type Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveKeypad('combined')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeKeypad === 'combined'
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}
          >
            Enhanced Keypad
          </button>
          <button
            onClick={() => setActiveKeypad('keypad')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeKeypad === 'keypad'
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}
          >
            Basic Keypad
          </button>
        </div>
      </div>

      {/* Active Keypad */}
      <div className="max-w-md">
        {activeKeypad === 'combined' && (
          <KeypadNumpad
            onInput={handleInput}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        )}
        
        {activeKeypad === 'keypad' && (
          <Keypad
            onInput={handleInput}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-pos-bg-secondary rounded-lg border border-pos-border-secondary">
        <h3 className="text-lg font-semibold text-pos-text-primary mb-3">Usage Examples:</h3>
        <div className="space-y-2 text-sm text-pos-text-muted">
          <p><strong>Enhanced Keypad:</strong> Full keyboard with numbers and letters in styled container</p>
          <p><strong>Basic Keypad:</strong> Simple keyboard with numbers and letters</p>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium text-pos-text-primary mb-2">Props:</h4>
          <ul className="text-xs text-pos-text-muted space-y-1">
            <li>• <code>onInput(value)</code> - Called when a key is pressed</li>
            <li>• <code>onEnter()</code> - Called when Enter is pressed</li>
            <li>• <code>onBackspace()</code> - Called when Backspace is pressed</li>
            <li>• <code>onClear()</code> - Called when Clear is pressed</li>
            <li>• <code>className</code> - Additional CSS classes for styling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KeypadDemo;