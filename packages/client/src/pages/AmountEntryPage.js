import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AmountEntryPage - A page for entering payment amount using a numpad
 * Used after member selection for membership fee payments
 */
const AmountEntryPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('0');

  const handleNumberClick = (num) => {
    if (amount === '0') {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleClear = () => {
    setAmount('0');
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount('0');
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleGoBack = () => {
    navigate('/member-selection');
  };

  const handleNext = () => {
    if (amount === '0' || amount === '') {
      alert('Please enter an amount greater than 0');
      return;
    }

    // Store the amount
    localStorage.setItem('paymentAmount', amount);

    // Navigate to payment method page
    navigate('/payment-method');
  };

  const formatAmount = (value) => {
    return `€ ${value}`;
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-pos-text-primary mb-1">
            Enter the amount
          </h1>
          <p className="text-xs text-pos-text-secondary">
            Use the keyboard to enter the amount
          </p>
        </div>

        {/* Amount Display */}
        <div className="mb-6 flex justify-center">
          <div className="bg-pos-bg-secondary border border-pos-border-primary rounded-lg px-12 py-4 min-w-[240px] text-center">
            <div className="text-4xl font-bold text-pos-text-primary">
              {formatAmount(amount)}
            </div>
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Row 1 */}
          <button
            onClick={() => handleNumberClick('1')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            1
          </button>
          <button
            onClick={() => handleNumberClick('2')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            2
          </button>
          <button
            onClick={() => handleNumberClick('3')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            3
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumberClick('4')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            4
          </button>
          <button
            onClick={() => handleNumberClick('5')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            5
          </button>
          <button
            onClick={() => handleNumberClick('6')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            6
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumberClick('7')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            7
          </button>
          <button
            onClick={() => handleNumberClick('8')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            8
          </button>
          <button
            onClick={() => handleNumberClick('9')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            9
          </button>

          {/* Row 4 */}
          <button
            onClick={handleClear}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            C
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="bg-pos-bg-secondary text-pos-text-primary text-xl font-semibold py-4 rounded-lg hover:bg-pos-interactive-hover transition-colors border border-pos-border-primary"
          >
            ←
          </button>
        </div>

        {/* Total Display */}
        <div className="text-center mb-4">
          <p className="text-pos-text-primary text-sm">
            Total: <span className="font-bold">{formatAmount(amount)}</span>
          </p>
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
            onClick={handleNext}
            className="px-6 py-2 bg-pos-bg-secondary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmountEntryPage;
