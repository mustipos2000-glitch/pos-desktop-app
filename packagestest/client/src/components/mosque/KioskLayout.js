import React from "react";

/**
 * KioskLayout - Consistent layout wrapper for all kiosk screens
 * - Background image
 * - Centered width with maxWidth
 * - Push content lower (requested)
 */
const KioskLayout = ({ children, maxWidth = "6xl", className = "" }) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  };

  return (
    <div
      className="min-h-screen bg-pos-bg-primary flex items-start justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/icon kiosk/background kiosk mosque.png')",
      }}
    >
      {/* 
        pt-16 zorgt dat ALLE kaders/kaarten op elke pagina lager komen.
        Als je nog lager wil: pt-20 of pt-24.
      */}
      <div
        className={`w-full ${maxWidthClasses[maxWidth] || "max-w-6xl"} pt-16 pb-10 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default KioskLayout;
