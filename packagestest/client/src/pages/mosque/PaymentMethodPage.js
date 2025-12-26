import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import FixedBackButton from '../../components/mosque/FixedBackButton';
import { KioskLayout, KioskHeader, KioskButton } from '../../components/mosque';

const PaymentMethodPage = () => {
  const navigate = useNavigate();

  const [memberInfo, setMemberInfo] = useState(null);
  const [paymentType, setPaymentType] = useState(null);

  const [amount, setAmount] = useState('0.00');
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  // Cashmatic modal/state
  const [showCashmaticModal, setShowCashmaticModal] = useState(false);
  const [cashmaticSessionId, setCashmaticSessionId] = useState(null);
  const [cashmaticPolling, setCashmaticPolling] = useState(false);
  const [cashmaticInfo, setCashmaticInfo] = useState({
    requested: 0,
    inserted: 0,
    dispensed: 0,
    notDispensed: 0,
    state: null,
  });

  // Payworld modal/state
  const [showPayworldModal, setShowPayworldModal] = useState(false);
  const [payworldSessionId, setPayworldSessionId] = useState(null);
  const [payworldPolling, setPayworldPolling] = useState(false);
  const [payworldStatus, setPayworldStatus] = useState({
    state: 'IDLE',
    message: '',
    details: null,
  });
  const payworldFinalizedRef = useRef(false);

  const fmt = useCallback((v) => {
    const n = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
    return n.toFixed(2);
  }, []);

  const normalizeAmount = (raw) => {
    const n = parseFloat(String(raw ?? '').trim().replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  };

  const handleGoBack = () => {
    navigate('/mosque/amount-entry', { replace: true });
  };

  const handleConfirm = useCallback(() => {
    navigate('/mosque/ticket-selection', { replace: true });
  }, [navigate]);

  // Load initial context + amount
  useEffect(() => {
    setError('');
    setDebug('');

    const memberStr = localStorage.getItem('selectedMember');
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');

    if (memberStr) {
      try { setMemberInfo(JSON.parse(memberStr)); } catch (e) {}
    }
    if (paymentTypeStr) {
      try { setPaymentType(JSON.parse(paymentTypeStr)); } catch (e) {}
    }

    const storedAmountRaw = localStorage.getItem('paymentAmount');
    const n = normalizeAmount(storedAmountRaw);
    if (n) setAmount(n.toFixed(2));
    else setAmount('0.00');
  }, []);

  const startCashmatic = async () => {
    setError('');
    setDebug('');

    const latestRaw = localStorage.getItem('paymentAmount');
    const n = normalizeAmount(latestRaw);

    if (!n) {
      setError('Bedrag is ongeldig of 0. Ga terug en geef een bedrag in.');
      return;
    }

    // ✅ Toon ALTIJD modal als visuele feedback
    setShowCashmaticModal(true);
    setCashmaticInfo({
      requested: n,
      inserted: 0,
      dispensed: 0,
      notDispensed: 0,
      state: 'IN_PROGRESS',
    });

    const cents = Math.round(n * 100);
    setDebug(`CASHMATIC start → amount=${n.toFixed(2)} EUR, cents=${cents}`);

    try {
      setProcessing(true);

      const res = await ApiService.startCashmaticPayment({ amount: cents });

      const data = res?.data || res;
      const sessionId = data?.sessionId;

      if (!sessionId) {
        throw new Error(`No cashmatic sessionId. Response: ${JSON.stringify(data)}`);
      }

      setCashmaticSessionId(sessionId);
      setCashmaticPolling(true);
      setDebug((d) => `${d}\nCASHMATIC sessionId=${sessionId}`);
    } catch (e) {
      console.error(e);
      setProcessing(false);
      setCashmaticPolling(false);
      setCashmaticSessionId(null);
      setCashmaticInfo((prev) => ({ ...prev, state: 'ERROR' }));
      setError(`Cashmatic start fout: ${e?.message || String(e)}`);
    }
  };

  const startPayworld = async () => {
    setError('');
    setDebug('');

    const latestRaw = localStorage.getItem('paymentAmount');
    const n = normalizeAmount(latestRaw);

    if (!n) {
      setError('Bedrag is ongeldig of 0. Ga terug en geef een bedrag in.');
      return;
    }

    setShowPayworldModal(true);
    setPayworldStatus({
      state: 'IN_PROGRESS',
      message: 'Payworld payment started. Connecting to terminal...',
      details: null,
    });
    payworldFinalizedRef.current = false;

    setDebug(`PAYWORLD start → amount=${n.toFixed(2)} EUR`);

    try {
      setProcessing(true);

      const res = await ApiService.startPayworldPayment({ amount: n });
      const data = res?.data || res;

      const sessionId = data?.sessionId || data?.data?.sessionId;
      if (!sessionId) {
        throw new Error(`No payworld sessionId. Response: ${JSON.stringify(data)}`);
      }

      setPayworldSessionId(sessionId);
      setPayworldPolling(true);
      setDebug((d) => `${d}\nPAYWORLD sessionId=${sessionId}`);
    } catch (e) {
      console.error(e);
      setProcessing(false);
      setPayworldPolling(false);
      setPayworldSessionId(null);
      setPayworldStatus({ state: 'ERROR', message: 'Payworld start fout.', details: { error: e?.message || String(e) } });
      setError(`Payworld start fout: ${e?.message || String(e)}`);
      setShowPayworldModal(false);
    }
  };

  const cancelCashmatic = async () => {
    try {
      if (!cashmaticSessionId) {
        setShowCashmaticModal(false);
        setProcessing(false);
        setCashmaticPolling(false);
        return;
      }
      await ApiService.cancelCashmatic(cashmaticSessionId);
    } catch (e) {
      console.error(e);
    } finally {
      setCashmaticPolling(false);
      setCashmaticSessionId(null);
      setProcessing(false);
      setShowCashmaticModal(false);
    }
  };

  const cancelPayworld = async () => {
    try {
      if (!payworldSessionId) {
        setShowPayworldModal(false);
        setProcessing(false);
        setPayworldPolling(false);
        return;
      }
      await ApiService.cancelPayworldPayment(payworldSessionId);
    } catch (e) {
      console.error(e);
    } finally {
      setPayworldPolling(false);
      setPayworldSessionId(null);
      setProcessing(false);
      setShowPayworldModal(false);
    }
  };

  // Poll Cashmatic
  useEffect(() => {
    if (!cashmaticPolling || !cashmaticSessionId) return;

    const poll = async () => {
      try {
        const res = await ApiService.getCashmaticStatus(cashmaticSessionId);
        const data = res?.data || res;

        const s = data?.stateObj || data?.state || data;
        const requested = parseFloat(s?.requested ?? cashmaticInfo.requested) || 0;
        const inserted = parseFloat(s?.inserted ?? cashmaticInfo.inserted) || 0;
        const dispensed = parseFloat(s?.dispensed ?? cashmaticInfo.dispensed) || 0;
        const notDispensed = parseFloat(s?.notDispensed ?? cashmaticInfo.notDispensed) || 0;
        const state = s?.state || s?.status || cashmaticInfo.state;

        setCashmaticInfo({ requested, inserted, dispensed, notDispensed, state });

        if (state === 'COMPLETED') {
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          setProcessing(false);
          setShowCashmaticModal(false);
          handleConfirm();
        }

        if (state === 'CANCELLED' || state === 'ERROR') {
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          setProcessing(false);
          setShowCashmaticModal(false);
          setError(state === 'CANCELLED' ? 'Cashmatic geannuleerd.' : 'Cashmatic fout.');
        }
      } catch (e) {
        console.error(e);
        setCashmaticPolling(false);
        setCashmaticSessionId(null);
        setProcessing(false);
        setShowCashmaticModal(false);
        setError(`Cashmatic status fout: ${e?.message || String(e)}`);
      }
    };

    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [cashmaticPolling, cashmaticSessionId, cashmaticInfo, handleConfirm]);

  // Poll Payworld
  useEffect(() => {
    if (!payworldPolling || !payworldSessionId) return;

    const poll = async () => {
      try {
        const res = await ApiService.getPayworldStatus(payworldSessionId);
        const data = res?.data || res;

        const state = data?.state || 'IN_PROGRESS';
        const message = data?.message || payworldStatus.message;
        const details = data?.details || payworldStatus.details;

        setPayworldStatus({ state, message, details });

        if (state === 'APPROVED' && !payworldFinalizedRef.current) {
          payworldFinalizedRef.current = true;
          setPayworldPolling(false);
          setPayworldSessionId(null);
          setProcessing(false);
          setShowPayworldModal(false);
          handleConfirm();
        }

        if (['DECLINED', 'CANCELLED', 'ERROR'].includes(state)) {
          setPayworldPolling(false);
          setPayworldSessionId(null);
          setProcessing(false);
          setShowPayworldModal(false);
          setError(`Payworld status: ${state}`);
        }
      } catch (e) {
        console.error(e);
        setPayworldPolling(false);
        setPayworldSessionId(null);
        setProcessing(false);
        setShowPayworldModal(false);
        setError(`Payworld status fout: ${e?.message || String(e)}`);
      }
    };

    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [payworldPolling, payworldSessionId, payworldStatus.message, payworldStatus.details, handleConfirm]);

  return (
    <KioskLayout maxWidth="">
      <FixedBackButton onClick={handleGoBack} disabled={false} />

      <div className="max-w-5xl mx-auto w-full px-6 py-10">
        <KioskHeader
          title="Betaalmethode | Payment method | طريقة الدفع"
          subtitle="Kies hoe je wil betalen | Choose how to pay | اختر طريقة الدفع"
          showBack={false}
        />

        <div className="mt-6 text-white/80 text-xl">
          Bedrag: <span className="font-extrabold text-white">€ {amount}</span>
          {paymentType?.id ? <span className="ml-4">Type: {String(paymentType.id)}</span> : null}
          {memberInfo?.id ? <span className="ml-4">Member: {String(memberInfo.id)}</span> : null}
        </div>

        {error ? (
          <div className="mt-6 bg-red-900/40 border border-red-500 text-red-200 p-4 rounded-2xl text-xl font-bold whitespace-pre-wrap">
            {error}
          </div>
        ) : null}

        {debug ? (
          <div className="mt-4 bg-white/10 border border-white/20 text-white p-4 rounded-2xl text-base whitespace-pre-wrap">
            {debug}
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            type="button"
            disabled={processing}
            onClick={startCashmatic}
            className="bg-white rounded-[36px] p-8 shadow-[0_18px_40px_rgba(0,0,0,0.22)] min-h-[460px] border border-black/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <img src="/icon kiosk/cash.png" alt="cash" className="mx-auto h-[260px] object-contain" draggable={false} />
            <div className="mt-4 text-center">
              <div className="text-black text-4xl font-extrabold">Cash</div>
              <div className="text-black text-3xl font-bold mt-2">Cash</div>
              <div className="text-black text-4xl font-extrabold mt-2" dir="rtl">نقدًا</div>
            </div>
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={startPayworld}
            className="bg-white rounded-[36px] p-8 shadow-[0_18px_40px_rgba(0,0,0,0.22)] min-h-[460px] border border-black/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <img src="/icon kiosk/bancontact.png" alt="bancontact" className="mx-auto h-[260px] object-contain" draggable={false} />
            <div className="mt-4 text-center">
              <div className="text-black text-4xl font-extrabold">Bancontact</div>
              <div className="text-black text-3xl font-bold mt-2">Card</div>
              <div className="text-black text-4xl font-extrabold mt-2" dir="rtl">بطاقة</div>
            </div>
          </button>
        </div>

        {/* CASHMATIC MODAL */}
        {showCashmaticModal && (
          <div className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-8">
            <div className="bg-pos-bg-secondary rounded-2xl border border-pos-border-primary w-full max-w-2xl p-8">
              <div className="text-3xl font-extrabold text-white mb-4">Cashmatic</div>
              <div className="text-xl text-white/80 mb-2">Requested: €{fmt(cashmaticInfo.requested)}</div>
              <div className="text-xl text-white/80 mb-2">Inserted: €{fmt(cashmaticInfo.inserted)}</div>
              <div className="text-xl text-white/80 mb-6">Status: {cashmaticInfo.state || '...'}</div>

              <div className="flex gap-4">
                <KioskButton variant="danger" size="large" onClick={cancelCashmatic}>
                  Cancel
                </KioskButton>
              </div>
            </div>
          </div>
        )}

        {/* PAYWORLD MODAL */}
        {showPayworldModal && (
          <div className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-8">
            <div className="bg-pos-bg-secondary rounded-2xl border border-pos-border-primary w-full max-w-2xl p-8">
              <div className="text-3xl font-extrabold text-white mb-4">Bancontact / Payworld</div>
              <div className="text-xl text-white/80 mb-6">{payworldStatus.message || '...'}</div>

              <div className="flex gap-4">
                <KioskButton variant="danger" size="large" onClick={cancelPayworld}>
                  Cancel
                </KioskButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </KioskLayout>
  );
};

export default PaymentMethodPage;
