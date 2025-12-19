import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import PromotionFormModal from './PromotionFormModal';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const PromotionManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
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
    if (!promotionForm.name || !promotionForm.product_ids || promotionForm.product_ids.length === 0) {
      showError('Please fill in all required fields');
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
        fetchPromotions();
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

  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setShowPromotionModal(true);
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

  const openDeleteConfirmation = (promotion) => {
    setDeleteConfirmation({
      isOpen: true,
      promotionId: promotion.id,
      promotionName: promotion.name
    });
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
          Add Promotion
        </button>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search promotions..."
        />
      </div>

      {/* Main Content Area */}
      <div className="mt-4">
        <h3 className="text-base font-medium text-pos-text-primary mb-2">
          Promotions List
        </h3>
        {loading ? (
          <div className="text-pos-text-muted text-lg p-4 text-center">
            Loading promotions...
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="h-[500px] text-pos-text-muted text-lg border border-pos-border-secondary bg-pos-bg-secondary rounded-lg p-4 text-center">
            {searchQuery ? 'No promotions found matching your search.' : 'No promotions found. Click "Add Promotion" to create one.'}
          </div>
        ) : (
          <div className="h-[500px] border border-pos-border-secondary p-2 text-base overflow-y-auto scrollbar-custom rounded-lg bg-pos-bg-secondary">
            {filteredPromotions.map((promotion) => (
              <div
                key={promotion.id}
                className="flex justify-between items-center border border-pos-border-primary mt-1 mb-2 transition-all duration-200 rounded-lg px-3 py-2 hover:bg-black/5 hover:shadow-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="font-medium text-lg">{promotion.name}</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(promotion.is_active)}`}>
                      {promotion.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDiscountTypeBadge(promotion.discount_type)}`}>
                      {promotion.discount_type === 'percentage' ? `${promotion.discount_value}%` : `$${promotion.discount_value}`}
                    </span>
                  </div>
                  <div className="text-sm text-pos-text-muted flex gap-4">
                    <span>Products: <span className="font-medium">{promotion.product_names || 'N/A'}</span></span>
                  </div>
                  <div className="text-xs text-pos-text-muted mt-1 flex gap-4">
                    <span>Start: {formatDate(promotion.start_date)}</span>
                    <span>End: {formatDate(promotion.end_date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditPromotion(promotion)}
                    className="text-xs px-3 py-1.5 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirmation(promotion)}
                    className="text-xs px-3 py-1.5 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PromotionFormModal
        isOpen={showPromotionModal}
        onClose={closePromotionModal}
        onSubmit={handleSavePromotion}
        promotion={editingPromotion}
        products={products}
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
