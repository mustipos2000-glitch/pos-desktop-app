import React from 'react';
import './css/ReceiptModal.css';

const ReceiptModal = ({ cart, total, onClose, onPrint }) => {
  const currentDate = new Date().toLocaleString();

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-content">
          <div className="receipt-header">
            <h2>Receipt</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="receipt-body">
            <div className="receipt-info">
              <p><strong>Date:</strong> {currentDate}</p>
              <p><strong>Order #:</strong> {Math.floor(Math.random() * 10000)}</p>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-items">
              {cart.map((item) => (
                <div key={item.id} className="receipt-item">
                  <div className="receipt-item-details">
                    <span className="receipt-item-name">{item.name}</span>
                    <span className="receipt-item-qty">x{item.quantity}</span>
                  </div>
                  <span className="receipt-item-price">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-total">
              <span>Total</span>
              <span className="receipt-total-amount">€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="receipt-actions">
            <button className="receipt-btn print" onClick={onPrint}>
              🖨️ Print
            </button>
            <button className="receipt-btn close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
