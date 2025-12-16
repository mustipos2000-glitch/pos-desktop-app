import { useState, useEffect } from "react";
import ApiService from "../services/api";

const AddInventoryModal = ({ isOpen, onClose, onSubmit }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  // Fetch products for dropdown
 const fetchProducts = async () => {
  try {
    const res = await ApiService.getProducts();
    console.log("Products response:", res); // debug
    if (res.data && Array.isArray(res.data)) {
      setProducts(res.data);
    } else {
      setProducts([]);
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
    setProducts([]);
  }
};


  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setSelectedProduct("");
      setQuantity("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedProduct || !quantity) return;
    onSubmit({ product_id: selectedProduct, qty: Number(quantity) });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-96 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-pos-text-primary mb-4">
          Add Product to Inventory
        </h3>

        {/* Product Dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-pos-text-muted mb-1">
            Select Product <span className="text-pos-error">*</span>
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-4 py-2 w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary placeholder-pos-text-muted rounded-lg focus:outline-none focus:border-pos-info transition-colors"
          >
            <option value="">-- Select Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <label className="block text-sm text-pos-text-muted mb-1">
            Quantity <span className="text-pos-error">*</span>
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 w-full px-4 py-2 bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary placeholder-pos-text-muted rounded-lg focus:outline-none focus:border-pos-info transition-colors"
            placeholder="Enter quantity"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded hover:bg-pos-interactive-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedProduct || !quantity}
            className="px-4 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded hover:bg-pos-interactive-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInventoryModal;
