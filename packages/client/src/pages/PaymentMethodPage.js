import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

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
      try {
        const res = await ApiService.getCashmaticStatus(cashmaticSessionId);
        const s = res.data || res;
        
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

        if (s.state === "IN_PROGRESS" || s.state === "PAID") {
          return;
        }

        if (s.state === "FINISHED" || s.state === "FINISHED_MANUAL") {
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          
          localStorage.setItem('paymentMethod', 'cash');
          localStorage.setItem('paymentResult', JSON.stringify({
            success: true,
            state: s.state,
            totalPaid: requested,
            cashAmount: requested,
            cardAmount: 0,
            changeDue: 0,
            manualChangeRequired: s.state === "FINISHED_MANUAL",
          }));

          setProcessing(false);
          
          if (s.state === "FINISHED") {
            setShowCashmaticModal(false);
          }
          
          // Navigate to confirmation
          setTimeout(() => {
            handleConfirm();
          }, 1500);
          return;
        }

        if (s.state === "CANCELLED" || s.state === "ERROR") {
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          setProcessing(false);
          setShowCashmaticModal(false);
          alert(
            s.state === "CANCELLED"
              ? "Cashmatic payment cancelled."
              : "Error during Cashmatic payment."
          );
          return;
        }
      } catch (error) {
        console.error("Cashmatic polling error:", error);
        setCashmaticPolling(false);
        setCashmaticSessionId(null);
        setProcessing(false);
        setShowCashmaticModal(false);
        alert("Error communicating with Cashmatic.");
      }
    };

    const intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }, [cashmaticPolling, cashmaticSessionId]);

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

  // Cancel Cashmatic payment
  const handleCancelCashmatic = async () => {
    if (!cashmaticSessionId) {
      setShowCashmaticModal(false);
      setProcessing(false);
      return;
    }

    try {
      await ApiService.cancelCashmatic(cashmaticSessionId);
      setCashmaticPolling(false);
      setCashmaticSessionId(null);
      setProcessing(false);
      setShowCashmaticModal(false);
    } catch (error) {
      console.error('Cancel Cashmatic error:', error);
      setCashmaticPolling(false);
      setCashmaticSessionId(null);
      setProcessing(false);
      setShowCashmaticModal(false);
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
            disabled={processing}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go back
          </button>
        </div>

        {/* Cashmatic Modal */}
        {showCashmaticModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold text-pos-text-primary mb-4">
                Cashmatic Payment
              </h2>
              <div className="space-y-2 text-pos-text-primary text-sm">
                <div className="flex justify-between">
                  <span>Requested:</span>
                  <span>€ {formatAmount(cashmaticInfo?.requested)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inserted:</span>
                  <span>€ {formatAmount(cashmaticInfo?.inserted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change (theoretical):</span>
                  <span>
                    € {formatAmount(Math.max(
                      (cashmaticInfo?.inserted ?? 0) - (cashmaticInfo?.requested ?? 0),
                      0
                    ))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Change via Cashmatic:</span>
                  <span>€ {formatAmount(cashmaticInfo?.dispensed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manual change:</span>
                  <span>€ {formatAmount(cashmaticInfo?.notDispensed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>
                    {cashmaticInfo.state === "IDLE"
                      ? "Ready for next customer"
                      : cashmaticInfo.state === "RUNNING" ||
                        cashmaticInfo.state === "IN_PROGRESS"
                      ? "Payment in progress..."
                      : cashmaticInfo.state === "PAID"
                      ? "Amount received – change being dispensed"
                      : cashmaticInfo.state === "FINISHED_MANUAL"
                      ? "Payment completed – give manual change"
                      : cashmaticInfo.state === "FINISHED"
                      ? "Payment completed"
                      : cashmaticInfo.state === "CANCELLED"
                      ? "Cancelled"
                      : cashmaticInfo.state === "ERROR" ||
                        cashmaticInfo.state === "FAILED"
                      ? "Error – check Cashmatic"
                      : "Unknown status"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {(cashmaticInfo.state === "IN_PROGRESS" || cashmaticInfo.state === "PAID") && (
                  <button
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={handleCancelCashmatic}
                  >
                    Cancel Payment
                  </button>
                )}
                {(cashmaticInfo.state === "FINISHED" ||
                  cashmaticInfo.state === "FINISHED_MANUAL" ||
                  cashmaticInfo.state === "CANCELLED" ||
                  cashmaticInfo.state === "ERROR") && (
                  <button
                    className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                    onClick={() => setShowCashmaticModal(false)}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payworld Modal */}
        {showPayworldModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold text-pos-text-primary mb-4">
                Payworld / PAX A35 Payment
              </h2>

              <div className="space-y-2 text-pos-text-primary text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>€ {formatAmount(parseFloat(amount))}</span>
                </div>

                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>
                    {payworldStatus.state === "IN_PROGRESS"
                      ? "Payment in progress on terminal..."
                      : payworldStatus.state === "APPROVED"
                      ? "Payment approved."
                      : payworldStatus.state === "DECLINED"
                      ? "Payment declined."
                      : payworldStatus.state === "CANCELLED"
                      ? "Payment cancelled."
                      : payworldStatus.state === "ERROR"
                      ? "Error during payment."
                      : "Ready."}
                  </span>
                </div>

                {payworldStatus.message && (
                  <div className="mt-2 text-xs text-pos-text-secondary whitespace-pre-line">
                    {payworldStatus.message}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {payworldStatus.state === "IN_PROGRESS" && (
                  <button
                    className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                    onClick={handleAbortPayworld}
                  >
                    Cancel Payment
                  </button>
                )}

                {(payworldStatus.state === "APPROVED" ||
                  payworldStatus.state === "DECLINED" ||
                  payworldStatus.state === "CANCELLED" ||
                  payworldStatus.state === "ERROR") && (
                  <button
                    className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                    onClick={() => {
                      setShowPayworldModal(false);
                      setPayworldStatus({
                        state: "IDLE",
                        message: "",
                        details: null,
                      });
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodPage;
