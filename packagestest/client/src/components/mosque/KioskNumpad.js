import React from "react";

/**
 * KioskNumpad - true iOS style (white) + big buttons
 *
 * Props:
 * - value: string
 * - onChange(nextValue)   (preferred)
 * - onInput(digit)        (optional fallback)
 * - onClear()
 * - onBackspace()
 * - disabled
 */
const KioskNumpad = ({
  value = "",
  onChange,
  onInput,
  onClear,
  onBackspace,
  disabled = false,
}) => {
  const safe = (fn, ...args) => {
    if (typeof fn === "function") fn(...args);
  };

  const setValue = (next) => {
    if (disabled) return;

    if (typeof onChange === "function") {
      onChange(next);
      return;
    }

    // fallback if only onInput exists
    if (typeof onInput === "function") {
      const current = String(value ?? "");
      if (next.length > current.length) {
        const appended = next.slice(current.length);
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
    if (typeof onChange === "function") return onChange("");
  };

  const handleBackspace = () => {
    if (disabled) return;
    if (typeof onBackspace === "function") return onBackspace();
    if (typeof onChange === "function") return onChange(String(value ?? "").slice(0, -1));
  };

  // iOS white button style
  const baseBtn =
    "rounded-3xl border border-gray-200 bg-white text-black " +
    "shadow-[0_10px_25px_rgba(0,0,0,0.12)] " +
    "active:scale-[0.985] transition min-h-[115px]";

  const hover = disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_14px_30px_rgba(0,0,0,0.16)]";
  const numberText = "text-5xl font-extrabold";

  const Btn = ({ children, onClick, className = "" }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${baseBtn} ${hover} ${className}`}
    >
      <div className={`w-full h-full flex items-center justify-center ${numberText}`}>
        {children}
      </div>
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-6">
        <Btn onClick={() => handleNumberClick("1")}>1</Btn>
        <Btn onClick={() => handleNumberClick("2")}>2</Btn>
        <Btn onClick={() => handleNumberClick("3")}>3</Btn>

        <Btn onClick={() => handleNumberClick("4")}>4</Btn>
        <Btn onClick={() => handleNumberClick("5")}>5</Btn>
        <Btn onClick={() => handleNumberClick("6")}>6</Btn>

        <Btn onClick={() => handleNumberClick("7")}>7</Btn>
        <Btn onClick={() => handleNumberClick("8")}>8</Btn>
        <Btn onClick={() => handleNumberClick("9")}>9</Btn>

        <Btn onClick={handleClear} className="bg-white">
          C
        </Btn>
        <Btn onClick={() => handleNumberClick("0")}>0</Btn>
        <Btn onClick={handleBackspace} className="bg-white">
          ⌫
        </Btn>

        <button
          type="button"
          disabled={disabled}
          onClick={handleClear}
          className={`${baseBtn} ${hover} col-span-3 border-gray-300`}
        >
          <div className="w-full h-full flex items-center justify-center text-4xl font-extrabold">
            Clear
          </div>
        </button>
      </div>
    </div>
  );
};

export default KioskNumpad;
