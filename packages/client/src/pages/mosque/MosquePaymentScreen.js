import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskHeader, KioskCard } from "../../components/mosque";
import AdminPasswordModal from "../../components/mosque/AdminPasswordModal";

/**
 * Eerste pagina (start):
 * - 3 grote knoppen/kaarten
 * - Tekst in 3 talen op de kaart
 * - Zelfde look & grootte als andere pages (via KioskCard)
 */
const MosquePaymentScreen = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Track clicks for admin access
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);
  const CLICK_RESET_TIME = 2000; // Reset after 2 seconds of no clicks
  const REQUIRED_CLICKS = 4;

  const options = [
    {
      id: "members",
      titleNl: "Leden",
      titleEn: "Members",
      titleAr: "الأعضاء",
      icon: "/icon kiosk/leden.png",
      route: "/mosque/member-selection",
    },
    {
      id: "sadaka",
      titleNl: "Sadaqa",
      titleEn: "Sadaqa",
      titleAr: "الصدقة",
      icon: "/icon kiosk/sadaka.png",
      route: "/mosque/sadaka-selection",
    },
    {
      id: "rent",
      titleNl: "Huur Ruimte",
      titleEn: "Hall rental",
      titleAr: "استئجار القاعة",
      icon: "/icon kiosk/rent room.png",
      route: "/mosque/rent-datetime",
    },
  ];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    // voor zekerheid: clear oude flow-data die problemen kan geven
    localStorage.removeItem("paymentAmount");
    localStorage.removeItem("mosquePaymentType");
    localStorage.removeItem("selectedMember");
    localStorage.removeItem("sadakaGoal");
    localStorage.removeItem("sadakaType");
    localStorage.removeItem("rentDateTime");

    navigate(option.route);
  };

  // Handle hidden admin area click
  const handleAdminAreaClick = () => {
    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Increment click count
    clickCountRef.current += 1;

    // If we reached the required clicks, show password modal
    if (clickCountRef.current >= REQUIRED_CLICKS) {
      clickCountRef.current = 0;
      setShowPasswordModal(true);
    } else {
      // Set timeout to reset click count
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, CLICK_RESET_TIME);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    navigate('/mosque/admin');
  };

  return (
    <KioskLayout maxWidth="7xl">
      {/* Hidden Admin Access Area - Top Right Corner */}
      <div
        onClick={handleAdminAreaClick}
        className="absolute top-0 right-0 w-20 h-20 z-10"
        style={{ 
          // Make it invisible but clickable
          backgroundColor: 'transparent',
          // Optional: uncomment for debugging
          // backgroundColor: 'rgba(255, 0, 0, 0.1)',
        }}
        title=""
      />

      <KioskHeader
        titleNl="Kies een optie"
        titleEn="Choose an option"
        titleAr="اختر خيارًا"
      />

      {/* Kaarten: zelfde grootte, netjes uitgelijnd */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
        {options.map((option) => (
          <KioskCard
            key={option.id}
            icon={option.icon}
            subtitleNl={option.titleNl}
            subtitle={option.titleEn}
            subtitleAr={option.titleAr}
            onClick={() => handleOptionSelect(option)}
            selected={selectedOption?.id === option.id}
          />
        ))}
      </div>

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
    </KioskLayout>
  );
};

export default MosquePaymentScreen;
