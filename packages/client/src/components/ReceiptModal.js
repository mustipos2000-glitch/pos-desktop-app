import React from 'react';

const ReceiptModal = ({ cart, total, subTotal, tax, discount, onClose, onPrint }) => {
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
              {validCart.map((item) => {
                const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                const itemQty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                return (
                  <div key={item.id} className="mb-2">
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
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;