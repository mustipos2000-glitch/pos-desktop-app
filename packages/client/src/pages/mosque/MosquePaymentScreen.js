import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../../components/common/SettingsModal';
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
          <div className="bg-pos-bg-primary border-2 border-pos-border-primary rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-pos-text-primary mb-6">
              Admin Access
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-6">
                <label className="block text-lg text-pos-text-secondary mb-3">
                  Select User Type
                </label>
                <select
                  value={selectedUserType}
                  onChange={(e) => {
                    setSelectedUserType(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-4 py-4 text-lg bg-pos-bg-tertiary border-2 border-pos-border-primary text-pos-text-primary rounded-xl focus:outline-none focus:border-pos-info mb-4"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-lg text-pos-text-secondary mb-3">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-4 py-4 text-lg bg-pos-bg-tertiary border-2 border-pos-border-primary text-pos-text-primary rounded-xl focus:outline-none focus:border-pos-info"
                  placeholder="Enter password"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-base mt-2">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3">
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
