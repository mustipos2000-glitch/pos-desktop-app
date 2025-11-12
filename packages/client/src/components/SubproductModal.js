import React, { useState, useEffect, useCallback } from 'react';

const SubproductModal = ({ isOpen, onClose, onAddToCart, productId, searchQuery }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [subProducts, setSubProducts] = useState([]);
  const [allSubProducts, setAllSubProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProductSubproducts = useCallback(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      // Fetch subproducts assigned to this product
      const response = await fetch(`http://localhost:5000/api/products/${productId}/sub-products`);
      const result = await response.json();
      const subProductsData = result.data || [];
      setAllSubProducts(subProductsData);
      
      // Extract unique groups from subproducts
      const uniqueGroups = [];
      const groupMap = new Map();
      
      subProductsData.forEach(sp => {
        if (sp.group_id && sp.group_name && !groupMap.has(sp.group_id)) {
          groupMap.set(sp.group_id, {
            id: sp.group_id,
            name: sp.group_name
          });
          uniqueGroups.push({
            id: sp.group_id,
            name: sp.group_name
          });
        }
      });
      
      setGroups(uniqueGroups);
      
      // Auto-select first group
      if (uniqueGroups.length > 0) {
        setSelectedGroup(uniqueGroups[0]);
      } else {
        // If no groups, show all subproducts
        setSubProducts(subProductsData);
      }
    } catch (error) {
      console.error('Error fetching product subproducts:', error);
      setAllSubProducts([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const filterSubProductsByGroup = useCallback((groupId) => {
    let filtered = allSubProducts.filter(sp => sp.group_id === groupId);
    
    // Apply search filter if search query exists
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(sp => 
        sp.name.toLowerCase().includes(query)
      );
    }
    
    setSubProducts(filtered);
  }, [allSubProducts, searchQuery]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductSubproducts();
    }
  }, [isOpen, productId, fetchProductSubproducts]);

  useEffect(() => {
    if (selectedGroup && allSubProducts.length > 0) {
      filterSubProductsByGroup(selectedGroup.id);
    }
  }, [selectedGroup, allSubProducts, filterSubProductsByGroup]);

  const handleSubProductClick = (subProduct) => {
    onAddToCart({
      id: subProduct.id,
      name: subProduct.name,
      price: subProduct.price,
      category: subProduct.group_name || 'Subproduct',
      image: subProduct.image || '📦',
      color: subProduct.color || '#3b82f6',
    });
  };

  const isImageUrl = (image) => {
    return image && (image.startsWith('http') || image.startsWith('/uploads/'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-pos-bg-secondary w-4/5 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-pos-border-secondary">
          <h2 className="text-xl font-semibold text-pos-text-primary">Select subproduct</h2>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Groups sidebar */}
          <div className="w-32 border-r border-pos-border-secondary p-1 overflow-y-auto scrollbar-custom">
            {loading && groups.length === 0 ? (
              <div className="text-pos-text-muted text-sm text-center py-4">Loading...</div>
            ) : groups.length === 0 ? (
              <div className="text-pos-text-muted text-sm text-center py-4">No groups found</div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={`px-2 py-2 mb-1 cursor-pointer transition-colors text-sm ${
                    selectedGroup?.id === group.id
                      ? 'bg-pos-bg-primary text-white'
                      : 'bg-pos-bg-primary/50 hover:bg-pos-bg-primary/70 text-pos-text-primary'
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  {group.name}
                </div>
              ))
            )}
          </div>

          {/* Subproducts grid */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-custom">
            {loading ? (
              <div className="flex items-center justify-center h-full text-pos-text-muted">
                Loading sub-products...
              </div>
            ) : !selectedGroup ? (
              <div className="flex items-center justify-center h-full text-pos-text-muted">
                Select a group to view sub-products
              </div>
            ) : subProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-pos-text-muted">
                No sub-products in this group
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                {subProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className="flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-200 relative overflow-hidden hover:scale-105"
                    onClick={() => handleSubProductClick(subProduct)}
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: subProduct.color || '#3b82f6',
                    }}
                  >
                    {/* Price */}
                    <div className="absolute right-0 rounded-md text-xs font-semibold text-gray-200 bg-[rgba(0,0,0,0.6)] px-1.5 py-[1px]">
                      {subProduct.price ? `€${parseFloat(subProduct.price).toFixed(2)}` : '0.00'}
                    </div>

                    {/* Image */}
                    <div className="w-full h-20 flex mt-2 p-1 items-center justify-center overflow-hidden">
                      {isImageUrl(subProduct.image) ? (
                        <img
                          src={`http://localhost:5000${subProduct.image}`}
                          alt={subProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{subProduct.image || '📦'}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="w-full px-2 py-2">
                      <div className="text-sm font-semibold text-white leading-tight break-words text-center">
                        {subProduct.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-pos-border-secondary">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-pos-bg-primary hover:bg-pos-interactive-primary text-white rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubproductModal;
