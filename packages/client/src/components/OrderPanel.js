import { useState, useRef } from 'react';
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
    <div className="w-1/4 min-w-[300px] bg-pos-bg-quaternary flex flex-col border-l border-pos-border-light h-screen">
      <div className="px-4 py-3 bg-pos-bg-secondary border-b border-pos-border-light">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 text-xs text-pos-text-disabled font-semibold uppercase">
          <span>Item</span>
          <span>Quantity</span>
          <span className="text-right">Total</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 flex flex-col bg-pos-bg-secondary min-h-[160px] scrollbar-custom">
        {cart.length === 0 ? (
          <div className="text-center text-pos-text-disabled py-10 px-5 text-sm">No items in cart</div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr] gap-2.5 items-center text-sm py-1.5">
              <div className="text-pos-text-secondary font-light">{item.name}</div>
              <div className="flex items-center gap-2 justify-center text-pos-text-secondary">
                <button
                  className="bg-pos-interactive-primary text-pos-text-secondary border-none w-7 h-4 cursor-pointer text-base transition-colors duration-200 flex items-center justify-center hover:bg-pos-interactive-hover"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="bg-pos-interactive-primary text-pos-text-secondary border-none w-7 h-4 cursor-pointer text-base transition-colors duration-200 flex items-center justify-center hover:bg-pos-interactive-hover"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <div className="text-right text-pos-text-secondary font-light">{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-t border-pos-border-light border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Gross Total</span>
        <span className="bg-pos-interactive-primary px-0.5 py-0.5 text-pos-text-secondary min-w-[100px] text-center">{calculateTotal().toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Tax 12%</span>
        <span className="bg-pos-interactive-primary px-0.5 py-0.5 text-pos-text-secondary min-w-[100px] text-center">{calculateTax().toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Discount</span>
        <input
          type='text'
          className="max-w-[6.5rem] text-center py-1.5 px-2 -my-0.5 -mx-0.5 text-black bg-white text-xs outline-none"
          placeholder="0"
          ref={discountInputRef}
          onChange={(e) => {
            const newDiscount = parseFloat(e.target.value) || 0;
            setDiscount(newDiscount);
          }}
        />
      </div>
      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Net Total</span>
        <span className="bg-pos-interactive-primary px-0.5 py-0.5 text-pos-text-secondary min-w-[100px] text-center">{(calculateTotal() + calculateTax() - discount).toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-4 gap-1 p-0.5">
        <button className="bg-gray-600 text-pos-text-secondary border-none p-0 cursor-pointer text-sm font-semibold transition-colors duration-200 hover:bg-gray-500" onClick={() => handleNumpadInput('C')}>C</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('7')}>7</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('8')}>8</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('9')}>9</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('.')}>.</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('4')}>4</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('5')}>5</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('6')}>6</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('0')}>0</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('1')}>1</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('2')}>2</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('3')}>3</button>
      </div>

      <div className="grid grid-cols-4 gap-2 p-1 bg-pos-bg-primary">
        <button className="bg-pos-interactive-primary text-pos-text-secondary border-none px-3 py-2 cursor-pointer text-lg font-medium transition-colors duration-200 flex items-center justify-center hover:bg-pos-interactive-hover" onClick={onClearCart} title="Clear Cart">
          🗑️
        </button>
        <button className="btn-primary text-sm font-medium flex items-center justify-center gap-1.5" title="Open Drawer">
          Drawer
        </button>
        <button className="btn-primary text-sm font-medium flex items-center justify-center gap-1.5" title="Card Payment">
          Card
        </button>
        <button
          className="btn-primary text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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