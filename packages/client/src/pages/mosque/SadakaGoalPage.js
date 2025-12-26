import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskCard, KioskButton } from "../../components/mosque";

const SadakaGoalPage = () => {
  const navigate = useNavigate();

  const goals = [
    {
      id: "mosque",
      nl: "Moskee",
      en: "Mosque",
      ar: "المسجد",
      icon: "/icon kiosk/mosque.png",
    },
    {
      id: "mortuary",
      nl: "Mortuarium",
      en: "Mortuary",
      ar: "بيت الجنائز",
      icon: "/icon kiosk/mortuarium.png",
    },
    {
      id: "renovation",
      nl: "Renovatie",
      en: "Renovation",
      ar: "التجديد",
      icon: "/icon kiosk/renovation.png",
    },
  ];

  return (
    <KioskLayout>
      {/* TERUG */}
      <div className="mb-6">
        <KioskButton variant="secondary" onClick={() => navigate("/mosque/sadaka-selection")}>
          ← Terug
        </KioskButton>
      </div>

      <div className="flex justify-center gap-6">
        {goals.map((g) => (
          <KioskCard
            key={g.id}
            icon={g.icon}
            subtitleNl={g.nl}
            subtitle={g.en}
            subtitleAr={g.ar}
            onClick={() => {
              localStorage.setItem("sadakaGoal", JSON.stringify(g));
              navigate("/mosque/amount-entry");
            }}
          />
        ))}
      </div>
    </KioskLayout>
  );
};

export default SadakaGoalPage;
