import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout, KioskHeader, KioskNumpad } from "../../components/mosque";

const AmountEntryPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const paymentTypeStr = localStorage.getItem("mosquePaymentType");
  const sadakaType = localStorage.getItem("sadakaType");

  const paymentType = useMemo(() => {
    try {
      return paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
    } catch {
      return null;
    }
  }, [paymentTypeStr]);

  // Expliciete back (geen loop)
  const handleGoBack = () => {
    if (paymentType?.id === "membership") {
      navigate("/mosque/member-selection", { replace: true });
      return;
    }
    if (paymentType?.id === "sadaka") {
      if (sadakaType === "anonymous") navigate("/mosque/sadaka-selection", { replace: true });
      else navigate("/mosque/member-selection", { replace: true });
      return;
    }
    if (paymentType?.id === "rent") {
      navigate("/mosque/rent-datetime", { replace: true });
      return;
    }
    navigate("/mosque-payment", { replace: true });
  };

  const handleNext = () => {
    const numeric = parseFloat(String(amount).replace(",", "."));
    if (!numeric || numeric <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    localStorage.setItem("paymentAmount", String(numeric));
    navigate("/mosque/payment-method", { replace: true });
  };

  const BigGreenContinueBtn = ({ disabled, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-3xl border-4 shadow-2xl transition-all
        min-h-[170px]
        flex flex-col items-center justify-center
        ${
          disabled
            ? "bg-green-900/40 border-green-900/60 text-white/50 cursor-not-allowed"
            : "bg-green-700 hover:bg-green-800 border-green-900 text-white active:scale-[0.99]"
        }
      `}
    >
      <div className="text-6xl font-extrabold leading-none">✅</div>
      <div className="text-4xl font-extrabold mt-4">Verder</div>
      <div className="text-3xl font-semibold opacity-95 mt-2">Continue</div>
      <div className="text-4xl font-bold mt-3" dir="rtl">متابعة</div>
    </button>
  );

  return (
    <KioskLayout>
      <KioskHeader
        titleNl="Bedrag ingeven"
        titleEn="Enter amount"
        titleAr="أدخل المبلغ"
        showBack={false}   // we gebruiken de vaste knop links onder
      />

      {/* Fixed Back button bottom-left */}
      <button
        type="button"
        onClick={handleGoBack}
        className="
          fixed left-6 bottom-6 z-50
          bg-red-700 hover:bg-red-800 text-white
          rounded-3xl border-4 border-red-900
          shadow-2xl
          px-8 py-6
          min-w-[260px]
          flex flex-col items-center justify-center
          active:scale-[0.99]
          transition
        "
      >
        <div className="text-3xl font-extrabold">Terug</div>
        <div className="text-2xl font-semibold opacity-95 mt-1">Back</div>
        <div className="text-3xl font-bold mt-2" dir="rtl">رجوع</div>
      </button>

      <div className="mt-10 pb-40">
        <div className="bg-white rounded-3xl border-4 border-pos-border-primary shadow-2xl p-8 text-center">
          <div className="text-2xl font-semibold text-gray-600 mb-3">
            Bedrag | Amount | المبلغ
          </div>
          <div className="text-6xl font-extrabold text-black">{amount || "0"} €</div>
        </div>

        <div className="mt-10">
          <KioskNumpad
            value={amount}
            onChange={setAmount}
            onClear={() => setAmount("")}
            onBackspace={() => setAmount((p) => p.slice(0, -1))}
          />
        </div>

        <div className="mt-10">
          <BigGreenContinueBtn disabled={!amount} onClick={handleNext} />
        </div>
      </div>
    </KioskLayout>
  );
};

export default AmountEntryPage;
