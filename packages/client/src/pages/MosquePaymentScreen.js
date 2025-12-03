import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const MosquePaymentScreen = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
    
    // If membership fee is selected, navigate to member selection page
    if (option.id === 'membership') {
      navigate('/member-selection');
    } else {
      // For other options, navigate directly to POS screen
      navigate('/pos');
    }
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      {/* Top Bar with Theme Toggle */}
      <div className="bg-pos-bg-secondary px-6 py-4 border-b border-pos-border-primary flex justify-between items-center">
        <div className="flex-1">
          {selectedOption && (
            <p className="text-pos-text-primary text-lg">
              Selected: <span className="font-bold">{selectedOption.titleEn}</span>
            </p>
          )}
        </div>
        <button
          onClick={toggleTheme}
          className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-lg flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white rounded-lg"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
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
      </div>

      {/* Bottom Bar */}
      {selectedOption && (
        <div className="bg-pos-bg-secondary px-6 py-4 border-t border-pos-border-primary">
          <p className="text-pos-text-primary text-center text-lg">
            Selected: <span className="font-bold">{selectedOption.titleEn}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MosquePaymentScreen;
