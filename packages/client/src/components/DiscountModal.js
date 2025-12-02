import React, { useEffect, useMemo, useRef, useState } from "react";
import Toast from "./Toast";

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
  const [toastMessage, setToastMessage] = useState("");

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
    
    // Prevent percentage from exceeding 100%
    const newInput = input === "0" && key !== "," ? key : input + key;
    if (mode === "percentage") {
      const normalized = newInput.replace(",", ".");
      const value = parseFloat(normalized);
      if (Number.isFinite(value) && value > 100) {
        return; // Don't allow input if it would exceed 100%
      }
    }
    
    setInput((s) => (s === "0" && key !== "," ? key : s + key));
  }

  function handleOk() {
    // Validate percentage doesn't exceed 100%
    if (mode === "percentage" && numericValue > 100) {
      setToastMessage("Percentage discount cannot exceed 100%");
      return;
    }
    
    // Validate discount doesn't exceed base price
    if (Math.abs(discount) > basePrice) {
      setToastMessage("Discount cannot exceed the total amount");
      return;
    }
    
    if (onConfirm) onConfirm({ discount, mode, rawInput: input });
  }

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage("")}
        />
      )}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
        <div
          ref={modalRef}
          className="w-full max-w-md bg-pos-interactive-primary rounded-2xl shadow-lg ring-1 ring-slate-200 overflow-hidden"
        >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h3 className="text-lg font-semibold text-pos-text-primary">{title}</h3>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs text-pos-text-muted mb-1 font-medium">Total</span>
              <div className="text-pos-text-primary text-base font-bold">€ {basePrice.toFixed(2)}</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-pos-text-muted mb-1 font-medium">Discount</span>
              <div className="bg-red-100 border-2 border-red-400 text-red-700 text-sm font-bold px-3 py-1 rounded">
                {discount < 0 ? `€ ${Math.abs(discount).toFixed(2)}` : "€ 0.00"}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-pos-text-muted mb-1 font-medium">Remaining</span>
              <div className="text-green-600 font-bold text-base">
                € {finalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex flex-col items-center gap-4">
          {/* Input */}
          <div className="w-4/5 bg-pos-bg-primary border-2 border-pos-border-primary rounded-md p-3 text-right text-xl font-bold text-pos-text-primary">
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
                className="py-3 rounded-lg bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary text-xl font-bold shadow-sm"
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
              className={`flex-1 py-2 rounded-lg text-center shadow-sm font-semibold ${
                mode === "amount"
                  ? "bg-pos-info text-white"
                  : "bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary"
              }`}
            >
              Amount
            </button>

            <button
              onClick={() => {
                setMode("percentage");
                setInput("");
              }}
              className={`flex-1 py-2 rounded-lg text-center shadow-sm font-semibold ${
                mode === "percentage"
                  ? "bg-pos-info text-white"
                  : "bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary"
              }`}
            >
              Percentage
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-center items-center w-4/5 gap-4 mt-2 pb-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-center shadow-sm bg-pos-error hover:bg-red-600 text-white font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleOk}
              className="flex-1 py-2 rounded-lg text-center shadow-sm bg-pos-success hover:bg-green-600 text-white font-semibold"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
