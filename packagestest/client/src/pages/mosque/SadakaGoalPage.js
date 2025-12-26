import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskCard } from "../../components/mosque";
import FixedBackButton from "../../components/mosque/FixedBackButton";

const SadakaGoalPage = () => {
  const navigate = useNavigate();

  const goals = [
    { id: "mosque", nl: "Moskee", en: "Mosque", ar: "المسجد", icon: "/icon kiosk/mosque.png" },
    { id: "mortuary", nl: "Mortuarium", en: "Mortuary", ar: "بيت الجنائز", icon: "/icon kiosk/mortuarium.png" },
    { id: "renovation", nl: "Renovatie", en: "Renovation", ar: "التجديد", icon: "/icon kiosk/renovation.png" },
  ];

  const handleSelect = (goal) => {
    localStorage.setItem("sadakaGoal", JSON.stringify(goal));
    navigate("/mosque/amount-entry");
  };

  const handleGoBack = () => {
    navigate("/mosque/sadaka-selection");
  };

  return (
    <KioskLayout>
      <FixedBackButton onClick={handleGoBack} />

      <div className="flex justify-center gap-6">
        {goals.map((g) => (
          <KioskCard
            key={g.id}
            icon={g.icon}
            subtitleNl={g.nl}
            subtitle={g.en}
            subtitleAr={g.ar}
            onClick={() => handleSelect(g)}
          />
        ))}
      </div>
    </KioskLayout>
  );
};

export default SadakaGoalPage;
