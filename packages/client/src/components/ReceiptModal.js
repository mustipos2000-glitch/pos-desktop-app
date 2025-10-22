import React from 'react';
import './css/ReceiptModal.css';

const ReceiptModal = ({ cart, total, subTotal, tax, discount, onClose, onPrint }) => {
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

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-content">
          <button className="receipt-close-btn" onClick={onClose}>✕</button>
          
          <div className="receipt-paper">
            {/* Store Header */}
            <div className="receipt-store-header">
              <h1 className="store-name">RETAIL STORE</h1>
              <p className="store-address">123 Main Street</p>
              <p className="store-address">City, State 12345</p>
              <p className="store-phone">Tel: (555) 123-4567</p>
            </div>

            <div className="receipt-separator">================================</div>

            {/* Transaction Info */}
            <div className="receipt-transaction-info">
              <div className="receipt-info-row">
                <span>Date: {formatDate}</span>
                <span>Time: {formatTime}</span>
              </div>
              <div className="receipt-info-row">
                <span>Order #: {orderNumber}</span>
                <span>Cashier: 001</span>
              </div>
            </div>

            <div className="receipt-separator">================================</div>

            {/* Items */}
            <div className="receipt-items">
              {cart.map((item) => (
                <div key={item.id} className="receipt-item">
                  <div className="receipt-item-line1">
                    <span className="item-name">{item.name}</span>
                  </div>
                  <div className="receipt-item-line2">
                    <span className="item-details">
                      {item.quantity} x €{item.price.toFixed(2)}
                    </span>
                    <span className="item-total">
                      €{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-separator">--------------------------------</div>

            {/* Summary */}
            <div className="receipt-summary">
              <div className="summary-row">
                <span>SUBTOTAL</span>
                <span>€{subTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>TAX (12%)</span>
                <span>€{tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount">
                  <span>DISCOUNT</span>
                  <span>-€{discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="receipt-separator">================================</div>
              
              <div className="receipt-total">
                <span>TOTAL</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-separator">================================</div>

            {/* Footer */}
            <div className="receipt-footer">
              <p>Thank you for your purchase!</p>
              <p>Please keep this receipt</p>
              <p>for your records</p>
              {/* <div className="receipt-barcode">||||| |||| | |||| |||||</div> */}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="receipt-actions">
            <button className="receipt-btn print" onClick={onPrint}>
              🖨️ Print Receipt
            </button>
            <button className="receipt-btn email">
              📧 Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;