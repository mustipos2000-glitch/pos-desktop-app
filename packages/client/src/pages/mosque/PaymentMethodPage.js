import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import { KioskButton } from '../../components/mosque';

const PaymentMethodPage = () => {
  const navigate = useNavigate();

  const formatAmount = useCallback((value) => {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return num.toFixed(2);
  }, []);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [amount, setAmount] = useState('0');
  const [paymentType, setPaymentType] = useState(null);
  const [sadakaGoal, setSadakaGoal] = useState(null);
  const [sadakaType, setSadakaType] = useState(null);
  const [rentDateTime, setRentDateTime] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  const [manualChangeAmount, setManualChangeAmount] = useState(0);
  const [showManualChangeModal, setShowManualChangeModal] = useState(false);

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

  const handleConfirm = useCallback(() => {
    // Payment already processed, just navigate
    const paymentData = {
      amount: parseFloat(amount),
      member_id: memberInfo?.id,
      payment_type: paymentType?.id,
      reference: `${paymentType?.titleEn || 'Payment'} - ${memberInfo?.fullName}`
    };
    localStorage.setItem('paymentData', JSON.stringify(paymentData));

    console.log('Navigating to ticket-selection...');
    navigate('/mosque/ticket-selection');
  }, [amount, memberInfo, paymentType, navigate]);

  // Store payment data function
  const storePaymentData = useCallback(async (paymentMethod, paymentDetails) => {
    try {
      const transactionId = `${paymentMethod.toUpperCase()}-${Date.now()}`;
      
      // Complete payment data object
      const paymentData = {
        transactionId,
        amount: parseFloat(amount),
        member_id: memberInfo?.id,
        member_name: memberInfo?.fullName,
        payment_type: paymentType?.id,
        payment_type_title: paymentType?.titleEn,
        sadaka_goal: sadakaGoal?.titleEn,
        sadaka_type: sadakaType,
        rent_datetime: rentDateTime,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString(),
        ...paymentDetails
      };

      // Store in localStorage for immediate use
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentMethod', paymentMethod);
      localStorage.setItem('paymentData', JSON.stringify(paymentData));
      localStorage.setItem('paymentResult', JSON.stringify({
        success: true,
        ...paymentDetails
      }));

      console.log('Payment data stored:', paymentData);

      // If this is a rental payment, create rental booking in database
      if (paymentType?.id === 'rent' && rentDateTime) {
        try {
          console.log('📅 Creating rental booking in database...');
          const bookingData = {
            member_id: memberInfo?.id,
            member_name: memberInfo?.fullName,
            start_datetime: rentDateTime.startDatetime,
            end_datetime: rentDateTime.endDatetime,
            duration_hours: rentDateTime.durationHours,
            amount: parseFloat(amount),
            transaction_id: transactionId,
            payment_method: paymentMethod,
            status: 'active'
          };

          const bookingResponse = await ApiService.createRentalBooking(bookingData);
          console.log('✅ Rental booking created:', bookingResponse);
        } catch (bookingError) {
          console.error('❌ Error creating rental booking:', bookingError);
          // Don't fail the payment, just log the error
          // The payment was successful, booking creation is secondary
        }
      }

      return paymentData;
    } catch (error) {
      console.error('Error storing payment data:', error);
      throw error;
    }
  }, [amount, memberInfo, paymentType, sadakaGoal, sadakaType, rentDateTime]);

  // Handle manual change confirmation
  const handleManualChangeConfirm = useCallback(() => {
    setShowManualChangeModal(false);
    setToastType("success");
    setToastMessage("Payment completed successfully!");
    
    // Navigate to confirmation after manual change is acknowledged
    setTimeout(() => {
      handleConfirm();
    }, 1500);
  }, [handleConfirm]);

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
      try {
        const res = await ApiService.getCashmaticStatus(cashmaticSessionId);
        const s = res.data || res;
        console.log("Cashmatic status:", s);
        // Handle error state from server
        if (s.errorMessage) {
          console.error("Cashmatic error:", s.errorMessage);
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          setProcessing(false); // Fixed: was processing(false)
          setToastType("error");
          setToastMessage("Cashmatic communication error: " + s.errorMessage);
          return;
        }
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

        if (s.state === "PAID" || s.state === "FINISHED" || s.state === "FINISHED_MANUAL" || s.state === "COMPLETED") {
          console.log('insertd:' + inserted, " Requested : " + requested, " dispensed " + dispensed, " not Dspensed " + notDispensed);

          if (inserted < requested) return;
          if (inserted > requested && (dispensed > 0 || notDispensed > 0)) {

            const change = inserted - requested;
            if (change > 0) {
              const manualChangeDue = change - dispensed;
              if (manualChangeDue > 0) {
                // Store payment data and show manual change modal
                await storePaymentData('cash', {
                  totalPaid: inserted,
                  cashAmount: inserted,
                  cardAmount: 0,
                  changeDue: change,
                  cashmaticDispensed: dispensed,
                  manualChangeDue: manualChangeDue,
                  state: s.state
                });
                
                setManualChangeAmount(manualChangeDue);
                setShowManualChangeModal(true);
                setCashmaticPolling(false);
                setCashmaticSessionId(null);
                setShowCashmaticModal(false);
                return;
              }
            }
          } else if(s.state === "PAID"){
            return;
          }
          console.log("Finished the Cashmatic ");

          setCashmaticPolling(false);
          const currentSessionId = cashmaticSessionId;
          setCashmaticSessionId(null);

          const manualChangeDue = notDispensed;
          try {
            // Call finish API to close transaction and print receipt on Cashmatic
            console.log("Calling finish API to close Cashmatic transaction... Mosque");
            await ApiService.finishCashmaticPayment(currentSessionId);

            // Store payment data
            await storePaymentData('cash', {
              totalPaid: inserted,
              cashAmount: inserted,
              cardAmount: 0,
              changeDue: inserted - requested,
              cashmaticDispensed: dispensed,
              manualChangeDue: manualChangeDue,
              state: s.state
            });

            setToastType("success");
            let message = "Cashmatic Payment completed successfully.";

            if (manualChangeDue > 0) {
              message = `Payment Completed! Please give ${formatAmount(manualChangeDue)} manual change to customer`;
            } else {
              // Navigate to confirmation
              setTimeout(() => {
                handleConfirm();
              }, 2000);
            }
            setToastMessage(message);

            setProcessing(false);

          } catch (error) {
            console.error("Error completing order after Cashmatic payment:", error);
            setToastType("error");
            setToastMessage("Payment successful but failed to complete order.");
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
      }
      catch (error) {
        console.error("Cashmatic polling error:", error);
        setCashmaticPolling(false);
        setCashmaticSessionId(null);
        setProcessing(false);
        setToastType("error");
        setToastMessage("Failed to communicate with Cashmatic device.");
        setShowCashmaticModal(false);
      }
    };

    const intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }, [cashmaticPolling, cashmaticSessionId, amount, formatAmount, storePaymentData, handleConfirm]);

  // Poll Payworld status
  useEffect(() => {
    if (!payworldPolling || !payworldSessionId) return;

    // const startTime = Date.now();
    // const MAX_POLLING_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

    const poll = async () => {
      // Check if timeout exceeded
      // const elapsed = Date.now() - startTime;
      // if (elapsed >= MAX_POLLING_DURATION) {
      //   console.log("Payworld polling timeout reached (2 minutes)");
      //   setPayworldPolling(false);
      //   setPayworldSessionId(null);
      //   setProcessing(false);
      //   setShowPayworldModal(false);
      //   setPayworldStatus({
      //     state: "ERROR",
      //     message: "Payment timeout - maximum polling duration exceeded.",
      //     details: null,
      //   });
      //   alert("Payworld payment timeout. Please try again.");
      //   return;
      // }

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

          // Store payment data
          await storePaymentData('card', {
            totalPaid: paymentAmount,
            cashAmount: 0,
            cardAmount: paymentAmount,
            changeDue: 0,
            state: state,
            details: details
          });

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
            setToastMessage("Payworld payment cancelled.");
          } else if (state === "DECLINED") {
            const declineMessage = details?.error || "Payment declined by terminal.";
            setToastMessage(`Payworld payment declined: ${declineMessage}\n\nFor test transactions, try amounts ≥ €1.00`);
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
  }, [payworldPolling, payworldSessionId, amount, payworldStatus.message, payworldStatus.details, storePaymentData, handleConfirm]);

  // Cashmatic payment handler
  const handleCashmaticPayment = async () => {
    if (processing) return;
    console.log("Cashmatic payment handler called amount : " + amount);
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

    // Add minimum amount validation for Payworld
    // if (paymentAmount < 1.00) {
    //   setToastMessage("Minimum payment amount for card transactions is €1.00. Please use cash for smaller amounts.");
    //   return;
    // }

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

  // Cancel Cashmatic payment
  const handleCancelCashmatic = async () => {
    if (!cashmaticSessionId) {
      setToastType("error");
      setToastMessage("No active Cashmatic session to cancel.");
      setProcessing(false);
      setCashmaticPolling(false);
      return;
    }

    try {
      console.log("Cancelling Cashmatic payment...");

      const res = await ApiService.cancelCashmatic(cashmaticSessionId);

      // Accept several shapes: { success: true } or { ok: true } or raw response
      const ok = (res && (res.success === true || res.ok === true)) || !res;

      if (!ok) {
        console.warn('Cashmatic cancel returned unexpected response:', res);
        setToastType("error");
        setToastMessage("Failed to cancel Cashmatic payment.");
        return;
      }

      setCashmaticInfo(prev => ({ ...prev, state: "CANCELLED" }));
      setCashmaticPolling(false);
      setCashmaticSessionId(null);
      setProcessing(false);

      setToastType("success");
      setToastMessage("Cashmatic payment cancelled successfully.");

      // Close modal after a short delay so user sees the toast
      setTimeout(() => setShowCashmaticModal(false), 1200);
    } catch (error) {
      console.error("Error cancelling Cashmatic payment:", error);
      setToastType("error");
      setToastMessage("Failed to cancel Cashmatic payment.");
      setProcessing(false);
      setCashmaticPolling(false);
    }
  };

  // Cancel Payworld payment
  const handleAbortPayworld = async () => {
    if (!payworldSessionId) {
      console.log('We are here in not payworkd session Id ');
      
      setPayworldPolling(false);
      setPayworldSessionId(null);
      setProcessing(false);
      setPayworldStatus({
        state: "ERROR",
        message: "No active Payworld session to cancel.",
        details: null,
      });
      setShowPayworldModal(false);
      return;
    }
    console.log("outside the payeworkd machin abort");
    
    setPayworldStatus({
      state: "IN_PROGRESS",
      message: "Payment is being cancelled on the terminal...",
      details: null,
    });

    try {
      const res = await ApiService.cancelPayworldPayment(payworldSessionId);
      console.log("cancelPayworldPayment result:", res);

      const ok = (res && (res.success === true || res.ok === true)) || !res;

      if (!ok) {
        console.warn('Payworld cancel returned unexpected response:', res);
        setPayworldPolling(false);
        setPayworldSessionId(null);
        setProcessing(false);
        setPayworldStatus({ state: "ERROR", message: "Failed to cancel Payworld payment.", details: res });
        setToastType("error");
        setToastMessage("Failed to cancel Payworld payment.");
        setShowPayworldModal(false);
        return;
      }

      setPayworldStatus({ state: "CANCELLED", message: "Payworld payment cancelled on the terminal.", details: null });
      setPayworldPolling(false);
      setPayworldSessionId(null);
      setProcessing(false);
      setToastType("success");
      setToastMessage("Payworld payment cancelled.");
      setShowPayworldModal(false);
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
    // Check payment type to determine correct back navigation
    if (paymentType?.id === 'rent') {
      // For rent, go back to rent datetime page (skip amount entry)
      navigate('/mosque/rent-datetime');
    } else {
      // For other payment types, go back to amount entry
      navigate('/mosque/amount-entry');
    }
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
    navigate('/mosque/ticket-selection');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
       {/* Footer Navigation */}
      <div className="absolute w-40 left-1 top-1 w-24">
        <div className="w-24">
          <KioskButton
            variant="secondary"
            onClick={handleGoBack}
            disabled={processing}
            fullWidth
            icon={"true"}
          >
            <img 
            src="/icon kiosk/terug.png" 
            alt="Go Back" 
            className="rounded-3xl"
          />
            {/* Go Back */}
          </KioskButton>
        </div>
      </div>
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
             
            >
              {/* Icon/Visual */}
              <div className="">
                <img 
                  src="/icon kiosk/cash.png" 
                  alt="Cash Payment" 
                  className="rounded-3xl"
                />
              </div>

              {/* Text Content */}
              {/* <div className="space-y-3">
                <div className="text-3xl font-bold text-pos-text-primary">Cash</div>
                <div className="text-xl text-pos-text-secondary">Cashmatic</div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">كاشماتيك</div>
              </div> */}

              {/* Selected Indicator */}
              {/* {selectedMethod === 'cash' && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-pos-interactive-hover rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )} */}
            </button>

            {/* Card Payment Button */}
            <button
              onClick={() => handleMethodSelect('card')}
              disabled={processing}
              
            >
              {/* Icon/Visual */}
              <div className="">
                <img 
                  src="/icon kiosk/bancontact.png" 
                  alt="Card Payment" 
                  className="rounded-3xl"
                />
              </div>

              {/* Text Content */}
              {/* <div className="space-y-3">
                <div className="text-3xl font-bold text-pos-text-primary">Card</div>
                <div className="text-xl text-pos-text-secondary">Bancontact</div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">بانكونتاكت</div>
              </div> */}

              {/* Selected Indicator */}
              {/* {selectedMethod === 'card' && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-pos-interactive-hover rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )} */}
            </button>
          </div>

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
                {/* Cancel button for active payment states */}
                {(cashmaticInfo.state !== "PAID") && (
                  <KioskButton
                    variant="danger"
                    onClick={handleCancelCashmatic}
                    fullWidth
                  >
                    Cancel Payment
                  </KioskButton>
                )}

                {/* Close button for finished states */}
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
                    variant="danger"
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

      {/* Manual Change Modal */}
      {showManualChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-pos-bg-primary border-4 border-pos-border-primary rounded-3xl shadow-2xl w-full max-w-2xl mx-8">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b-2 border-pos-border-primary">
              <h2 className="text-3xl font-bold text-pos-text-primary text-center">
                Manual Change Required
              </h2>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500 mb-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-2xl font-semibold text-pos-text-primary mb-4">
                  Please provide manual change to customer
                </div>
              </div>

              <div className="bg-yellow-500 bg-opacity-10 rounded-2xl p-6 border-2 border-yellow-500 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold text-yellow-600">Change Due:</span>
                  <span className="text-4xl font-bold text-yellow-600">€ {formatAmount(manualChangeAmount)}</span>
                </div>
              </div>

              <div className="text-lg text-pos-text-secondary text-center">
                After providing the change to the customer, click "Confirm" to print the receipt and complete the transaction.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-8 pb-8">
              <KioskButton
                variant="primary"
                onClick={handleManualChangeConfirm}
                fullWidth
              >
                Confirm Change Given
              </KioskButton>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            {toastType === 'success' ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-lg font-medium">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage("")}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
    // </div>
  );
};

export default PaymentMethodPage;
