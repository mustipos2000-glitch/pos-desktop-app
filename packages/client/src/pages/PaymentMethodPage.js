import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import KioskButton from '../components/kiosk/KioskButton';

const PaymentMethodPage = () => {
  const navigate = useNavigate();

  const formatAmount = (value) => {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return num.toFixed(2);
  };

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [amount, setAmount] = useState('0');
  const [paymentType, setPaymentType] = useState(null);
  const [sadakaGoal, setSadakaGoal] = useState(null);
  const [sadakaType, setSadakaType] = useState(null);
  const [rentDateTime, setRentDateTime] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Cashmatic state
  const [cashmaticSessionId, setCashmaticSessionId] = useState(null);
  const [cashmaticPolling, setCashmaticPolling] = useState(false);
  const [cashmaticInfo, setCashmaticInfo] = useState({
    requested: 0,
    inserted: 0,
    dispensed: 0,
    notDispensed: 0,
    state: null,
  });
  const [showCashmaticModal, setShowCashmaticModal] = useState(false);

  // Payworld state
  const [showPayworldModal, setShowPayworldModal] = useState(false);
  const [payworldStatus, setPayworldStatus] = useState({
    state: "IDLE", // 'IN_PROGRESS' | 'APPROVED' | 'DECLINED' | 'CANCELLED' | 'ERROR'
    message: "",
    details: null,
  });
  const [payworldSessionId, setPayworldSessionId] = useState(null);
  const [payworldPolling, setPayworldPolling] = useState(false);
  const payworldFinalizedRef = useRef(false);

  // Function to save mosque payment to database
  const saveMosquePayment = async (paymentMethod, paymentAmount) => {
    try {
      // Generate transaction ID if not exists
      let transactionId = localStorage.getItem('transactionId');
      if (!transactionId) {
        transactionId = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('transactionId', transactionId);
      }

      // Get member fee amount to check if it's half payment
      const memberFeeAmountStr = localStorage.getItem('memberFeeAmount');
      const memberFeeAmount = memberFeeAmountStr ? parseFloat(memberFeeAmountStr) : null;
      
      // Determine if it's half payment (for membership only)
      const isHalfPayment = paymentType?.id === 'membership' && 
                           memberFeeAmount && 
                           Math.abs(paymentAmount - (memberFeeAmount / 2)) < 0.01;

      // Prepare payment data
      const mosquePaymentData = {
        transaction_id: transactionId,
        member_id: memberInfo?.id || null,
        member_name: memberInfo?.fullName || 'Anonymous',
        payment_type: paymentType?.id || 'unknown',
        payment_subtype: null,
        amount: paymentAmount,
        payment_method: paymentMethod,
        sadaka_goal: null,
        sadaka_type: null,
        rent_start_date: null,
        rent_start_time: null,
        rent_end_date: null,
        rent_end_time: null,
        is_half_payment: isHalfPayment,
        status: 'completed'
      };

      // Add specific details based on payment type
      if (paymentType?.id === 'sadaka') {
        mosquePaymentData.sadaka_type = sadakaType;
        mosquePaymentData.sadaka_goal = sadakaGoal?.titleEn || null;
        mosquePaymentData.payment_subtype = sadakaType === 'named' ? 'Named Sadaka' : 'Anonymous Sadaka';
      } else if (paymentType?.id === 'rent' && rentDateTime) {
        mosquePaymentData.rent_start_date = rentDateTime.startDate;
        mosquePaymentData.rent_start_time = rentDateTime.startTime;
        mosquePaymentData.rent_end_date = rentDateTime.endDate;
        mosquePaymentData.rent_end_time = rentDateTime.endTime;
        mosquePaymentData.payment_subtype = 'Rent Space/Kitchen';
      } else if (paymentType?.id === 'membership') {
        mosquePaymentData.payment_subtype = isHalfPayment ? 'Half Payment' : 'Full Payment';
      }

      // Save to database
      console.log('Saving mosque payment:', mosquePaymentData);
      const response = await ApiService.createMosquePayment(mosquePaymentData);
      console.log('Mosque payment saved successfully:', response);
      
      return response;
    } catch (error) {
      console.error('Error saving mosque payment:', error);
      // Don't throw error - payment was successful, just log the database save failure
    }
  };

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

  // Poll Cashmatic payment status
  useEffect(() => {
    if (!cashmaticPolling || !cashmaticSessionId) return;

    const poll = async () => {
      console.log("Start polling");

      const res = await ApiService.getCashmaticStatus(cashmaticSessionId);
      const s = res.data || res;
      console.log("Cashmatic status:", s);

      const requested = (s.requestedAmount || 0) / 100;
      const inserted = (s.insertedAmount || 0) / 100;
      const dispensed = (s.dispensedAmount || 0) / 100;
      const notDispensed = (s.notDispensedAmount || 0) / 100;

      setCashmaticInfo({
        requested,
        inserted,
        dispensed,
        notDispensed,
        state: s.state,
      });

      // if (s.state === "IN_PROGRESS" || s.state === "PAID") {
      //   console.log("state is in Progress or Paid");
      //   return;
      // }

      if (s.state === "PAID" || s.state === "FINISHED" || s.state === "FINISHED_MANUAL") {
        console.log("Finished the Cashmatic ");

        setCashmaticPolling(false);
        const currentSessionId = cashmaticSessionId;
        setCashmaticSessionId(null);



        const paymentAmount = parseFloat(amount);

        try {
          // Call finish API to close transaction and print receipt on Cashmatic
          console.log("Calling finish API to close Cashmatic transaction... Mosque");
          await ApiService.finishCashmaticPayment(currentSessionId);

          // Save mosque payment to database
          await saveMosquePayment('cash', paymentAmount);

          localStorage.setItem('paymentMethod', 'cash');
          localStorage.setItem('paymentResult', JSON.stringify({
            success: true,
            state: s.state,
            totalPaid: paymentAmount,
            cashAmount: paymentAmount,
            cardAmount: 0,
            changeDue: 0,
            manualChangeRequired: s.state === "FINISHED_MANUAL",
          }));

          setProcessing(false);

          // Navigate to confirmation
          setTimeout(() => {
            handleConfirm();
          }, 1500);
        } catch (error) {
          console.error("Error completing order after Cashmatic payment:", error);
          alert("Payment successful but failed to complete order.");
          setProcessing(false);

          setShowCashmaticModal(false);
        }
        return;
      }

      if (s.state === "CANCELLED" || s.state === "ERROR") {
        console.log("Cancelled");
        setCashmaticPolling(false);
        setCashmaticSessionId(null);
        setProcessing(false);
        alert(
          s.state === "CANCELLED"
            ? "Cashmatic payment cancelled."
            : "Error during Cashmatic payment."
        );
        return;
      }
    };

    const intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }, [cashmaticPolling, cashmaticSessionId, amount]);

  // Poll Payworld status
  useEffect(() => {
    if (!payworldPolling || !payworldSessionId) return;

    const startTime = Date.now();
    const MAX_POLLING_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

    const poll = async () => {
      // Check if timeout exceeded
      const elapsed = Date.now() - startTime;
      if (elapsed >= MAX_POLLING_DURATION) {
        console.log("Payworld polling timeout reached (2 minutes)");
        setPayworldPolling(false);
        setPayworldSessionId(null);
        setProcessing(false);
        setShowPayworldModal(false);
        setPayworldStatus({
          state: "ERROR",
          message: "Payment timeout - maximum polling duration exceeded.",
          details: null,
        });
        alert("Payworld payment timeout. Please try again.");
        return;
      }

      try {
        const res = await ApiService.getPayworldStatus(payworldSessionId);
        const data = res.data || res;
        if (!data || data.ok === false) return;

        const state = data.state || "IN_PROGRESS";
        const message = data.message || payworldStatus.message;
        const details = data.details || payworldStatus.details;

        setPayworldStatus({
          state,
          message,
          details,
        });

        // Final states
        if (state === "APPROVED" && !payworldFinalizedRef.current) {
          payworldFinalizedRef.current = true;

          const paymentAmount = parseFloat(amount);

          // Save mosque payment to database
          await saveMosquePayment('card', paymentAmount);

          localStorage.setItem('paymentMethod', 'card');
          localStorage.setItem('paymentResult', JSON.stringify({
            success: true,
            state,
            totalPaid: paymentAmount,
            cashAmount: 0,
            cardAmount: paymentAmount,
            changeDue: 0,
          }));

          setShowPayworldModal(false);
          setPayworldPolling(false);
          setPayworldSessionId(null);
          setProcessing(false);

          // Navigate to confirmation
          setTimeout(() => {
            handleConfirm();
          }, 1500);
        } else if (["DECLINED", "CANCELLED", "ERROR"].includes(state)) {
          setPayworldPolling(false);
          setPayworldSessionId(null);
          setProcessing(false);

          if (state === "CANCELLED") {
            alert("Payworld payment cancelled.");
          } else if (state === "DECLINED") {
            alert("Payworld payment declined.");
          } else if (state === "ERROR") {
            alert("Error during Payworld payment.");
          }

          setShowPayworldModal(false);
        }
      } catch (err) {
        console.error("Payworld polling error:", err);
        setPayworldPolling(false);
        setPayworldSessionId(null);
        setProcessing(false);
        setShowPayworldModal(false);
        setPayworldStatus({
          state: "ERROR",
          message: "Error retrieving Payworld status.",
          details: { error: err.message },
        });
        alert("Error retrieving Payworld status.");
      }
    };

    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [payworldPolling, payworldSessionId, amount]);

  // Cashmatic payment handler
  const handleCashmaticPayment = async () => {
    if (processing) return;

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    try {
      setProcessing(true);
      setSelectedMethod('cash');

      setCashmaticInfo({
        requested: paymentAmount,
        inserted: 0,
        dispensed: 0,
        notDispensed: 0,
        state: "IN_PROGRESS",
      });
      setShowCashmaticModal(true);

      const res = await ApiService.startCashmaticPayment({
        amount: Math.round(paymentAmount * 100),
      });

      const data = res.data || res;
      const sessionId = data.sessionId;
      setCashmaticSessionId(sessionId);
      setCashmaticPolling(true);
    } catch (error) {
      console.error("Error starting Cashmatic payment:", error);
      setProcessing(false);
      setShowCashmaticModal(false);
      alert("Failed to start Cashmatic payment.");
    }
  };

  // Payworld flow
  const startPayworldFlow = async () => {
    if (processing) return;

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    setShowPayworldModal(true);
    setSelectedMethod('card');
    setPayworldStatus({
      state: "IN_PROGRESS",
      message: "Payworld payment started. Connecting to terminal...",
      details: null,
    });
    payworldFinalizedRef.current = false;

    try {
      setProcessing(true);

      const res = await ApiService.startPayworldPayment({
        amount: paymentAmount,
      });

      const data = res || {};
      const sessionId = data.sessionId || (data.data && data.data.sessionId);

      if (!sessionId) {
        throw new Error("No Payworld sessionId received from server.");
      }

      setPayworldSessionId(sessionId);
      setPayworldPolling(true);

      setPayworldStatus((prev) => ({
        ...prev,
        message: "Connection established. Follow the instructions on the terminal...",
      }));
    } catch (err) {
      console.error("Payworld start error:", err);
      setPayworldStatus({
        state: "ERROR",
        message: "Payment could not be started. Check settings / connection.",
        details: { error: err.message },
      });
      setShowPayworldModal(false);
      setProcessing(false);
      alert("Payworld payment could not be started.");
    }
  };

  const handlePayworldPayment = () => {
    startPayworldFlow();
  };

  const handleMethodSelect = async (method) => {
    if (method === 'cash') {
      await handleCashmaticPayment();
    } else if (method === 'card') {
      handlePayworldPayment();
    }
  };

  // Cancel Payworld payment
  const handleAbortPayworld = async () => {
    if (!payworldSessionId) {
      setPayworldStatus({
        state: "ERROR",
        message: "No active Payworld session to cancel.",
        details: null,
      });
      return;
    }

    setPayworldStatus({
      state: "IN_PROGRESS",
      message: "Payment is being cancelled on the terminal...",
      details: null,
    });

    try {
      await ApiService.cancelPayworldPayment(payworldSessionId);

      setPayworldStatus({
        state: "CANCELLED",
        message: "Payworld payment cancelled on the terminal.",
        details: null,
      });

      setPayworldPolling(false);
      setPayworldSessionId(null);
      setProcessing(false);
    } catch (err) {
      console.error("Error cancelling Payworld:", err);
      setPayworldStatus({
        state: "ERROR",
        message: "Failed to cancel on terminal.",
        details: { error: err.message },
      });
      setPayworldPolling(false);
      setPayworldSessionId(null);
      setProcessing(false);
    }
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
      reference: `${paymentType?.titleEn || 'Payment'} - ${memberInfo?.fullName}`
    };
    localStorage.setItem('paymentData', JSON.stringify(paymentData));

    console.log('Navigating to ticket-selection...');
    navigate('/ticket-selection');
  };

  // Test function to skip payment and test printer
  const handleTestPrint = () => {
    // Generate mock transaction ID
    const testTransactionId = `TEST-${Date.now()}`;

    // Store test payment data
    localStorage.setItem('transactionId', testTransactionId);
    localStorage.setItem('paymentMethod', 'cash'); // Default to cash for testing

    // Navigate directly to ticket selection
    console.log('Test mode: Skipping payment, going to ticket-selection...');
    navigate('/ticket-selection');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
            Select Payment Method
          </h1>
          <p className="text-xl text-pos-text-secondary">
            Choose how you would like to pay
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 pb-4">
        <div className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto">

          {/* Payment Summary Card */}
          <div className="bg-pos-bg-secondary rounded-xl p-3 mb-4 border border-pos-border-primary">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-lg text-pos-text-secondary mb-1">Payment Amount</div>
                <div className="text-5xl font-bold text-pos-text-primary">€ {amount}</div>
              </div>
              <div className="flex-1 text-right space-y-2">
                {paymentType && paymentType.id === 'sadaka' ? (
                  <>
                    <div className="text-lg text-pos-text-primary">
                      {sadakaType === 'named' ? 'Sadaka by Name' : 'Sadaka Anonymous'}
                    </div>
                    {sadakaType === 'named' && memberInfo && (
                      <div className="text-base text-pos-text-secondary">
                        {memberInfo.fullName}
                      </div>
                    )}
                    {sadakaGoal && (
                      <div className="text-base text-pos-text-secondary">
                        Goal: {sadakaGoal.titleEn}
                      </div>
                    )}
                  </>
                ) : paymentType && paymentType.id === 'rent' ? (
                  <>
                    <div className="text-lg text-pos-text-primary">Rent Space / Kitchen</div>
                    {memberInfo && (
                      <div className="text-base text-pos-text-secondary">
                        {memberInfo.fullName}
                      </div>
                    )}
                    {rentDateTime && (
                      <div className="text-sm text-pos-text-secondary">
                        {rentDateTime.startDate} {rentDateTime.startTime} - {rentDateTime.endDate} {rentDateTime.endTime}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-lg text-pos-text-primary">
                      {paymentType ? paymentType.titleEn : 'Payment'}
                    </div>
                    {memberInfo && (
                      <div className="text-base text-pos-text-secondary">
                        {memberInfo.fullName}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Buttons */}
          <div className="grid grid-cols-2 gap-6">
            {/* Cash Payment Button */}
            <button
              onClick={() => handleMethodSelect('cash')}
              disabled={processing}
              className={`
                relative bg-pos-bg-secondary rounded-xl p-6 
                transition-all duration-200 border
                ${selectedMethod === 'cash'
                  ? 'border-pos-interactive-hover shadow-lg scale-[1.02]'
                  : 'border-pos-border-primary'
                }
                hover:border-pos-interactive-hover hover:shadow-lg
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-[0.98]
              `}
            >
              {/* Icon/Visual */}
              <div className="mb-6">
                <svg className="w-24 h-24 mx-auto text-pos-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              {/* Text Content */}
              <div className="space-y-3">
                <div className="text-3xl font-bold text-pos-text-primary">Cash</div>
                <div className="text-xl text-pos-text-secondary">Cashmatic</div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">كاشماتيك</div>
              </div>

              {/* Selected Indicator */}
              {selectedMethod === 'cash' && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-pos-interactive-hover rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>

            {/* Card Payment Button */}
            <button
              onClick={() => handleMethodSelect('card')}
              disabled={processing}
              className={`
                relative bg-pos-bg-secondary rounded-xl p-6 
                transition-all duration-200 border
                ${selectedMethod === 'card'
                  ? 'border-pos-interactive-hover shadow-lg scale-[1.02]'
                  : 'border-pos-border-primary'
                }
                hover:border-pos-interactive-hover hover:shadow-lg
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-[0.98]
              `}
            >
              {/* Icon/Visual */}
              <div className="mb-6">
                <svg className="w-24 h-24 mx-auto text-pos-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>

              {/* Text Content */}
              <div className="space-y-3">
                <div className="text-3xl font-bold text-pos-text-primary">Card</div>
                <div className="text-xl text-pos-text-secondary">Bancontact</div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">بانكونتاكت</div>
              </div>

              {/* Selected Indicator */}
              {selectedMethod === 'card' && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-pos-interactive-hover rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 px-8 pb-8">
        <div className="max-w-5xl w-full mx-auto grid grid-cols-2 gap-4">
          <KioskButton
            variant="secondary"
            onClick={handleGoBack}
            disabled={processing}
            fullWidth
          >
            Go Back
          </KioskButton>

          <KioskButton
            variant="primary"
            onClick={handleTestPrint}
            disabled={processing}
            fullWidth
          >
            🖨️ Test Print (Skip Payment)
          </KioskButton>
        </div>
      </div>

      {/* Cashmatic Modal */}
      {showCashmaticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-pos-bg-primary border-4 border-pos-border-primary rounded-3xl shadow-2xl w-full max-w-2xl mx-8">

            {/* Modal Header */}
            <div className="px-8 py-2 border-b-2 border-pos-border-primary">
              <h2 className="text-3xl font-bold text-pos-text-primary text-center">
                Cash Payment in Progress
              </h2>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-2">
              {/* Status Indicator */}
              <div className="mb-4 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-pos-interactive-primary mb-4">
                  {(cashmaticInfo.state === "IN_PROGRESS" || cashmaticInfo.state === "PAID") && (
                    <svg className="w-12 h-12 text-pos-text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {cashmaticInfo.state === "FINISHED" && (
                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {cashmaticInfo.state === "FINISHED_MANUAL" && (
                    <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  {(cashmaticInfo.state === "CANCELLED" || cashmaticInfo.state === "ERROR") && (
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="text-2xl font-semibold text-pos-text-primary">
                  {cashmaticInfo.state === "IDLE"
                    ? "Ready for next customer"
                    : cashmaticInfo.state === "RUNNING" || cashmaticInfo.state === "IN_PROGRESS"
                      ? "Insert cash into the machine"
                      : cashmaticInfo.state === "PAID"
                        ? "Processing change..."
                        : cashmaticInfo.state === "FINISHED_MANUAL"
                          ? "Please provide manual change"
                          : cashmaticInfo.state === "FINISHED"
                            ? "Payment completed successfully"
                            : cashmaticInfo.state === "CANCELLED"
                              ? "Payment cancelled"
                              : cashmaticInfo.state === "ERROR" || cashmaticInfo.state === "FAILED"
                                ? "Error - Please check machine"
                                : "Processing..."}
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-2 bg-pos-bg-secondary rounded-2xl p-4 border-2 border-pos-border-primary">
                <div className="flex justify-between items-center py-3 border-b border-pos-border-primary">
                  <span className="text-xl text-pos-text-secondary">Amount Due</span>
                  <span className="text-3xl font-bold text-pos-text-primary">€ {formatAmount(cashmaticInfo?.requested)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-pos-border-primary">
                  <span className="text-xl text-pos-text-secondary">Cash Inserted</span>
                  <span className="text-3xl font-bold text-green-600">€ {formatAmount(cashmaticInfo?.inserted)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-pos-border-primary">
                  <span className="text-xl text-pos-text-secondary">Change Due</span>
                  <span className="text-3xl font-bold text-pos-text-primary">
                    € {formatAmount(Math.max((cashmaticInfo?.inserted ?? 0) - (cashmaticInfo?.requested ?? 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-pos-border-primary">
                  <span className="text-xl text-pos-text-secondary">Change Dispensed</span>
                  <span className="text-2xl font-semibold text-pos-text-primary">€ {formatAmount(cashmaticInfo?.dispensed)}</span>
                </div>
                {cashmaticInfo?.notDispensed > 0 && (
                  <div className="flex justify-between items-center py-2gdnf bg-yellow-500 bg-opacity-10 rounded-xl px-4">
                    <span className="text-xl text-yellow-600 font-semibold">Manual Change Required</span>
                    <span className="text-3xl font-bold text-yellow-600">€ {formatAmount(cashmaticInfo?.notDispensed)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-8 pb-8">
              <div className="flex gap-4">
                {(cashmaticInfo.state === "FINISHED" ||
                  cashmaticInfo.state === "FINISHED_MANUAL" ||
                  cashmaticInfo.state === "CANCELLED" ||
                  cashmaticInfo.state === "ERROR") && (
                    <KioskButton
                      variant="secondary"
                      onClick={() => setShowCashmaticModal(false)}
                      fullWidth
                    >
                      Close
                    </KioskButton>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payworld Modal */}
      {showPayworldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-pos-bg-primary border-4 border-pos-border-primary rounded-3xl shadow-2xl w-full max-w-2xl mx-8">

            {/* Modal Header */}
            <div className="px-8 py-3 border-b-2 border-pos-border-primary">
              <h2 className="text-2xl font-bold text-pos-text-primary text-center">
                Card Payment
              </h2>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-4">
              {/* Status Indicator */}
              <div className="mb-4 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-pos-interactive-primary mb-2">
                  {payworldStatus.state === "IN_PROGRESS" && (
                    <svg className="w-12 h-12 text-pos-text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  {payworldStatus.state === "APPROVED" && (
                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {payworldStatus.state === "DECLINED" && (
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {payworldStatus.state === "CANCELLED" && (
                    <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {payworldStatus.state === "ERROR" && (
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="text-2xl font-semibold text-pos-text-primary mb-2">
                  {payworldStatus.state === "IN_PROGRESS"
                    ? "Follow instructions on terminal"
                    : payworldStatus.state === "APPROVED"
                      ? "Payment approved"
                      : payworldStatus.state === "DECLINED"
                        ? "Payment declined"
                        : payworldStatus.state === "CANCELLED"
                          ? "Payment cancelled"
                          : payworldStatus.state === "ERROR"
                            ? "Payment error"
                            : "Ready"}
                </div>
                {payworldStatus.message && (
                  <div className="text-lg text-pos-text-secondary max-w-md mx-auto">
                    {payworldStatus.message}
                  </div>
                )}
              </div>

              {/* Payment Amount */}
              <div className="bg-pos-bg-secondary rounded-2xl px-6 py-2 border-2 border-pos-border-primary">
                <div className="flex justify-between items-center">
                  <span className="text-xl text-pos-text-secondary">Payment Amount</span>
                  <span className="text-4xl font-bold text-pos-text-primary">€ {formatAmount(parseFloat(amount))}</span>
                </div>
              </div>

              {/* Instructions for IN_PROGRESS state */}
              {payworldStatus.state === "IN_PROGRESS" && (
                <div className="mt-3 bg-blue-500 bg-opacity-10 rounded-2xl px-6 py-3 border-2 border-blue-500">
                  <div className="flex items-start gap-4">
                    <svg className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-blue-600 mb-2">Please use the card terminal</div>
                      <div className="text-base text-pos-text-secondary">
                        Insert, tap, or swipe your card on the payment terminal and follow the on-screen instructions.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-8 pb-8">
              <div className="flex gap-4">
                {payworldStatus.state === "IN_PROGRESS" && (
                  <KioskButton
                    variant="destructive"
                    onClick={handleAbortPayworld}
                    fullWidth
                  >
                    Cancel Payment
                  </KioskButton>
                )}

                {(payworldStatus.state === "APPROVED" ||
                  payworldStatus.state === "DECLINED" ||
                  payworldStatus.state === "CANCELLED" ||
                  payworldStatus.state === "ERROR") && (
                    <KioskButton
                      variant="secondary"
                      onClick={() => {
                        setShowPayworldModal(false);
                        setPayworldStatus({
                          state: "IDLE",
                          message: "",
                          details: null,
                        });
                      }}
                      fullWidth
                    >
                      Close
                    </KioskButton>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    // </div>
  );
};

export default PaymentMethodPage;
