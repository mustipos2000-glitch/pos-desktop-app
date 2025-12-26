import React from "react";

/**
 * KioskNumpad - Large, touch-optimized numeric keypad
 *
 * Backwards compatible & crash-safe:
 * - supports onChange(newValue) (legacy)
 * - supports onInput(digit) + value (new usage)
 * - supports onClear, onBackspace
 */
const KioskNumpad = ({ value = "", onChange, onInput, onClear, onBackspace, disabled = false }) => {
  const safe = (fn, ...args) => {
    if (typeof fn === "function") fn(...args);
  };

  // set full value (preferred for this component)
  const setValue = (next) => {
    if (disabled) return;

    // Prefer legacy onChange(nextValue) if provided, else fallback to onInput (digit-based)
    if (typeof onChange === "function") {
      onChange(next);
      return;
    }

    // Fallback: if only onInput exists, emit the delta (best effort)
    // Here we just emit last char if it was an append, else do nothing.
    if (typeof onInput === "function") {
      // if next is longer and is append
      if (next.length > value.length) {
        const appended = next.slice(value.length);
        // emit each appended char
        appended.split("").forEach((ch) => safe(onInput, ch));
      }
    }
  };

  const handleNumberClick = (num) => {
    const current = String(value ?? "");
    if (current === "0") setValue(num);
    else setValue(current + num);
  };

  const handleClear = () => {
    if (disabled) return;
    if (typeof onClear === "function") return onClear();
    // fallback: clear via onChange if exists
    if (typeof onChange === "function") return onChange("");
  };

  const handleBackspace = () => {
    if (disabled) return;
    if (typeof onBackspace === "function") return onBackspace();
    // fallback: backspace via onChange if exists
    if (typeof onChange === "function") return onChange(String(value ?? "").slice(0, -1));
  };

  const buttons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "←"],
  ];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
      {buttons.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((btn) => {
            const isSpecial = btn === "C" || btn === "←";

            return (
              <button
                key={btn}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (btn === "C") handleClear();
                  else if (btn === "←") handleBackspace();
                  else handleNumberClick(btn);
                }}
                className={`
                  text-2xl font-bold py-6 rounded-xl
                  transition-all duration-150 active:scale-95
                  border-2 shadow-lg min-h-[70px]
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                  ${
                    isSpecial
                      ? "bg-pos-interactive-primary text-pos-text-secondary border-pos-border-primary hover:bg-pos-interactive-hover"
                      : "bg-pos-bg-secondary text-pos-text-primary border-pos-border-primary hover:bg-pos-interactive-hover"
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
