import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KioskLayout from '../components/kiosk/KioskLayout';
import KioskHeader from '../components/kiosk/KioskHeader';
import KioskButton from '../components/kiosk/KioskButton';
import KioskNumpad from '../components/kiosk/KioskNumpad';
import KioskInfoPanel from '../components/kiosk/KioskInfoPanel';

/**
 * AmountEntryPage - A page for entering payment amount using a numpad
 */
const AmountEntryPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('0');
  const [selectedInfo, setSelectedInfo] = useState(null);

  useEffect(() => {
    loadSelectedInfo();
  }, []);

  const loadSelectedInfo = () => {
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    const sadakaType = localStorage.getItem('sadakaType');
    const sadakaGoalStr = localStorage.getItem('sadakaGoal');
    const selectedMemberStr = localStorage.getItem('selectedMember');
    const rentDateTimeStr = localStorage.getItem('rentDateTime');

    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      const sadakaGoal = sadakaGoalStr ? JSON.parse(sadakaGoalStr) : null;
      const selectedMember = selectedMemberStr ? JSON.parse(selectedMemberStr) : null;
      const rentDateTime = rentDateTimeStr ? JSON.parse(rentDateTimeStr) : null;

      if (paymentType && paymentType.id === 'sadaka') {
        if (sadakaType === 'named' && selectedMember) {
          setSelectedInfo({
            type: 'sadaka-named',
            member: selectedMember.fullName,
            goal: sadakaGoal ? sadakaGoal.titleEn : 'Not selected'
          });
        } else if (sadakaType === 'anonymous' && sadakaGoal) {
          setSelectedInfo({
            type: 'sadaka-anonymous',
            goal: sadakaGoal.titleEn
          });
        }
      } else if (paymentType && paymentType.id === 'rent' && selectedMember && rentDateTime) {
        setSelectedInfo({
          type: 'rent',
          member: selectedMember.fullName,
          startDate: rentDateTime.startDate,
          endDate: rentDateTime.endDate,
          startTime: rentDateTime.startTime,
          endTime: rentDateTime.endTime
        });
      } else if (selectedMember) {
        setSelectedInfo({
          type: 'membership',
          member: selectedMember.fullName
        });
      }
    } catch (error) {
      console.error('Error loading selected info:', error);
    }
  };

  const handleClear = () => {
    setAmount('0');
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount('0');
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleGoBack = () => {
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');

    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;

      if (paymentType && paymentType.id === 'sadaka') {
        navigate('/sadaka-goal');
      } else if (paymentType && paymentType.id === 'rent') {
        navigate('/rent-datetime');
      } else {
        navigate('/member-selection');
      }
    } catch (error) {
      console.error('Error parsing payment type:', error);
      navigate('/member-selection');
    }
  };

  const handleNext = () => {
    if (amount === '0' || amount === '') {
      alert('Please enter an amount greater than 0');
      return;
    }

    localStorage.setItem('paymentAmount', amount);
    navigate('/payment-method');
  };

  const formatAmount = (value) => {
    return `€ ${value}`;
  };

  // Build info panel items
  const getInfoItems = () => {
    if (!selectedInfo) return [];
    
    const items = [];
    
    if (selectedInfo.type === 'sadaka-named') {
      items.push({ label: 'Type', value: 'Named Sadaka' });
      items.push({ label: 'Member', value: selectedInfo.member });
      items.push({ label: 'Goal', value: selectedInfo.goal });
    } else if (selectedInfo.type === 'sadaka-anonymous') {
      items.push({ label: 'Type', value: 'Anonymous Sadaka' });
      items.push({ label: 'Goal', value: selectedInfo.goal });
    } else if (selectedInfo.type === 'rent') {
      items.push({ label: 'Type', value: 'Rent Space/Kitchen' });
      items.push({ label: 'Member', value: selectedInfo.member });
      items.push({ label: 'From', value: `${selectedInfo.startDate} ${selectedInfo.startTime}` });
      items.push({ label: 'To', value: `${selectedInfo.endDate} ${selectedInfo.endTime}` });
    } else if (selectedInfo.type === 'membership') {
      items.push({ label: 'Type', value: 'Membership Fee' });
      items.push({ label: 'Member', value: selectedInfo.member });
    }
    
    return items;
  };

  return (
    <KioskLayout maxWidth="4xl">
      <KioskHeader 
        title="Enter Amount"
        subtitle="Use the keypad to enter the payment amount"
        step={2}
        totalSteps={3}
        className="mb-4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column - Info and Amount Display */}
        <div className="space-y-4">
          {/* Context Info */}
          {selectedInfo && (
            <KioskInfoPanel items={getInfoItems()} />
          )}

          {/* Amount Display */}
          <div className="flex justify-center">
            <div className="bg-pos-bg-secondary border-2 border-pos-border-primary rounded-2xl px-12 py-6 shadow-xl">
              <div className="text-5xl font-bold text-pos-text-primary">
                {formatAmount(amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Numpad */}
        <div>
          <KioskNumpad
            value={amount}
            onChange={setAmount}
            onClear={handleClear}
            onBackspace={handleBackspace}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <KioskButton
          variant="secondary"
          size="medium"
          onClick={handleGoBack}
        >
          ← Go Back
        </KioskButton>
        
        <KioskButton
          variant="success"
          size="medium"
          onClick={handleNext}
        >
          Next →
        </KioskButton>
      </div>
    </KioskLayout>
  );
};

export default AmountEntryPage;
