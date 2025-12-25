import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

/**
 * TicketSelectionPage - A page for selecting how to receive the ticket/receipt
 * Options: Print ticket, No ticket, or Ticket via Email
 */
const TicketSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleOptionSelect = async (option) => {
    setSelectedOption(option);

    // Store the ticket option
    localStorage.setItem('ticketOption', option);

    // Navigate based on selection
    if (option === 'print') {
      // Print receipt before completing
      await handlePrintReceipt();
    } else if (option === 'no-ticket') {
      // Complete the transaction and go back to mosque payment screen
      handleComplete();
    } else if (option === 'email') {
      // Open email modal
      setShowEmailModal(true);
    }
  };

  const handlePrintReceipt = async () => {
    setPrinting(true);

    try {
      // Get stored payment data
      const transactionId = localStorage.getItem('transactionId');
      const paymentMethod = localStorage.getItem('paymentMethod');
      const amount = localStorage.getItem('paymentAmount');
      const memberStr = localStorage.getItem('selectedMember');
      const paymentTypeStr = localStorage.getItem('mosquePaymentType');
      const sadakaGoalStr = localStorage.getItem('sadakaGoal');
      const sadakaType = localStorage.getItem('sadakaType');
      const rentDateTimeStr = localStorage.getItem('rentDateTime');

      const member = memberStr ? JSON.parse(memberStr) : null;
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      const sadakaGoal = sadakaGoalStr ? JSON.parse(sadakaGoalStr) : null;
      const rentDateTime = rentDateTimeStr ? JSON.parse(rentDateTimeStr) : null;

      // Get receipt printer (printer with type 'receipt' or first available printer)
      const printersResponse = await fetch(`${API_URL}/printers`);
      const printersData = await printersResponse.json();
      const printers = printersData.data || [];

      // Find receipt printer
      const receiptPrinter = printers.find(p => p.printer_type === 'receipt') || printers[0];

      if (!receiptPrinter) {
        alert('No printer configured. Please configure a printer in settings.');
        handleComplete();
        return;
      }

      // Prepare order data for receipt
      let itemDescription = paymentType?.titleEn || 'Payment';
      let itemNotes = '';

      // Add specific details based on payment type
      if (paymentType?.id === 'sadaka') {
        itemDescription = sadakaType === 'named' ? 'Named Sadaka' : 'Anonymous Sadaka';
        itemNotes = sadakaGoal ? `Goal: ${sadakaGoal.titleEn}` : 'Goal: General';
      } else if (paymentType?.id === 'rent' && rentDateTime) {
        itemDescription = 'Rent Space / Kitchen';
        itemNotes = `From: ${rentDateTime.startDate} ${rentDateTime.startTime} To: ${rentDateTime.endDate} ${rentDateTime.endTime}`;
      } else if (paymentType?.id === 'membership') {
        itemDescription = 'Membership Fee';
      }

      const orderData = {
        id: transactionId,
        transaction_id: transactionId,
        created_at: new Date().toISOString(),
        payment_method: paymentMethod === 'cash' ? 'Cashmatic' : 'Bancontact',
        member_name: member ? member.fullName : 'Anonymous',
        member_id: member?.id,
        discount: 0,
        tax: 0,
        items: [
          {
            name: itemDescription,
            qty: 1,
            price: parseFloat(amount),
            notes: itemNotes
          }
        ]
      };

      // Send print request
      const printResponse = await fetch(`${API_URL}/printers/print-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printer_id: receiptPrinter.id,
          order_data: orderData
        })
      });

      const printResult = await printResponse.json();

      if (printResult.success) {
        console.log('✅ Receipt printed successfully');
      } else {
        console.error('❌ Print failed:', printResult.error);
        alert(`Print failed: ${printResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print receipt. Please try again.');
    } finally {
      setPrinting(false);
      handleComplete();
    }
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);

    try {
      // Get stored payment data
      const transactionId = localStorage.getItem('transactionId');
      const paymentMethod = localStorage.getItem('paymentMethod');
      const amount = localStorage.getItem('paymentAmount');
      const memberStr = localStorage.getItem('selectedMember');
      const paymentTypeStr = localStorage.getItem('mosquePaymentType');
      const sadakaGoalStr = localStorage.getItem('sadakaGoal');
      const sadakaType = localStorage.getItem('sadakaType');
      const rentDateTimeStr = localStorage.getItem('rentDateTime');

      const member = memberStr ? JSON.parse(memberStr) : null;
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      const sadakaGoal = sadakaGoalStr ? JSON.parse(sadakaGoalStr) : null;
      const rentDateTime = rentDateTimeStr ? JSON.parse(rentDateTimeStr) : null;

      // Prepare receipt data
      let itemDescription = paymentType?.titleEn || 'Payment';
      let itemNotes = '';

      if (paymentType?.id === 'sadaka') {
        itemDescription = sadakaType === 'named' ? 'Named Sadaka' : 'Anonymous Sadaka';
        itemNotes = sadakaGoal ? `Goal: ${sadakaGoal.titleEn}` : 'Goal: General';
      } else if (paymentType?.id === 'rent' && rentDateTime) {
        itemDescription = 'Rent Space / Kitchen';
        itemNotes = `From: ${rentDateTime.startDate} ${rentDateTime.startTime} To: ${rentDateTime.endDate} ${rentDateTime.endTime}`;
      } else if (paymentType?.id === 'membership') {
        itemDescription = 'Membership Fee';
      }

      const receiptData = {
        email: email,
        transaction_id: transactionId,
        payment_method: paymentMethod === 'cash' ? 'Cashmatic' : 'Bancontact',
        amount: parseFloat(amount),
        member_name: member ? member.fullName : 'Anonymous',
        payment_type: itemDescription,
        details: itemNotes,
        timestamp: new Date().toISOString()
      };

      // Send email request
      const emailResponse = await fetch(`${API_URL}/payments/send-receipt-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
      });

      const emailResult = await emailResponse.json();

      if (emailResult.success) {
        alert('Receipt sent to your email successfully!');
        setShowEmailModal(false);
        handleComplete();
      } else {
        alert(`Failed to send email: ${emailResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Email send error:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleComplete = () => {
    // Clear the stored data
    localStorage.removeItem('selectedMember');
    localStorage.removeItem('paymentAmount');
    localStorage.removeItem('paymentMethod');
    localStorage.removeItem('ticketOption');
    localStorage.removeItem('transactionId');
    localStorage.removeItem('paymentData');
    localStorage.removeItem('mosquePaymentType');
    localStorage.removeItem('sadakaGoal');
    localStorage.removeItem('sadakaType');
    localStorage.removeItem('rentDateTime');

    // Navigate back to mosque payment screen
    navigate('/mosque-payment');
  };


  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
            Ticket Options
          </h1>
          <p className="text-xl text-pos-text-secondary">
            How would you like to receive your ticket?
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 pb-4">
        <div className="flex flex-col justify-center max-w-5xl w-full mx-auto h-full">
          {/* Ticket Options */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Print Ticket */}
            <button
              onClick={() => handleOptionSelect('print')}
              disabled={printing}
              className={`
                relative bg-pos-bg-secondary rounded-xl p-8 
                transition-all duration-200 border
                ${selectedOption === 'print'
                  ? 'border-pos-interactive-hover shadow-lg scale-[1.02]'
                  : 'border-pos-border-primary'
                }
                hover:border-pos-interactive-hover hover:shadow-lg
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-[0.98]
              `}
            >
              {/* Icon */}
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-pos-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>

              {/* Text Content */}
              <div className="space-y-3">
                <div className="text-2xl font-bold text-pos-text-primary">
                  {printing ? 'Printing...' : 'Print Ticket'}
                </div>
                <div className="text-lg text-pos-text-secondary">
                  Imprimer le ticket
                </div>
                <div className="text-lg text-pos-text-secondary">
                  Print receipt
                </div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">
                  طباعة التذكرة
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedOption === 'print' && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-pos-interactive-hover rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>

            {/* No Ticket */}
            <button
              onClick={() => handleOptionSelect('no-ticket')}
              disabled={printing}
              className={`
                relative bg-pos-bg-secondary rounded-xl p-8 
                transition-all duration-200 border
                ${selectedOption === 'no-ticket'
                  ? 'border-pos-interactive-hover shadow-lg scale-[1.02]'
                  : 'border-pos-border-primary'
                }
                hover:border-pos-interactive-hover hover:shadow-lg
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-[0.98]
              `}
            >
              {/* Icon */}
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-pos-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>

              {/* Text Content */}
              <div className="space-y-3">
                <div className="text-2xl font-bold text-pos-text-primary">
                  No Ticket
                </div>
                <div className="text-lg text-pos-text-secondary">
                  Pas de ticket
                </div>
                <div className="text-lg text-pos-text-secondary">
                  No receipt
                </div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">
                  بدون تذكرة
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedOption === 'no-ticket' && (
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

      {/* Printing Overlay */}
      {printing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-pos-bg-secondary rounded-lg p-8 text-center border border-pos-border-primary">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pos-text-primary mx-auto mb-4"></div>
            <p className="text-pos-text-primary text-lg font-semibold">
              Printing receipt...
            </p>
            <p className="text-pos-text-secondary text-sm mt-2">Please wait...</p>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-pos-bg-secondary rounded-lg p-8 max-w-md w-full mx-4 border border-pos-border-primary">
            <h2 className="text-xl font-bold text-pos-text-primary mb-4 text-center">
              Enter Email Address
            </h2>
            <p className="text-sm text-pos-text-secondary mb-4 text-center">
              We'll send your receipt to this email
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-lg border border-pos-border-primary bg-pos-bg-primary text-pos-text-primary mb-6 focus:outline-none focus:border-pos-interactive-hover"
              disabled={sendingEmail}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmail('');
                }}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary"
              >
                Cancel
              </button>

              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !email}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors border ${sendingEmail || !email
                  ? 'bg-pos-interactive-primary text-pos-text-disabled cursor-not-allowed border-pos-border-primary opacity-50'
                  : 'bg-pos-bg-primary text-pos-text-primary hover:bg-pos-interactive-hover border-pos-border-primary'
                  }`}
              >
                {sendingEmail ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSelectionPage;
