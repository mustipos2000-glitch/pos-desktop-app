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
    <KioskLayout maxWidth="">
      {/* <KioskHeader 
        title="Sadaka"
        subtitle="Choose whether the sadaka is named or anonymous"
        step={0}
        totalSteps={3}
      /> */}
    {/* Go Back Button */}
      <div className="absolute left-2 top-1 w-24">
        <KioskButton
          variant="secondary"
          size="medium"
          onClick={handleGoBack}
          icon={"true"}
        >
          <img 
            src="/icon kiosk/terug.png" 
            alt="Go Back" 
            className="rounded-3xl"
          />
          {/* Go Back */}
        </KioskButton>
      </div>

      {/* Two Options */}
      <div className="flex justify-center my-auto flex gap-6 ">
        <KioskCard
          // title="Sadaka by Name"
          // subtitle="Sadaka au nom"
          // subtitleNl="Sadaka on name"
          // subtitleAr="صدقة بالاسم"
          icon="/icon kiosk/leden.png"
          onClick={handleNamedSadaka}
          className='max-w-sm'
        />

        <KioskCard
          // title="Sadaka Anonymous"
          // subtitle="Sadaka anonyme"
          // subtitleNl="Sadaka anonymous"
          // subtitleAr="صدقة مجهولة"
          icon="/icon kiosk/anoniem.png"
          className='max-w-sm'
          onClick={handleAnonymousSadaka}
        />
      </div>

     
    </KioskLayout>
  );
};

export default SadakaSelectionPage;
