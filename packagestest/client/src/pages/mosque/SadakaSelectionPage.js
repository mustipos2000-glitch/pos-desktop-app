import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskCard } from "../../components/mosque";
import FixedBackButton from "../../components/mosque/FixedBackButton";

const SadakaSelectionPage = () => {
  const navigate = useNavigate();

  const handleNamedSadaka = () => {
    localStorage.setItem("sadakaType", "named");
    navigate("/mosque/member-selection");
  };

  const handleAnonymousSadaka = () => {
    localStorage.setItem("sadakaType", "anonymous");
    navigate("/mosque/sadaka-goal");
  };

  const handleGoBack = () => {
    navigate("/mosque");
  };

  return (
    <KioskLayout maxWidth="">
      <FixedBackButton onClick={handleGoBack} />

      <div className="flex justify-center my-auto flex gap-6">
        <KioskCard icon="/icon kiosk/leden.png" onClick={handleNamedSadaka} className="max-w-sm" />
        <KioskCard icon="/icon kiosk/anoniem.png" className="max-w-sm" onClick={handleAnonymousSadaka} />
      </div>
    </KioskLayout>
  );
};

export default SadakaSelectionPage;
