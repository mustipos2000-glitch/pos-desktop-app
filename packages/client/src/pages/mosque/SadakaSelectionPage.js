import { useNavigate } from 'react-router-dom';
import { 
  KioskLayout, 
  KioskHeader, 
  KioskCard, 
  KioskButton 
} from '../../components/mosque';

/**
 * SadakaSelectionPage - Page for choosing between named or anonymous sadaka
 */
const SadakaSelectionPage = () => {
  const navigate = useNavigate();

  const handleNamedSadaka = () => {
    localStorage.setItem('sadakaType', 'named');
    navigate('/mosque/member-selection');
  };

  const handleAnonymousSadaka = () => {
    localStorage.setItem('sadakaType', 'anonymous');
    navigate('/mosque/sadaka-goal');
  };

  const handleGoBack = () => {
    navigate('/mosque');
  };

  return (
    <KioskLayout maxWidth="4xl">
      <KioskHeader 
        title="Sadaka"
        subtitle="Choose whether the sadaka is named or anonymous"
        step={0}
        totalSteps={3}
      />

      {/* Two Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <KioskCard
          title="Sadaka by Name"
          subtitle="Sadaka au nom"
          subtitleNl="Sadaka on name"
          subtitleAr="صدقة بالاسم"
          icon="📝"
          onClick={handleNamedSadaka}
        />

        <KioskCard
          title="Sadaka Anonymous"
          subtitle="Sadaka anonyme"
          subtitleNl="Sadaka anonymous"
          subtitleAr="صدقة مجهولة"
          icon="🔒"
          onClick={handleAnonymousSadaka}
        />
      </div>

      {/* Go Back Button */}
      <div className="flex justify-center">
        <KioskButton
          variant="secondary"
          size="medium"
          onClick={handleGoBack}
        >
          ← Go Back
        </KioskButton>
      </div>
    </KioskLayout>
  );
};

export default SadakaSelectionPage;
