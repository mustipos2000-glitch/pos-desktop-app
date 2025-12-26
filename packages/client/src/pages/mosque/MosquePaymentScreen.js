import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskHeader, KioskCard } from "../../components/mosque";

/**
 * Eerste pagina (start):
 * - 3 grote knoppen/kaarten
 * - Tekst in 3 talen op de kaart
 * - Zelfde look & grootte als andere pages (via KioskCard)
 */
const MosquePaymentScreen = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);

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

  return (
    <KioskLayout maxWidth="7xl">
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
    </KioskLayout>
  );
};

export default MosquePaymentScreen;
