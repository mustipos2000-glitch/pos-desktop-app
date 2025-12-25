import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../../components/common/SettingsModal';
import KeypadNumpad from '../../components/KeypadNumpad';
import { 
  KioskLayout, 
  KioskHeader, 
  KioskCard, 
  KioskButton 
} from '../../components/mosque';

const MosquePaymentScreen = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('admin');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('mosqueAdminLoggedIn') === 'true';
  });
  const [showKeypad, setShowKeypad] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const paymentOptions = [
    {
      id: 'membership',
      titleEn: 'Membership Fee',
      titleNl: 'Cotisation',
      titleAr: 'رسوم العضوية',
      icon: '/icon kiosk/leden.png'
    },
    {
      id: 'sadaka',
      titleEn: 'Sadaka / Charity',
      titleNl: 'Sadaka / Don',
      titleAr: 'صدقة',
      icon: '/icon kiosk/sadaka.png'
    },
    {
      id: 'rent',
      titleEn: 'Rent Space / Kitchen',
      titleNl: 'Location salle / cuisine',
      titleAr: 'استئجار قاعة / مطبخ',
      icon: '/icon kiosk/rent room.png'
    }
  ];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    localStorage.setItem('mosquePaymentType', JSON.stringify(option));

    if (option.id === 'membership') {
      navigate('/mosque/member-selection');
    } else if (option.id === 'sadaka') {
      navigate('/mosque/sadaka-selection');
    } else if (option.id === 'rent') {
      // For rent, go directly to member selection, then to date/time page
      // Skip amount entry as it will be calculated from rental charge settings
      navigate('/mosque/member-selection');
    } else {
      navigate('/pos');
    }
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
      // if (isAdminLoggedIn) {
      //   setShowSettings(true);
      // } else {
        // Show password prompt
        setShowPasswordPrompt(true);
      // }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    try {
      // Fetch all users
      const response = await fetch('http://localhost:5000/api/users');
      const users = await response.json();

      // Find user with matching role and password
      const matchedUser = users.find(user => {
        // Strict role matching
        if (selectedUserType === 'superadmin') {
          // Only match Super Admin role
          return user.role === 'Super Admin' && user.pincode === password;
        } else if (selectedUserType === 'admin') {
          // Only match Admin role (not Super Admin)
          return user.role === 'Admin' && user.pincode === password;
        }
        return false;
      });

      if (matchedUser) {
        // Store the logged-in user info
        sessionStorage.setItem('mosqueAdminLoggedIn', 'true');
        sessionStorage.setItem('mosqueAdminUser', JSON.stringify({
          id: matchedUser.id,
          name: matchedUser.name,
          role: matchedUser.role
        }));
        
        setIsAdminLoggedIn(true);
        setShowPasswordPrompt(false);
        setPassword('');
        setPasswordError('');
        setSelectedUserType('admin');
        setShowSettings(true);
      } else {
        setPasswordError('Incorrect password for selected user type');
        setPassword('');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError('Error verifying credentials');
      setPassword('');
    }
  };

  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setPasswordError('');
    setSelectedUserType('admin');
    setClickCount(0);
    setShowKeypad(true);
    setShowPassword(false);
  };

  const handleKeypadInput = (input) => {
    setPassword(prev => prev + input);
    setPasswordError('');
  };

  const handleKeypadBackspace = () => {
    setPassword(prev => prev.slice(0, -1));
    setPasswordError('');
  };

  const handleKeypadClear = () => {
    setPassword('');
    setPasswordError('');
  };

  const handleKeypadEnter = () => {
    // Trigger form submission
    const form = document.getElementById('password-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <>
      <KioskLayout>
        {/* <KioskHeader
          title="What do you want to pay?"
          subtitle="Choose an option to continue"
        /> */}

        {/* Payment Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {paymentOptions.map((option) => (
            <KioskCard
              key={option.id}
              // title={option.titleEn}
              // subtitle={option.titleNl}
              // subtitleAr={option.titleAr}
              icon={option.icon}
              onClick={() => handleOptionSelect(option)}
              selected={selectedOption?.id === option.id}
            />
          ))}
        </div>
      </KioskLayout>

      {/* Secret Click Area - Bottom Left Corner */}
      <div
        onClick={handleSecretClick}
        className="fixed bottom-4 left-4 w-16 h-16"
        style={{ opacity: 0, cursor: 'default' }}
      />

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-6">
          <div className="bg-pos-bg-primary border-2 border-pos-border-primary rounded-3xl shadow-2xl max-w-4xl p-8">
            <h2 className="text-2xl font-bold text-pos-text-primary mb-6">
              Admin Access
            </h2>
            <form id="password-form" onSubmit={handlePasswordSubmit}>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-lg text-pos-text-secondary mb-3">
                    Select User Type
                  </label>
                  <select
                    value={selectedUserType}
                    onChange={(e) => {
                      setSelectedUserType(e.target.value);
                      setPasswordError('');
                    }}
                    className="w-full px-4 py-4 text-lg bg-pos-bg-tertiary border-2 border-pos-border-primary text-pos-text-primary rounded-xl focus:outline-none focus:border-pos-info"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-lg text-pos-text-secondary mb-3">
                    Enter Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className="w-full px-4 py-4 pr-12 text-lg bg-pos-bg-tertiary border-2 border-pos-border-primary text-pos-text-primary rounded-xl focus:outline-none focus:border-pos-info"
                      placeholder="Enter password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-pos-text-secondary hover:text-pos-text-primary transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {passwordError && (
                <p className="text-red-500 text-base mb-4">{passwordError}</p>
              )}
              <div className="flex gap-3 mb-4">
                <KioskButton
                  type="button"
                  variant="secondary"
                  size="medium"
                  fullWidth
                  onClick={handleClosePasswordPrompt}
                >
                  Cancel
                </KioskButton>
                <KioskButton
                  type="submit"
                  variant="primary"
                  size="medium"
                  fullWidth
                >
                  Submit
                </KioskButton>
              </div>
            </form>

            {/* Keyboard Toggle Button */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                className={`px-6 py-3 rounded-xl text-base font-medium transition-colors ${
                  showKeypad
                    ? 'bg-pos-interactive-primary text-white'
                    : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                }`}
              >
                {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
              </button>
            </div>

            {/* On-Screen Keyboard */}
            {showKeypad && (
              <div className="mt-4">
                <KeypadNumpad
                  onInput={handleKeypadInput}
                  onBackspace={handleKeypadBackspace}
                  onClear={handleKeypadClear}
                  onEnter={handleKeypadEnter}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false);
            // Clear admin session when closing settings
            sessionStorage.removeItem('mosqueAdminLoggedIn');
            sessionStorage.removeItem('mosqueAdminUser');
            setIsAdminLoggedIn(false);
          }}
          initialTab="printer"
          limitedTabs={['printer', 'payment']}
          mosqueMode={true}
        />
      )}
    </>
  );
};

export default MosquePaymentScreen;
