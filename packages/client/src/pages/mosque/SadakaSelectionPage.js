import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskCard, KioskButton } from "../../components/mosque";

const SadakaSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <KioskLayout>
      {/* TERUG */}
      <div className="mb-6">
        <KioskButton variant="secondary" onClick={() => navigate("/mosque")}>
          ← Terug
        </KioskButton>
      </div>

      <div className="flex justify-center gap-6">
        <KioskCard
          icon="/icon kiosk/leden.png"
          subtitleNl="Op naam"
          subtitle="By name"
          subtitleAr="صدقة بالاسم"
          onClick={() => {
            localStorage.setItem("sadakaType", "named");
            navigate("/mosque/member-selection");
          }}
        />

        <KioskCard
          icon="/icon kiosk/anoniem.png"
          subtitleNl="Anoniem"
          subtitle="Anonymous"
          subtitleAr="صدقة مجهولة"
          onClick={() => {
            localStorage.setItem("sadakaType", "anonymous");
            navigate("/mosque/sadaka-goal");
          }}
        />
      </div>
    </KioskLayout>
  );
};

export default SadakaSelectionPage;
