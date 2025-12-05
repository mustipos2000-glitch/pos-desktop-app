import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../services/paymentService';

const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [amount, setAmount] = useState('0');
  const [paymentType, setPaymentType] = useState(null);
  const [sadakaGoal, setSadakaGoal] = useState(null);
  const [sadakaType, setSadakaType] = useState(null);
  const [rentDateTime, setRentDateTime] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('selectedMember') || 'null');
    const amt = localStorage.getItem('paymentAmount') || '0';
    const type = JSON.parse(localStorage.getItem('mosquePaymentType') || 'null');
    const goal = JSON.parse(localStorage.getItem('sadakaGoal') || 'null');
    const sType = localStorage.getItem('sadakaType');
    const rentDT = JSON.parse(localStorage.getItem('rentDateTime') || 'null');
    
    setMemberInfo(member);
    setAmount(amt);
    setPaymentType(type);
    setSadakaGoal(goal);
    setSadakaType(sType);
    setRentDateTime(rentDT);
  }, []);

  const handleMethodSelect = async (method) => {
    setChecking(true);
    setProcessingMessage('Checking terminal connection...');
    
    try {
      const paymentData = {
        amount: parseFloat(amount),
        member_id: memberInfo?.id,
        payment_type: paymentType?.id,
        reference: `${paymentType?.titleEn || 'Payment'} - ${memberInfo?.fullName}`
      };

      let result;
      
      if (method === 'cash') {
        result = await paymentService.processCashmaticPayment(paymentData);
      } else if (method === 'card') {
        result = await paymentService.processBancontactPayment(paymentData);
      }

      console.log('Terminal check result:', result);

      if (result && result.success) {
        // Terminal is working, store the transaction ID and select the method
        localStorage.setItem('transactionId', result.transaction_id);
        setSelectedMethod(method);
      } else {
        // Show error and still select the method so user can proceed
        const errorMsg = result?.message || result?.error || 'Terminal connection failed';
        alert(`Payment terminal error: ${errorMsg}`);
        
        // Still select the method and generate a transaction ID
        const transactionId = `${method === 'cash' ? 'CASH' : 'BANC'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('transactionId', transactionId);
        setSelectedMethod(method);
      }
    } catch (error) {
      console.error('Terminal check error:', error);
      alert('Failed to connect to payment terminal. Please try again.');
      
      // Still select the method so user can proceed
      const transactionId = `${method === 'cash' ? 'CASH' : 'BANC'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('transactionId', transactionId);
      setSelectedMethod(method);
    } finally {
      setChecking(false);
      setProcessingMessage('');
    }
  };

  const handleGoBack = () => {
    navigate('/amount-entry');
  };

  const handleConfirm = () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    // Payment already processed when method was selected
    // Just store the payment method and navigate
    localStorage.setItem('paymentMethod', selectedMethod);
    
    const paymentData = {
      amount: parseFloat(amount),
      member_id: memberInfo?.id,
      payment_type: paymentType?.id,
      reference: `${paymentType?.titleEn || 'Payment'} - ${memberInfo?.fullName}`
    };
    localStorage.setItem('paymentData', JSON.stringify(paymentData));
    
    console.log('Navigating to ticket-selection...');
    navigate('/ticket-selection');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-pos-text-primary mb-1">
            Choose payment method
          </h1>
          <p className="text-xs text-pos-text-secondary">
            Choose how you want to pay
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleMethodSelect('cash')}
            className={`bg-pos-bg-secondary rounded-lg p-8 transition-all border-2 ${
              selectedMethod === 'cash'
                ? 'border-pos-interactive-hover'
                : 'border-pos-border-primary'
            } hover:border-pos-interactive-hover`}
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">Cashmatic</div>
              <div className="text-base text-pos-text-secondary">Cashmatic</div>
              <div className="text-base text-pos-text-secondary">Cashmatic</div>
              <div className="text-base text-pos-text-secondary" dir="rtl">كاشماتيك</div>
            </div>
          </button>

          <button
            onClick={() => handleMethodSelect('card')}
            className={`bg-pos-bg-secondary rounded-lg p-8 transition-all border-2 ${
              selectedMethod === 'card'
                ? 'border-pos-interactive-hover'
                : 'border-pos-border-primary'
            } hover:border-pos-interactive-hover`}
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">Bancontact</div>
              <div className="text-base text-pos-text-secondary">Bancontact</div>
              <div className="text-base text-pos-text-secondary">Bancontact</div>
              <div className="text-base text-pos-text-secondary" dir="rtl">بانكونتاكت</div>
            </div>
          </button>
        </div>

        <div className="bg-pos-bg-secondary rounded-lg p-4 mb-6 border border-pos-border-primary">
          <div className="text-center space-y-1 text-sm text-pos-text-primary">
            {paymentType && paymentType.id === 'sadaka' ? (
              <>
                <div>
                  <span className="font-semibold">Type:</span>{' '}
                  {sadakaType === 'named' ? 'Sadaka by name' : 'Sadaka anonymous'}
                </div>
                {sadakaType === 'named' && memberInfo && (
                  <div>
                    <span className="font-semibold">Member:</span>{' '}
                    {memberInfo.fullName}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Goal:</span>{' '}
                  {sadakaGoal ? sadakaGoal.titleEn : '—'}
                </div>
              </>
            ) : paymentType && paymentType.id === 'rent' ? (
              <>
                <div>
                  <span className="font-semibold">Type:</span> Rent Space / Kitchen
                </div>
                <div>
                  <span className="font-semibold">Member:</span>{' '}
                  {memberInfo ? memberInfo.fullName : 'None'}
                </div>
                {rentDateTime && (
                  <>
                    <div>
                      <span className="font-semibold">From:</span>{' '}
                      {rentDateTime.startDate} at {rentDateTime.startTime}
                    </div>
                    <div>
                      <span className="font-semibold">To:</span>{' '}
                      {rentDateTime.endDate} at {rentDateTime.endTime}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div>
                  <span className="font-semibold">Type:</span>{' '}
                  {paymentType ? paymentType.titleEn : '—'}
                </div>
                <div>
                  <span className="font-semibold">Member:</span>{' '}
                  {memberInfo ? memberInfo.fullName : 'None'}
                </div>
              </>
            )}
            <div>
              <span className="font-semibold">Amount:</span> € {amount}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || checking}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border text-sm ${
              selectedMethod && !checking
                ? 'bg-pos-bg-secondary text-pos-text-primary hover:bg-pos-interactive-hover border-pos-border-primary'
                : 'bg-pos-interactive-primary text-pos-text-disabled cursor-not-allowed border-pos-border-primary opacity-50'
            }`}
          >
            Confirm
          </button>
        </div>

        {checking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-pos-bg-secondary rounded-lg p-8 text-center border border-pos-border-primary">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pos-text-primary mx-auto mb-4"></div>
              <p className="text-pos-text-primary text-lg font-semibold">
                {processingMessage || 'Checking terminal...'}
              </p>
              <p className="text-pos-text-secondary text-sm mt-2">Please wait...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodPage;
