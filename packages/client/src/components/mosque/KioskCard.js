import React from "react";

/**
 * KioskCard
 * - Witte achtergrond
 * - Grote, duidelijke teksten
 * - Elke taal eigen kleur
 * - Afbeeldingen blijven origineel van grootte
 */
const KioskCard = ({
  title,
  subtitle,
  subtitleNl,
  subtitleAr,
  onClick,
  selected = false,
  icon = null,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full max-w-sm
        bg-white
        border-2 border-pos-border-primary
        rounded-3xl
        shadow-xl
        px-6 py-8
        flex flex-col items-center justify-center
        transition
        active:scale-[0.99]
        ${selected ? "ring-4 ring-pos-info" : ""}
        ${className}
      `}
    >
      {/* ===== AFBEELDING (ONVERANDERD) ===== */}
      {icon && (
        <div className="w-full flex items-center justify-center">
          {typeof icon === "string" ? (
            <img
              src={icon}
              alt={title || ""}
              className="object-contain"
              draggable={false}
            />
          ) : (
            icon
          )}
        </div>
      )}

      {/* ===== TEKSTEN ===== */}
      {(subtitleNl || subtitle || subtitleAr) && (
        <div className="mt-6 text-center leading-tight">
          {/* Nederlands */}
          {subtitleNl && (
            <div className="text-4xl font-extrabold text-black">
              {subtitleNl}
            </div>
          )}

          {/* Engels */}
          {subtitle && (
            <div className="text-3xl font-semibold text-gray-600 mt-3">
              {subtitle}
            </div>
          )}

          {/* Arabisch */}
          {subtitleAr && (
            <div
              className="text-4xl font-bold text-green-700 mt-4"
              dir="rtl"
            >
              {subtitleAr}
            </div>
          )}
        </div>
      )}
    </button>
  );
};

export default KioskCard;
