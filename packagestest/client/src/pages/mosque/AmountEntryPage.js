import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FixedBackButton from '../../components/mosque/FixedBackButton';
import { KioskLayout, KioskHeader, KioskButton } from '../../components/mosque';
import KioskNumpad from '../../components/kiosk/KioskNumpad';

const AmountEntryPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    const normalized = String(amount ?? '').trim().replace(',', '.');
    const value = parseFloat(normalized);

    if (!Number.isFinite(value) || value <= 0) return;

    // ✅ 1 bron van waarheid voor het ingegeven bedrag
    localStorage.setItem('paymentAmount', value.toFixed(2));

    // ✅ voorkom dat een oud ledenbedrag blijft winnen in volgende stappen
    // (tenzij je effectief in de leden-flow zit, die zet memberFeeAmount opnieuw)
    localStorage.removeItem('memberFeeAmount');

    navigate('/mosque/payment-method');
  };

  return (
    <KioskLayout maxWidth="">
      <FixedBackButton onClick={handleGoBack} />

      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <KioskHeader
          title="Bedrag | Amount | المبلغ"
          subtitle="Voer bedrag in | Enter amount | أدخل المبلغ"
          showBack={false}
        />

        <div className="mt-8 bg-white/95 rounded-[38px] p-10 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="text-center text-6xl font-extrabold text-black mb-10">
            {(amount || '0')} €
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <KioskNumpad value={amount} onChange={setAmount} />
            </div>
          </div>

          <div className="mt-10">
            <KioskButton
              variant="success"
              size="large"
              onClick={handleContinue}
              disabled={!amount || parseFloat(String(amount).replace(',', '.')) <= 0}
              className="w-full h-[110px] rounded-2xl text-4xl font-extrabold"
            >
              Doorgaan | Continue | متابعة
            </KioskButton>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};

export default AmountEntryPage;
