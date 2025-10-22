import { useState, useRef } from 'react';
import './css/OrderPanel.css';
import ReceiptModal from './ReceiptModal';
import ApiService from '../services/api';

const OrderPanel = ({ cart, onUpdateQuantity, onClearCart }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const discountInputRef = useRef(null);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity * 0.12), 0);
  };

  const handleCashPayment = async () => {
    if (cart.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order data
      const subTotal = calculateTotal();
      const tax = calculateTax();
      const total = subTotal + tax - discount;

      const orderData = {
        tax: tax,
        status: 'completed',
        note: '',
        sub_total: subTotal,
        total: total,
        discount: discount,
        details: cart.map(item => ({
          product_id: item.id,
          qty: item.quantity,
          total: item.price * item.quantity
        }))
      };

      // Send order to backend
      await ApiService.createOrder(orderData);

      // Show receipt
      setShowReceipt(true);
    } catch (error) {
      console.error('Error processing order:', error);
      // alert('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowReceipt = () => {
    if (cart.length === 0) {
      // alert('Cart is empty!');
      return;
    }
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    // onClearCart();
  };

  const handlePrintReceipt = () => {
    setShowReceipt(false);
    onClearCart();
    // Reset discount input and state
    setDiscount(0);
    if (discountInputRef.current) {
      discountInputRef.current.value = '';
    }
    window.print();
  };

  // Handle numeric keypad input for discount
  const handleNumpadInput = (value) => {
    if (!discountInputRef.current) return;

    const currentDiscount = discount.toString();

    if (value === 'C') {
      // Clear discount
      setDiscount(0);
      discountInputRef.current.value = '';
    } else if (value === '.') {
      // Add decimal point if not already present
      if (!currentDiscount.includes('.')) {
        const newDiscount = currentDiscount + '.';
        setDiscount(parseFloat(newDiscount) || 0);
        discountInputRef.current.value = newDiscount;
      }
    } else {
      // Add digit
      const newDiscount = currentDiscount === '0' ? value : currentDiscount + value;
      setDiscount(parseFloat(newDiscount) || 0);
      discountInputRef.current.value = newDiscount;
    }
  };

  return (
    <div className="order-panel">
      <div className="order-header">
        <div className="order-tabs">
          <span className="">Item</span>
          <span className="">Quantity</span>
          <span className="total-price">Total</span>
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

      <div className="total">
        <span>Gross Total</span>
        <span className="amount">{calculateTotal().toFixed(2)}</span>
      </div>
      <div className="total">
        <span>Tax 12%</span>
        <span className="amount">{calculateTax().toFixed(2)}</span>
      </div>
      <div className="total">
        <span>Discount</span>
        <input
          type='text'
          className="discount"
          placeholder="0"
          ref={discountInputRef}
          onChange={(e) => {
            const newDiscount = parseFloat(e.target.value) || 0;
            setDiscount(newDiscount);
          }}
        />
      </div>
      <div className="total">
        <span>Net Total</span>
        <span className="amount">{(calculateTotal() + calculateTax() - discount).toFixed(2)}</span>
      </div>

      <div className="numpad" id='order-numpad'>
        <button className="num-btn clear" onClick={() => handleNumpadInput('C')}>C</button>
        <button className="num-btn" onClick={() => handleNumpadInput('7')}>7</button>
        <button className="num-btn" onClick={() => handleNumpadInput('8')}>8</button>
        <button className="num-btn" onClick={() => handleNumpadInput('9')}>9</button>
        <button className="num-btn" onClick={() => handleNumpadInput('.')}>.</button>
        <button className="num-btn" onClick={() => handleNumpadInput('4')}>4</button>
        <button className="num-btn" onClick={() => handleNumpadInput('5')}>5</button>
        <button className="num-btn" onClick={() => handleNumpadInput('6')}>6</button>
        <button className="num-btn" onClick={() => handleNumpadInput('0')}>0</button>
        <button className="num-btn" onClick={() => handleNumpadInput('1')}>1</button>
        <button className="num-btn" onClick={() => handleNumpadInput('2')}>2</button>
        <button className="num-btn" onClick={() => handleNumpadInput('3')}>3</button>
      </div>

      <div className="payment-actions">
        <button className="action-icon-btn trash" onClick={onClearCart} title="Clear Cart">
          🗑️
        </button>
        <button className="payment-btn drawer" title="Open Drawer">
          Drawer
        </button>
        <button className="payment-btn card" title="Card Payment">
          Card
        </button>
        <button
          className="payment-btn cash"
          onClick={handleCashPayment}
          title="Cash Payment"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Cash'}
        </button>
      </div>

      {showReceipt && (
        <ReceiptModal
          cart={cart}
          total={calculateTotal() + calculateTax() - discount}
          subTotal={calculateTotal()}
          tax={calculateTax()}
          discount={discount}
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
        />
      )}
    </div>
  );
};

export default OrderPanel;