import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/SettingsModal';

const MosquePaymentScreen = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    // Check if admin is already logged in from sessionStorage
    return sessionStorage.getItem('mosqueAdminLoggedIn') === 'true';
  });

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

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
    
    // Reset click count after 2 seconds
    setTimeout(() => {
      setClickCount(0);
    }, 2000);

    // After 3 clicks
    if (clickCount + 1 === 3) {
      setClickCount(0);
      
      // If already logged in, directly open settings (no password)
      if (isAdminLoggedIn) {
        setShowSettings(true);
      } else {
        // Show password prompt
        setShowPasswordPrompt(true);
      }
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (password === '1234') {
      // Set admin logged in flag in sessionStorage (clears when browser/tab closes)
      sessionStorage.setItem('mosqueAdminLoggedIn', 'true');
      setIsAdminLoggedIn(true);
      setShowPasswordPrompt(false);
      setPassword('');
      setPasswordError('');
      setShowSettings(true);
    } else {
      setPasswordError('Incorrect password');
      setPassword('');
    }
  };

  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setPasswordError('');
    setClickCount(0);
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col overflow-hidden">
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center p-8">
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
          <div className="flex justify-center mb-8">
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
            >
              Go back
            </button>
          </div>
        </div>
      </div>

      {/* Secret Click Area - Bottom Left Corner */}
      <div 
        onClick={handleSecretClick}
        className="absolute bottom-4 left-4 w-16 h-16"
        style={{ opacity: 0, cursor: 'default' }}
      />

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-pos-text-primary mb-4">
              Admin Access
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm text-pos-text-secondary mb-2">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info"
                  placeholder="Enter password"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClosePasswordPrompt}
                  className="px-4 py-2 bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary rounded hover:bg-pos-interactive-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pos-interactive-primary text-pos-text-primary rounded hover:bg-pos-interactive-hover"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal - Opens on Printer tab, only show Printer and Payment tabs */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          initialTab="printer"
          limitedTabs={['printer', 'payment']}
        />
      )}
    </div>
  );
};

export default MosquePaymentScreen;
