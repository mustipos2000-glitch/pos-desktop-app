import { useNavigate } from 'react-router-dom';

/**
 * SadakaSelectionPage - Page for choosing between named or anonymous sadaka
 */
const SadakaSelectionPage = () => {
  const navigate = useNavigate();

  const handleNamedSadaka = () => {
    // Store sadaka type
    localStorage.setItem('sadakaType', 'named');
    
    // Navigate to member selection page
    navigate('/member-selection');
  };

  const handleAnonymousSadaka = () => {
    // Store sadaka type
    localStorage.setItem('sadakaType', 'anonymous');
    
    // Navigate to sadaka goal page to choose the purpose
    navigate('/sadaka-goal');
  };

  const handleGoBack = () => {
    navigate('/mosque-payment');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
          Sadaka
        </h1>
        <p className="text-lg text-pos-text-secondary">
          Choose whether the sadaka is named or anonymous
        </p>
      </div>

      {/* Two Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-8">
        {/* Named Sadaka */}
        <div
          onClick={handleNamedSadaka}
          className="card card-hover bg-pos-bg-secondary cursor-pointer rounded-2xl p-12 transition-all duration-300 border-2 border-pos-border-primary"
        >
          <div className="text-center space-y-3">
            {/* English */}
            <div className="text-2xl font-semibold text-pos-text-primary">
              Sadaka by name
            </div>
            
            {/* French */}
            <div className="text-lg text-pos-text-secondary">
              Sadaka au nom
            </div>
            
            {/* Dutch */}
            <div className="text-lg text-pos-text-secondary">
              Sadaka on name
            </div>
            
            {/* Arabic */}
            <div className="text-xl text-pos-text-secondary" dir="rtl">
              صدقة بالاسم
            </div>
          </div>
        </div>

        {/* Anonymous Sadaka */}
        <div
          onClick={handleAnonymousSadaka}
          className="card card-hover bg-pos-bg-secondary cursor-pointer rounded-2xl p-12 transition-all duration-300 border-2 border-pos-border-primary"
        >
          <div className="text-center space-y-3">
            {/* English */}
            <div className="text-2xl font-semibold text-pos-text-primary">
              Sadaka anonymous
            </div>
            
            {/* French */}
            <div className="text-lg text-pos-text-secondary">
              Sadaka anonyme
            </div>
            
            {/* Dutch */}
            <div className="text-lg text-pos-text-secondary">
              Sadaka anonymous
            </div>
            
            {/* Arabic */}
            <div className="text-xl text-pos-text-secondary" dir="rtl">
              صدقة مجهولة
            </div>
          </div>
        </div>
      </div>

      {/* Go Back Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGoBack}
          className="px-8 py-3 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-base"
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default SadakaSelectionPage;
