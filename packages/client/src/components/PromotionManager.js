import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import PromotionFormModal from './PromotionFormModal';
import PromotionProductsModal from './PromotionProductsModal';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const PromotionManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    promotionId: null,
    promotionName: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { messageModal, showError, showSuccess, closeModal } = useMessageModal();

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getPromotions();
      setPromotions(result.data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      showError('Failed to load promotions. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const result = await ApiService.getProducts();
      setProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSavePromotion = async (promotionForm) => {
    // Validate required fields
    if (!promotionForm.name) {
      showError('Please enter a promotion name');
      return;
    }
    
    // Only check for products if it's a specific products promotion
    if (promotionForm.apply_to === 'specific_products' && (!promotionForm.product_ids || promotionForm.product_ids.length === 0)) {
      showError('Please select at least one product for specific products promotion');
      return;
    }

    try {
      const url = editingPromotion
        ? `http://localhost:5000/api/promotions/${editingPromotion.id}`
        : 'http://localhost:5000/api/promotions';

      const response = await fetch(url, {
        method: editingPromotion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionForm)
      });

      if (response.ok) {
        await fetchPromotions();
        
        // If we were editing, refresh the selected promotion with updated data
        if (editingPromotion && selectedPromotion?.id === editingPromotion.id) {
          try {
            const updatedPromotion = await ApiService.getPromotionById(editingPromotion.id);
            setSelectedPromotion(updatedPromotion.data);
          } catch (error) {
            console.error('Error refreshing selected promotion:', error);
          }
        }
        
        closePromotionModal();
        showSuccess(`Promotion ${editingPromotion ? 'updated' : 'created'} successfully`);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save promotion');
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      showError('Error saving promotion. Please try again.');
    }
  };

  const handleEditPromotion = () => {
    if (selectedPromotion) {
      setEditingPromotion(selectedPromotion);
      setShowPromotionModal(true);
    }
  };

  const handleShowProducts = () => {
    if (selectedPromotion) {
      setShowProductsModal(true);
    }
  };

  const closePromotionModal = () => {
    setShowPromotionModal(false);
    setEditingPromotion(null);
  };

  const handleDeletePromotion = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/promotions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPromotions();
        closeDeleteConfirmation();
        if (selectedPromotion?.id === id) {
          setSelectedPromotion(null);
        }
        showSuccess('Promotion deleted successfully');
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showError(error.error || 'Failed to delete promotion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      closeDeleteConfirmation();
      showError('Error deleting promotion. Please try again.');
    }
  };

  const openDeleteConfirmation = () => {
    if (selectedPromotion) {
      setDeleteConfirmation({
        isOpen: true,
        promotionId: selectedPromotion.id,
        promotionName: selectedPromotion.name
      });
    }
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      promotionId: null,
      promotionName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.promotionId) {
      handleDeletePromotion(deleteConfirmation.promotionId);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? 'bg-green-500/20 text-green-400'
      : 'bg-gray-500/20 text-gray-400';
  };

  const getDiscountTypeBadge = (type) => {
    const colors = {
      percentage: 'bg-blue-500/20 text-blue-400',
      fixed: 'bg-purple-500/20 text-purple-400'
    };
    return colors[type] || colors.percentage;
  };

  const filteredPromotions = promotions.filter(promo =>
    !searchQuery ||
    promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (promo.product_names && promo.product_names.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="overflow-y-auto scrollbar-custom mt-1">
      {/* Header with Action Buttons */}
      <div className="flex gap-2 bg-pos-bg-secondary rounded-lg py-2 px-1">
        <button
          onClick={() => {
            setEditingPromotion(null);
            setShowPromotionModal(true);
          }}
          className="btn-primary"
        >
          Add
        </button>
        <button
          onClick={handleEditPromotion}
          disabled={!selectedPromotion}
          className={`btn-primary ${!selectedPromotion
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
        >
          Edit
        </button>
        <button
          onClick={openDeleteConfirmation}
          disabled={!selectedPromotion}
          className={`btn-primary ${!selectedPromotion
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
        >
          Delete
        </button>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search promotions..."
        />
      </div>

      {/* Main Content Area */}
      <div className="flex gap-2 mt-4">
        {/* Left Sidebar - Promotions List */}
        <div className="flex-1 max-w-[11rem]">
          <h3 className="text-base font-medium text-pos-text-primary mb-2">
            Promotions
          </h3>
          {loading ? (
            <div className="text-pos-text-muted text-lg p-4 text-center">
              Loading...
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="h-[500px] text-pos-text-muted text-sm border border-pos-border-secondary bg-pos-bg-secondary rounded-lg p-2 overflow-y-auto scrollbar-custom">
              No promotions found.
            </div>
          ) : (
            <div className="h-[500px] min-w-[160px] max-w-[200px] border border-pos-border-secondary p-2 overflow-y-auto scrollbar-custom bg-pos-bg-secondary rounded-lg">
              {filteredPromotions.map(promo => (
                <div
                  key={promo.id}
                  onClick={() => setSelectedPromotion(promo)}
                  className={`flex text-lg mt-1 mb-2 shadow-md cursor-pointer transition-all duration-200 rounded-lg border border-pos-border-primary px-1 py-1 ${selectedPromotion?.id === promo.id
                    ? 'bg-pos-bg-primary shadow-md'
                    : 'hover:bg-black/5 hover:shadow-sm hover:scale-[1.02]'
                    }`}
                >
                  <div className="px-1 py-1 flex-1">
                    {promo.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Content - Promotion Details */}
        <div className="flex-[3] min-w-[300px]">
          <h3 className="text-base font-medium text-pos-text-primary mb-2">
            Details
          </h3>
          {!selectedPromotion ? (
            <div className="h-[500px] text-pos-text-muted text-lg border border-pos-border-secondary bg-pos-bg-secondary p-2 rounded-lg text-pos-error">
              Select a promotion to view details
            </div>
          ) : (
            <div className="h-[500px] border border-pos-border-secondary p-2 text-base overflow-y-auto scrollbar-custom rounded-lg bg-pos-bg-secondary">
              {/* Details Table */}
              <div className="flex gap-2 flex-wrap">
                {/* Start Date */}
                <div className="flex-1 min-w-[180px]  px-2 py-2">
                  <div className="font-medium text-pos-text-muted mb-1">Start Date</div>
                  <div className="text-pos-text-primary text-sm">{formatDate(selectedPromotion.start_date)}</div>
                </div>

                {/* End Date */}
                <div className="flex-1 min-w-[180px]  px-2 py-2">
                  <div className="font-medium text-pos-text-muted mb-1">End Date</div>
                  <div className="text-pos-text-primary text-sm">{formatDate(selectedPromotion.end_date)}</div>
                </div>

                {/* Discount */}
                <div className="flex-1 min-w-[120px]  px-2 py-2">
                  <div className="font-medium text-pos-text-muted mb-1">Discount</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDiscountTypeBadge(selectedPromotion.discount_type)}`}>
                      {selectedPromotion.discount_type === 'percentage' 
                        ? `${selectedPromotion.discount_value}%` 
                        : `$${selectedPromotion.discount_value}`}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex-1 min-w-[100px]  px-2 py-2">
                  <div className="font-medium text-pos-text-muted mb-1">Status</div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedPromotion.is_active)}`}>
                    {selectedPromotion.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Products - Clickable */}
                <div className="flex-1 min-w-[150px]  px-2 py-2">
                  <div className="font-medium text-pos-text-muted mb-1">Products</div>
                  <button
                    onClick={handleShowProducts}
                    className="text-blue-400 hover:text-blue-300 underline transition-colors text-sm"
                  >
                    {selectedPromotion.product_names || 'N/A'} ({selectedPromotion.products?.length || 0})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PromotionFormModal
        isOpen={showPromotionModal}
        onClose={closePromotionModal}
        onSubmit={handleSavePromotion}
        promotion={editingPromotion}
        products={products}
      />

      <PromotionProductsModal
        isOpen={showProductsModal}
        onClose={() => setShowProductsModal(false)}
        promotion={selectedPromotion}
        products={selectedPromotion?.products || []}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Promotion"
        message={`Are you sure you want to delete "${deleteConfirmation.promotionName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default PromotionManager;
