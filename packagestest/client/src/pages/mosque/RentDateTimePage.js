import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FixedBackButton from '../../components/mosque/FixedBackButton';
import { KioskLayout, KioskHeader, KioskButton } from '../../components/mosque';

const RentDateTimePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  const handleGoBack = () => navigate(-1);

  useEffect(() => {
    // init defaults if you want
  }, []);

  const handleContinue = async () => {
    if (!date || !timeFrom || !timeTo) return;

    localStorage.setItem('rentDate', date);
    localStorage.setItem('rentTimeFrom', timeFrom);
    localStorage.setItem('rentTimeTo', timeTo);

    navigate('/mosque/amount');
  };

  return (
    <KioskLayout maxWidth="">
      {/* ✅ rode vaste terugknop linksonder */}
      <FixedBackButton onClick={handleGoBack} disabled={loading} />

      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <KioskHeader
          title="Zaal huren | Hall rental | استئجار القاعة"
          subtitle="Kies datum en tijd | Choose date and time | اختر التاريخ والوقت"
          showBack={false}
        />

        <div className="mt-8 bg-white/95 rounded-[38px] p-10 shadow-[0_18px_40px_rgba(0,0,0,0.22)] text-black">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <div className="text-2xl font-extrabold mb-3">Datum | Date | التاريخ</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-2xl px-6 py-5 rounded-2xl bg-white border border-black/10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="text-2xl font-extrabold mb-3">Van | From | من</div>
                <input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="w-full text-2xl px-6 py-5 rounded-2xl bg-white border border-black/10"
                />
              </div>

              <div>
                <div className="text-2xl font-extrabold mb-3">Tot | To | إلى</div>
                <input
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="w-full text-2xl px-6 py-5 rounded-2xl bg-white border border-black/10"
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <KioskButton
              variant="success"
              size="large"
              onClick={handleContinue}
              disabled={!date || !timeFrom || !timeTo}
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

export default RentDateTimePage;
