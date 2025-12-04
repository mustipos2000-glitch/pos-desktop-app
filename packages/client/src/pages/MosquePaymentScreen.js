import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MosquePaymentScreen = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);

  const paymentOptions = [
    {
      id: 'membership',
      titleEn: 'Membership fee',
      titleNl: 'Cotisation',
      titleAr: 'رسوم العضوية'
    },
    {
      id: 'sadaka',
      titleEn: 'Sadaka / Charity',
      titleNl: 'Sadaka / Don',
      titleAr: 'صدقة'
    },
    {
      id: 'rent',
      titleEn: 'Rent space / Kitchen',
      titleNl: 'Location salle / cuisine',
      titleAr: 'استئجار قاعة / مطبخ'
    }
  ];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    // Store payment type
    localStorage.setItem('mosquePaymentType', JSON.stringify(option));
    
    // Navigate based on payment type
    if (option.id === 'membership') {
      navigate('/member-selection');
    } else if (option.id === 'sadaka') {
      navigate('/sadaka-selection');
    } else if (option.id === 'rent') {
      navigate('/member-selection');
    } else {
      navigate('/pos');
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
            What do you want to pay?
          </h1>
          <p className="text-lg text-pos-text-secondary">
            Choose an option to continue
          </p>
        </div>

        {/* Payment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-8">
          {paymentOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              className="card card-hover bg-pos-bg-secondary cursor-pointer rounded-2xl p-10 transition-all duration-300 border-2 border-pos-border-primary"
            >
              <div className="text-center space-y-3">
                {/* English */}
                <div className="text-xl font-semibold text-pos-text-primary">
                  {option.titleEn}
                </div>
                
                {/* Dutch */}
                <div className="text-lg text-pos-text-secondary">
                  {option.titleNl}
                </div>
                
                {/* Arabic */}
                <div className="text-lg text-pos-text-secondary" dir="rtl">
                  {option.titleAr}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
        </div>
      </div>


    </div>
  );
};

export default MosquePaymentScreen;
