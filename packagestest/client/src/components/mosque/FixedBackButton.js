import React, { useRef } from "react";

const FixedBackButton = ({ onClick, disabled }) => {
  const lockRef = useRef(false);

  const fire = () => {
    if (disabled) return;
    if (lockRef.current) return;

    lockRef.current = true;
    try {
      if (typeof onClick === "function") onClick();
    } finally {
      // korte lock om dubbele events (touch->click) te vermijden
      setTimeout(() => {
        lockRef.current = false;
      }, 350);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      // Belangrijk voor touch: pointerup reageert betrouwbaarder dan click
      onPointerUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fire();
      }}
      // fallback (desktop/muis)
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fire();
      }}
      className={[
        "fixed left-6 bottom-6 z-[9999]",
        "bg-red-700 hover:bg-red-800 active:bg-red-900",
        "text-white rounded-2xl shadow-2xl",
        "px-10 py-7",
        "min-w-[240px]",
        "border-2 border-red-900",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation", // voorkomt 300ms delay / ghost clicks
        userSelect: "none",
      }}
    >
      <div className="text-2xl font-extrabold leading-tight">Terug</div>
      <div className="text-xl font-semibold leading-tight opacity-95">Back</div>
      <div className="text-2xl font-extrabold leading-tight" dir="rtl">
        رجوع
      </div>
    </button>
  );
};

export default FixedBackButton;
