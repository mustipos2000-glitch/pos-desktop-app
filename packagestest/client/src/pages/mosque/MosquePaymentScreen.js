import { useState } from "react";
import { useNavigate } from "react-router-dom";

import FixedBackButton from "../../components/mosque/FixedBackButton";
import SettingsModal from "../../components/common/SettingsModal";
import KeypadNumpad from "../../components/KeypadNumpad";

import {
  KioskLayout,
  KioskHeader,
  KioskCard,
  KioskButton,
} from "../../components/mosque";

const MosquePaymentScreen = () => {
  const navigate = useNavigate();

  const [selectedOption, setSelectedOption] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const handleBack = () => {
    // Pas dit aan als jouw “home” route anders is
    navigate("/pos");
  };

  const handleCardClick = (option) => {
    setSelectedOption(option);
    localStorage.setItem("mosquePaymentType", JSON.stringify(option));

    // reset flow state
    localStorage.removeItem("sadakaType");
    localStorage.removeItem("selectedMember");
    localStorage.removeItem("paymentAmount");

    if (option.id === "sadaka") navigate("/mosque/sadaka-selection");
    else if (option.id === "membership") navigate("/mosque/member-selection");
    else if (option.id === "rent") navigate("/mosque/rent-datetime");
    else navigate("/mosque/amount-entry");
  };

  const handleOpenSettings = () => {
    setShowKeypad(true);
    setPinInput("");
  };

  const handlePinChange = (val) => {
    // afhankelijk van jouw KeypadNumpad gedrag:
    if (val === "CLEAR") return setPinInput("");
    if (val === "BACKSPACE") return setPinInput((p) => p.slice(0, -1));

    if (val === "OK") {
      setShowKeypad(false);
      setShowSettings(true);
      return;
    }

    // digit
    setPinInput((p) => (p + String(val)).slice(0, 6));
  };

  const options = [
    {
      id: "membership",
      titleNl: "Leden",
      titleEn: "Members",
      titleAr: "الأعضاء",
      image: "/images/mosque/leden.png",
    },
    {
      id: "sadaka",
      titleNl: "Sadaqa",
      titleEn: "Sadaqa",
      titleAr: "صدقة",
      image: "/images/mosque/sadaka.png",
    },
    {
      id: "rent",
      titleNl: "Huur ruimte",
      titleEn: "Rent room",
      titleAr: "استئجار قاعة",
      image: "/images/mosque/rent-room.png",
    },
  ];

  return (
    <KioskLayout>
      <FixedBackButton onClick={handleBack} />

      <KioskHeader
        titleNl="Kies een optie"
        titleEn="Choose an option"
        titleAr="اختر خيارا"
        showBack={false}
        rightElement={
          <KioskButton variant="secondary" size="small" onClick={handleOpenSettings}>
            Settings
          </KioskButton>
        }
      />

      <div className="h-full flex flex-col items-center justify-start px-10 pt-10 pb-40">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-10">
          {options.map((option) => (
            <KioskCard
              key={option.id}
              titleNl={option.titleNl}
              titleEn={option.titleEn}
              titleAr={option.titleAr}
              image={option.image}
              selected={selectedOption?.id === option.id}
              onClick={() => handleCardClick(option)}
            />
          ))}
        </div>
      </div>

      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-[520px]">
            <div className="text-center mb-6">
              <div className="text-2xl font-extrabold text-black">PIN</div>
              <div className="text-xl text-gray-600 mt-2">Voer uw pincode in</div>
              <div className="text-2xl font-extrabold mt-4 tracking-widest">
                {"•".repeat(pinInput.length)}
              </div>
            </div>

            <KeypadNumpad value={pinInput} onChange={handlePinChange} showOk okLabel="OK" />

            <div className="mt-6 flex gap-4">
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-2xl py-4 text-xl font-bold"
                onClick={() => setShowKeypad(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-700 hover:bg-green-800 text-white rounded-2xl py-4 text-xl font-bold"
                onClick={() => handlePinChange("OK")}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
    </KioskLayout>
  );
};

export default MosquePaymentScreen;
