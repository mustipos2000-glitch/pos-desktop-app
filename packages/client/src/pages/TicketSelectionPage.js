import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * TicketSelectionPage - A page for selecting how to receive the ticket/receipt
 * Options: Print ticket, No ticket, or Ticket via WhatsApp
 */
const TicketSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    // Store the ticket option
    localStorage.setItem('ticketOption', option);
    
    // Navigate based on selection
    if (option === 'print' || option === 'no-ticket') {
      // Complete the transaction and go back to mosque payment screen
      handleComplete();
    } else if (option === 'whatsapp') {
      // Could open WhatsApp input or directly complete
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Clear the stored data
    localStorage.removeItem('selectedMember');
    localStorage.removeItem('paymentAmount');
    localStorage.removeItem('paymentMethod');
    localStorage.removeItem('ticketOption');
    
    // Navigate back to mosque payment screen
    navigate('/mosque-payment');
  };

  const handleGoBack = () => {
    navigate('/payment-method');
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-pos-text-primary mb-1">
            Ticket
          </h1>
          <p className="text-xs text-pos-text-secondary">
            How would you like to receive your ticket?
          </p>
        </div>

        {/* Ticket Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Print Ticket */}
          <button
            onClick={() => handleOptionSelect('print')}
            className="bg-pos-bg-secondary rounded-lg p-8 transition-all border border-pos-border-primary hover:border-pos-interactive-hover"
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">
                Print ticket
              </div>
              <div className="text-base text-pos-text-secondary">
                Imprimer le ticket
              </div>
              <div className="text-base text-pos-text-secondary">
                Print receipt
              </div>
              <div className="text-base text-pos-text-secondary" dir="rtl">
                طباعة التذكرة
              </div>
            </div>
          </button>

          {/* No Ticket */}
          <button
            onClick={() => handleOptionSelect('no-ticket')}
            className="bg-pos-bg-secondary rounded-lg p-8 transition-all border border-pos-border-primary hover:border-pos-interactive-hover"
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">
                No ticket
              </div>
              <div className="text-base text-pos-text-secondary">
                Pass the ticket
              </div>
              <div className="text-base text-pos-text-secondary">
                No receipt
              </div>
              <div className="text-base text-pos-text-secondary" dir="rtl">
                بدون تذكرة
              </div>
            </div>
          </button>

          {/* WhatsApp Ticket - Full width on second row */}
          <button
            onClick={() => handleOptionSelect('whatsapp')}
            className="bg-pos-bg-secondary rounded-lg p-8 transition-all border border-pos-border-primary hover:border-pos-interactive-hover md:col-span-1"
          >
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold text-pos-text-primary">
                Ticket via WhatsApp
              </div>
              <div className="text-base text-pos-text-secondary">
                Ticket by WhatsApp
              </div>
              <div className="text-base text-pos-text-secondary">
                Receipt via WhatsApp
              </div>
              <div className="text-base text-pos-text-secondary" dir="rtl">
                التذكرة عبر واتساب
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Button */}
        <div className="flex justify-start">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketSelectionPage;
