import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PaymentMethodPage - A page for selecting payment method (Cash/Card)
 * Shows member details and amount before confirming payment
 */
const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [amount, setAmount] = useState('0');
  const [paymentType, setPaymentType] = useState(null);

  useEffect(() => {
    // Load data from localStorage
    const member = JSON.parse(localStorage.getItem('selectedMember') || 'null');
    const amt = localStorage.getItem('paymentAmount') || '0';
    const type = JSON.parse(localStorage.getItem('mosquePaymentType') || 'null');
    
    setMemberInfo(member);
    setAmount(amt);
    setPaymentType(type);
  }, []);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleGoBack = () => {
    navigate('/amount-entry');
  };

  const handleConfirm = () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    // Store payment method
    localStorage.setItem('paymentMethod', selectedMethod);

    // Navigate to ticket selection page
    navigate('/ticket-selection');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-pos-text-primary mb-1">
            Choose payment method
          </h1>
          <p className="text-xs text-pos-text-secondary">
            Choose how you want to pay
          </p>
        </div>

        {/* Payment Method Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Cashmatic Card */}
          <button
            onClick={() => handleMethodSelect('cash')}
            className={`bg-pos-bg-secondary rounded-lg p-8 transition-all border-2 ${
              selectedMethod === 'cash'
                ? 'border-pos-interactive-hover'
                : 'border-pos-border-primary'
            } hover:border-pos-interactive-hover`}
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">
                Cashmatic
              </div>
              <div className="text-base text-pos-text-secondary">
                Cashmatic
              </div>
              <div className="text-base text-pos-text-secondary">
                Cashmatic
              </div>
              <div className="text-base text-pos-text-secondary" dir="rtl">
                كاشماتيك
              </div>
            </div>
          </button>

          {/* Bancontact Card */}
          <button
            onClick={() => handleMethodSelect('card')}
            className={`bg-pos-bg-secondary rounded-lg p-8 transition-all border-2 ${
              selectedMethod === 'card'
                ? 'border-pos-interactive-hover'
                : 'border-pos-border-primary'
            } hover:border-pos-interactive-hover`}
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">
                Bancontact
              </div>
              <div className="text-base text-pos-text-secondary">
                Bancontact
              </div>
              <div className="text-base text-pos-text-secondary">
                Bancontact
              </div>
              <div className="text-base text-pos-text-secondary" dir="rtl">
                بانكونتاكت
              </div>
            </div>
          </button>
        </div>

        {/* Member Info Display */}
        <div className="bg-pos-bg-secondary rounded-lg p-4 mb-6 border border-pos-border-primary">
          <div className="text-center space-y-1 text-sm text-pos-text-primary">
            <div>
              <span className="font-semibold">Member:</span>{' '}
              {memberInfo ? `${memberInfo.firstName} ${memberInfo.name}` : 'None'}
            </div>
            <div>
              <span className="font-semibold">Type:</span>{' '}
              {paymentType ? paymentType.titleEn : '—'}
            </div>
            <div>
              <span className="font-semibold">Goal:</span> —
            </div>
            <div>
              <span className="font-semibold">Date/time:</span> —
            </div>
            <div>
              <span className="font-semibold">Amount:</span> € {amount}
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border text-sm ${
              selectedMethod
                ? 'bg-pos-bg-secondary text-pos-text-primary hover:bg-pos-interactive-hover border-pos-border-primary'
                : 'bg-pos-interactive-primary text-pos-text-disabled cursor-not-allowed border-pos-border-primary opacity-50'
            }`}
          >
            Confirm (demo)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodPage;
