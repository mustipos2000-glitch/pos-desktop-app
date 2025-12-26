import React from "react";

/**
 * KioskHeader
 * - Default: showBack = false (dus GEEN terug-icoon meer)
 * - Als je toch een back in header wil: showBack={true} + onBack
 */
const KioskHeader = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  backIconSrc = "/icon kiosk/terug.png",
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full flex items-center justify-center py-4">
        {showBack && typeof onBack === "function" && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-2xl p-3 shadow-lg border border-black/10"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <img
              src={backIconSrc}
              alt="Back"
              className="w-10 h-10 object-contain"
              draggable={false}
            />
          </button>
        )}

        <div className="text-center px-6">
          {title ? (
            <div className="text-4xl font-extrabold text-white">{title}</div>
          ) : null}
          {subtitle ? (
            <div className="text-xl font-semibold text-white/80 mt-2">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default KioskHeader;
