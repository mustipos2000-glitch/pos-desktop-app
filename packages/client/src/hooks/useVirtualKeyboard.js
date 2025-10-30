import { useState, useCallback } from 'react';

export const useVirtualKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState({
    isOpen: false,
    inputType: 'text',
    targetInput: null,
    currentValue: ''
  });

  const openKeyboard = useCallback((inputType = 'text', targetInput = null, currentValue = '') => {
    setKeyboardState({
      isOpen: true,
      inputType,
      targetInput,
      currentValue
    });
  }, []);

  const closeKeyboard = useCallback(() => {
    setKeyboardState({
      isOpen: false,
      inputType: 'text',
      targetInput: null,
      currentValue: ''
    });
  }, []);

  const handleKeyPress = useCallback((key, onValueChange) => {
    if (key === 'Backspace') {
      setKeyboardState(prev => {
        const newValue = prev.currentValue.slice(0, -1);
        if (onValueChange) onValueChange(newValue);
        return { ...prev, currentValue: newValue };
      });
    } else if (key === 'Clear') {
      setKeyboardState(prev => {
        if (onValueChange) onValueChange('');
        return { ...prev, currentValue: '' };
      });
    } else if (key === 'Enter') {
      closeKeyboard();
    } else if (key === 'Tab') {
      // Handle tab if needed
    } else {
      setKeyboardState(prev => {
        const newValue = prev.currentValue + key;
        if (onValueChange) onValueChange(newValue);
        return { ...prev, currentValue: newValue };
      });
    }
  }, [closeKeyboard]);

  return {
    keyboardState,
    openKeyboard,
    closeKeyboard,
    handleKeyPress
  };
};
