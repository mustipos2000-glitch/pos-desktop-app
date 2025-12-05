import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cashmaticService from '../services/cashmaticService';
import payworldService from '../services/payworldService';

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
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
    if (processing) return;

    setProcessing(true);
    setShowPaymentModal(true);
    setSelectedMethod(method);
    setProcessingMessage('Starting payment...');
    setPaymentInfo(null);

    const paymentAmount = parseFloat(amount);

    try {
      if (method === 'cash') {
        // Start Cashmatic payment
        await cashmaticService.startPayment(paymentAmount, {
          onStatusUpdate: (info) => {
            setPaymentInfo(info);
            setProcessingMessage(
              `Inserted: €${info.inserted.toFixed(2)} / €${info.requested.toFixed(2)}`
            );
          },
          onSuccess: (result) => {
            setProcessingMessage('Payment successful!');
            localStorage.setItem('paymentMethod', 'cash');
            localStorage.setItem('paymentResult', JSON.stringify(result));
            
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              handleConfirm();
            }, 1500);
          },
          onError: (error) => {
            setProcessingMessage(`Error: ${error.message}`);
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              setSelectedMethod(null);
              alert(`Cashmatic payment failed: ${error.message}`);
            }, 2000);
          },
          onCancel: (result) => {
            setProcessingMessage('Payment cancelled');
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              setSelectedMethod(null);
            }, 1500);
          },
        });
      } else if (method === 'card') {
        // Start Payworld payment
        await payworldService.startPayment(paymentAmount, {
          onStatusUpdate: (status) => {
            setProcessingMessage(status.message || 'Processing...');
          },
          onSuccess: (result) => {
            setProcessingMessage('Payment successful!');
            localStorage.setItem('paymentMethod', 'card');
            localStorage.setItem('paymentResult', JSON.stringify(result));
            
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              handleConfirm();
            }, 1500);
          },
          onError: (error) => {
            setProcessingMessage(`Error: ${error.message}`);
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              setSelectedMethod(null);
              alert(`Payworld payment failed: ${error.message}`);
            }, 2000);
          },
          onCancel: (result) => {
            setProcessingMessage('Payment cancelled');
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              setSelectedMethod(null);
            }, 1500);
          },
          onDeclined: (result) => {
            setProcessingMessage('Payment declined');
            setTimeout(() => {
              setShowPaymentModal(false);
              setProcessing(false);
              setSelectedMethod(null);
              alert('Payment was declined by the terminal');
            }, 2000);
          },
        });
      }
    } catch (error) {
      console.error('Payment start error:', error);
      setProcessingMessage(`Error: ${error.message}`);
      setTimeout(() => {
        setShowPaymentModal(false);
        setProcessing(false);
        setSelectedMethod(null);
        alert(`Failed to start payment: ${error.message}`);
      }, 2000);
    }
  };

  const handleCancelPayment = async () => {
    try {
      if (selectedMethod === 'cash' && cashmaticService.isPaymentInProgress()) {
        await cashmaticService.cancelPayment();
      } else if (selectedMethod === 'card' && payworldService.isPaymentInProgress()) {
        await payworldService.cancelPayment();
      }
    } catch (error) {
      console.error('Cancel payment error:', error);
    }
    
    setShowPaymentModal(false);
    setProcessing(false);
    setSelectedMethod(null);
  };

  const handleGoBack = () => {
    navigate('/amount-entry');
  };

  const handleConfirm = () => {
    // Payment already processed, just navigate
    const paymentData = {
      amount: parseFloat(amount),
      member_id: memberInfo?.id,
      payment_type: paymentType?.id,
      reference: `${paymentType?.titleEn || 'Payment'} - ${memberInfo?.firstName} ${memberInfo?.name}`
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
            disabled={processing}
            className={`bg-pos-bg-secondary rounded-lg p-8 transition-all border-2 ${
              selectedMethod === 'cash'
                ? 'border-pos-interactive-hover'
                : 'border-pos-border-primary'
            } hover:border-pos-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed`}
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
            disabled={processing}
            className={`bg-pos-bg-secondary rounded-lg p-8 transition-all border-2 ${
              selectedMethod === 'card'
                ? 'border-pos-interactive-hover'
                : 'border-pos-border-primary'
            } hover:border-pos-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed`}
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
                    {`${memberInfo.firstName} ${memberInfo.name}`}
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
                  {memberInfo ? `${memberInfo.firstName} ${memberInfo.name}` : 'None'}
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
                  {memberInfo ? `${memberInfo.firstName} ${memberInfo.name}` : 'None'}
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
            disabled={processing}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go back
          </button>
        </div>

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-pos-bg-secondary rounded-lg p-8 text-center border border-pos-border-primary max-w-md">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pos-text-primary mx-auto mb-4"></div>
              <p className="text-pos-text-primary text-lg font-semibold mb-2">
                {processingMessage || 'Processing payment...'}
              </p>
              {paymentInfo && (
                <div className="text-pos-text-secondary text-sm mt-4 space-y-1">
                  <p>State: {paymentInfo.state}</p>
                  {paymentInfo.inserted !== undefined && (
                    <>
                      <p>Inserted: €{paymentInfo.inserted.toFixed(2)}</p>
                      <p>Requested: €{paymentInfo.requested.toFixed(2)}</p>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={handleCancelPayment}
                className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodPage;
