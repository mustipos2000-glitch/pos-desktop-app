import { useState, useEffect } from 'react';
import AdjustQuantityModal from './AdjustQuantityModal';
import AddProductModal from '../components/AddInventoryProduct'; // your existing modal
import ApiService from '../services/api';

const InventoryManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch inventory from API
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getInventory();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Adjust quantity handlers
  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };
  const closeAdjustModal = () => {
    setSelectedProduct(null);
    setShowAdjustModal(false);
  };
 const handleQuantityUpdate = async (productId, newQuantity) => {
  try {
    await ApiService.adjustInventory(productId, { qty: newQuantity }); // call API
    fetchInventory(); // refresh listing after update
    closeAdjustModal();
  } catch (err) {
    console.error('Failed to update quantity:', err);
  }
};


  // Add product handlers
  const openAddProductModal = () => setShowAddModal(true);
  const closeAddProductModal = () => setShowAddModal(false);

const handleAddProductConfirm = async ({ product_id, qty }) => {
  try {
    product_id = Number(product_id);
      // Add new product
      await ApiService.AddInventory({ product_id, qty });
      // Refresh list
      await fetchInventory();
    
    closeAddProductModal();
  } catch (err) {
    console.error("Failed to add/update product:", err);
  }
};

  if (loading) return <div>Loading inventory...</div>;
  return (
    <div className="overflow-y-auto scrollbar-custom mt-1 ">
      <div className="flex gap-2 bg-pos-bg-secondary rounded-lg py-2 px-1 mb-2 ">
         <button
           onClick={openAddProductModal}
          className="btn-primary"
        >
           Add Inventory
        </button>
      </div>
    

      <div className="h-[500px] border border-pos-border-secondary p-2 text-base overflow-y-auto scrollbar-custom rounded-lg bg-pos-bg-secondary transition-all duration-200 mt-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex justify-between items-center border border-pos-border-primary mt-1 mb-2 rounded-lg px-3 py-2 hover:bg-black/5 hover:shadow-sm transition-all duration-200"
          >
            <div className="w-1/2 font-medium text-pos-text-primary">{product.product_name}</div>
            <div className="w-1/4 text-pos-text-muted">
              {product.availableQty ?? product.qty}
            </div>
            <button
              onClick={() => openAdjustModal(product)}
              className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded-md transition-colors"
            >
              Adjust
            </button>
          </div>
        ))}
      </div>

      {/* Adjust Quantity Modal */}
      {showAdjustModal && selectedProduct && (
        <AdjustQuantityModal
          product={selectedProduct}
          onClose={closeAdjustModal}
          onConfirm={handleQuantityUpdate}
        />
      )}

      {/* Add Product Modal */}
     <AddProductModal
  isOpen={showAddModal} // <-- important
  onClose={closeAddProductModal}
  onSubmit={handleAddProductConfirm} // note: your modal uses onSubmit prop
/>
    </div>
  );
};

export default InventoryManager;
