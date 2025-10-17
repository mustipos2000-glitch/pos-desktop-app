import { useState } from 'react';
import './css/OrderPanel.css';
import ReceiptModal from './ReceiptModal';

const OrderPanel = ({ cart, onUpdateQuantity, onClearCart }) => {
  const [showReceipt, setShowReceipt] = useState(false);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCashPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    setShowReceipt(true);
  };

  const handleShowReceipt = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    onClearCart();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="order-panel">
      <div className="order-header">
        <div className="order-tabs">
          <span className="order-tab">Item</span>
          <span className="order-tab">Quantity</span>
          <span className="order-tab">Total</span>
        </div>
      </div>

      <div className="order-items">
        {cart.length === 0 ? (
          <div className="empty-cart">No items in cart</div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="order-item">
              <div className="item-name">{item.name}</div>
              <div className="item-quantity">
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <div className="item-total">{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>

      <div className="order-total">
        <span>Total</span>
        <span className="total-amount">{calculateTotal().toFixed(2)}</span>
      </div>

      <div className="order-actions">
        <button className="action-icon-btn trash" onClick={onClearCart}>
          🗑️
        </button>
        <button className="action-icon-btn cart">
          🛒
        </button>
        <button className="action-icon-btn note">
          📝
        </button>
        <button className="action-icon-btn receipt" onClick={handleShowReceipt}>
          🧾
        </button>
      </div>

      <div className="numpad">
        <button className="num-btn clear">C</button>
        <button className="num-btn">7</button>
        <button className="num-btn">8</button>
        <button className="num-btn">9</button>
        <button className="num-btn">.</button>
        <button className="num-btn">4</button>
        <button className="num-btn">5</button>
        <button className="num-btn">6</button>
        <button className="num-btn">0</button>
        <button className="num-btn">1</button>
        <button className="num-btn">2</button>
        <button className="num-btn">3</button>
      </div>

      <div className="payment-actions">
        <button className="payment-btn drawer">
          💳 Drawer
        </button>
        <button className="payment-btn card">
          💳 Card
        </button>
        <button className="payment-btn cash" onClick={handleCashPayment}>
          💵 Cash
        </button>
      </div>

      {showReceipt && (
        <ReceiptModal
          cart={cart}
          total={calculateTotal()}
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
        />
      )}
    </div>
  );
};

export default OrderPanel;
