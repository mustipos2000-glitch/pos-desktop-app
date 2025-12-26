import React, { useState } from 'react';
import ApiService from '../services/api';

const ReceiptModal = ({ cart, total, subTotal, tax, discount, onClose, onPrint }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState({ loading: false, message: '', error: false });
  // Validate all numeric props
  const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
  const validSubTotal = typeof subTotal === 'number' && !isNaN(subTotal) ? subTotal : 0;
  const validTax = typeof tax === 'number' && !isNaN(tax) ? tax : 0;
  const validDiscount = typeof discount === 'number' && !isNaN(discount) ? discount : 0;
  const validCart = Array.isArray(cart) ? cart : [];

  const currentDate = new Date();
  const formatDate = currentDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formatTime = currentDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const orderNumber = `${Date.now().toString().slice(-6)}`;

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatus({ loading: false, message: 'Please enter a valid email address', error: true });
      return;
    }

    setEmailStatus({ loading: true, message: 'Sending...', error: false });

    try {
      const receiptData = {
        type: 'pos',
        email,
        orderNumber,
        date: formatDate,
        time: formatTime,
        cart: validCart,
        subTotal: validSubTotal,
        tax: validTax,
        discount: validDiscount,
        total: validTotal
      };

      const result = await ApiService.sendReceiptEmail(receiptData);

      if (result.success) {
        setEmailStatus({ loading: false, message: '✅ Receipt sent successfully!', error: false });
        setTimeout(() => {
          setShowEmailModal(false);
          setEmail('');
          setEmailStatus({ loading: false, message: '', error: false });
        }, 2000);
      } else {
        setEmailStatus({ loading: false, message: `❌ Failed: ${result.error || 'Unknown error'}`, error: true });
      }
    } catch (error) {
      console.error('Email send error:', error);
      setEmailStatus({ loading: false, message: `❌ Error: ${error.message}`, error: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-secondary rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button className="absolute top-4 right-4 text-pos-text-muted hover:text-pos-text-primary text-xl z-10" onClick={onClose}>✕</button>

          <div className="bg-white text-black p-6 font-mono text-sm overflow-y-auto max-h-[70vh]">
            {/* Store Header */}
            <div className="text-center mb-4">
              <h1 className="text-lg font-bold">RETAIL STORE</h1>
              <p className="text-xs">123 Main Street</p>
              <p className="text-xs">City, State 12345</p>
              <p className="text-xs">Tel: (555) 123-4567</p>
            </div>

            <div className="text-center mb-4">================================</div>

            {/* Transaction Info */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Date: {formatDate}</span>
                <span>Time: {formatTime}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Order #: {orderNumber}</span>
                <span>Cashier: 001</span>
              </div>
            </div>

            <div className="text-center mb-4">================================</div>

            {/* Items */}
            <div className="mb-4">
              {validCart.map((item, index) => {
                const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                const itemQty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                const hasSubProducts = Array.isArray(item.subProducts) && item.subProducts.length > 0;
                
                return (
                  <div key={item.cartItemId || `${item.id}_${index}`} className="mb-2">
                    {/* Parent Product */}
                    <div className="text-xs font-medium">
                      {item.name || 'Unknown Item'}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>
                        {itemQty} x €{itemPrice.toFixed(2)}
                      </span>
                      <span>
                        €{(itemPrice * itemQty).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Sub Products */}
                    {hasSubProducts && (
                      <div className="ml-3 mt-1 border-l-2 border-gray-400 pl-2">
                        {item.subProducts.map((subItem, subIndex) => {
                          const subPrice = typeof subItem.price === 'number' && !isNaN(subItem.price) ? subItem.price : 0;
                          const subQty = typeof subItem.quantity === 'number' && !isNaN(subItem.quantity) ? subItem.quantity : 0;
                          return (
                            <div key={subItem.cartItemId || `sub_${subIndex}`} className="mb-1">
                              <div className="text-xs font-medium text-gray-600">
                                + {subItem.name || 'Unknown Sub-Item'}
                              </div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>
                                  {subQty} x €{subPrice.toFixed(2)}
                                </span>
                                <span>
                                  €{(subPrice * subQty).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mb-4">--------------------------------</div>

            {/* Summary */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>SUBTOTAL</span>
                <span>€{validSubTotal.toFixed(2)}</span>
              </div>
              {validTax > 0 && (
                <div className="flex justify-between text-xs mb-1">
                  <span>TAX (12%)</span>
                  <span>€{validTax.toFixed(2)}</span>
                </div>
              )}
              {validDiscount > 0 && (
                <div className="flex justify-between text-xs mb-1">
                  <span>DISCOUNT</span>
                  <span>-€{validDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="text-center my-2">================================</div>

              <div className="flex justify-between text-sm font-bold">
                <span>TOTAL</span>
                <span>€{validTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center mb-4">================================</div>

            {/* Footer */}
            <div className="text-center text-xs">
              <p>Thank you for your purchase!</p>
              <p>Please keep this receipt</p>
              <p>for your records</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 bg-pos-bg-secondary">
            <button className="btn-success flex-1 flex items-center justify-center gap-2" onClick={onPrint}>
              🖨️ Print Receipt
            </button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => setShowEmailModal(true)}>
              📧 Send Email
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60]" onClick={() => setShowEmailModal(false)}>
          <div className="bg-pos-bg-secondary rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-pos-text-primary">Send Receipt via Email</h3>
              <button className="text-pos-text-muted hover:text-pos-text-primary text-2xl" onClick={() => setShowEmailModal(false)}>✕</button>
            </div>

            <div className="mb-4">
              <label className="block text-pos-text-secondary mb-2 text-sm">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-4 py-3 bg-pos-bg-primary border border-pos-border rounded-lg text-pos-text-primary focus:outline-none focus:border-pos-accent"
                disabled={emailStatus.loading}
                autoFocus
              />
            </div>

            {emailStatus.message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${emailStatus.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {emailStatus.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="btn-success flex-1 flex items-center justify-center gap-2"
                onClick={handleSendEmail}
                disabled={emailStatus.loading}
              >
                {emailStatus.loading ? '⏳ Sending...' : '📧 Send Receipt'}
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmail('');
                  setEmailStatus({ loading: false, message: '', error: false });
                }}
                disabled={emailStatus.loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptModal;