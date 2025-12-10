import { useState, useEffect } from 'react';

const AdjustQuantityModal = ({ product, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    // Initialize quantity when modal opens
    setQuantity(product.availableQty ?? product.qty ?? 0);
  }, [product]);

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 0 ? prev - 1 : 0));
  const handleConfirm = () => onConfirm(product.id, quantity);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <div className="bg-pos-bg-secondary rounded-lg shadow-lg p-6 w-80 flex justify-center flex-col">
        <h3 className="text-lg font-bold text-pos-text-primary mb-4 flex justify-center">
          Adjust Quantity
        </h3>
        <div className="mb-4 flex justify-center items-center flex-col mt-3">
          <div className="font-medium text-pos-text-primary">{product.product_name}</div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleDecrement}
              className="px-3 py-1 bg-pos-bg-primary text-white hover:bg-pos-interactive-primary rounded-lg transition-colors"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-16 text-center text-black border border-pos-border-primary rounded"
            />
            <button
              onClick={handleIncrement}
              className="px-3 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded-lg transition-colors"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1 border border-pos-border-primary hover:bg-pos-interactive-primary text-white rounded transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustQuantityModal;
