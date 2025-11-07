import React, { useEffect, useMemo, useRef, useState } from "react";

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ",", "0", "←"];

export default function CalculatorModal({
  title,
  basePrice = 0,
  onClose,
  onConfirm,
}) {
  const [mode, setMode] = useState("amount");
  const [input, setInput] = useState("");
  const modalRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const numericValue = useMemo(() => {
    if (!input) return 0;
    const normalized = input.replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }, [input]);

  const discount = useMemo(() => {
    if (mode === "amount") return -numericValue;
    return -(basePrice * numericValue) / 100;
  }, [mode, numericValue, basePrice]);

  const finalPrice = Math.max(0, +(basePrice + discount).toFixed(2));

  function handleKey(key) {
    if (key === "←") {
      setInput(""); // full clear
      return;
    }
    if ((key === "," || key === ".") && (input.includes(",") || input.includes("."))) return;
    if (key === "0" && input === "0") return;
    setInput((s) => (s === "0" && key !== "," ? key : s + key));
  }

  function handleOk() {
    if (onConfirm) onConfirm({ discount, mode, rawInput: input });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-pos-interactive-primary rounded-2xl shadow-lg ring-1 ring-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h3 className="text-lg font-medium text-white">{title}</h3>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-300 mb-1">Total</span>
              <div className="text-white text-sm">€ {basePrice.toFixed(2)}</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-300 mb-1">Discount</span>
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-1 rounded">
                {discount < 0 ? `€ ${Math.abs(discount).toFixed(2)}` : "€ 0.00"}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-300 mb-1">Remaining</span>
              <div className="text-green-500 font-semibold">
                € {finalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex flex-col items-center gap-4">
          {/* Input */}
          <div className="w-4/5 bg-slate-50 rounded-md p-3 text-right text-lg font-medium text-slate-700">
            {mode === "percentage"
              ? input
                ? `${input}%`
                : "0%"
              : input
              ? `€ ${input}`
              : "€ 0,00"}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 w-4/5">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className="py-2 rounded-lg bg-pos-bg-primary text-white text-lg shadow-sm"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Mode buttons */}
          <div className="flex justify-between w-4/5 gap-4 mt-2">
            <button
              onClick={() => {
                setMode("amount");
                setInput("");
              }}
              className={`flex-1 py-2 rounded-lg text-center shadow-sm ${
                mode === "amount"
                  ? "bg-pos-bg-primary text-white"
                  : "bg-pos-interactive-hover text-white"
              }`}
            >
              Amount
            </button>

            <button
              onClick={() => {
                setMode("percentage");
                setInput("");
              }}
              className={`flex-1 py-2 rounded-lg text-center shadow-sm ${
                mode === "percentage"
                  ? "bg-pos-bg-primary text-white"
                  : "bg-pos-interactive-hover border-black text-white"
              }`}
            >
              Percentage
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-center items-center w-4/5 gap-4 mt-2 pb-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-center shadow-sm bg-pos-bg-primary text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleOk}
              className="flex-1 py-2 rounded-lg text-center shadow-sm bg-pos-bg-primary text-white"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
