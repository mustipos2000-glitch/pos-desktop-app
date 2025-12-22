const PromotionProductsModal = ({ isOpen, onClose, promotion, products }) => {
  if (!isOpen) return null;

  const calculateDiscountedPrice = (price, discountType, discountValue) => {
    if (discountType === 'percentage') {
      return price - (price * discountValue / 100);
    } else {
      return price - discountValue;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-pos-bg-tertiary rounded-lg max-h-[80vh] overflow-y-auto w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-3 flex items-center justify-between sticky top-0">
          <h3 className="text-xl font-semibold text-pos-text-primary">
           "{promotion?.name}"
          </h3>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          {products && products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product) => {
                const discountedPrice = calculateDiscountedPrice(
                  product.price,
                  promotion.discount_type,
                  promotion.discount_value
                );

                return (
                  <div
                    key={product.id}
                    className="bg-pos-bg-primary border border-pos-border-secondary rounded-lg p-2"
                  >
                    <div className="font-medium text-lg text-pos-text-primary mb-1">
                      {product.name}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <div className="text-pos-text-muted">Original Price:</div>
                        <div className="text-pos-text-primary font-medium line-through">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-pos-text-muted">Discounted Price:</div>
                        <div className="text-green-400 font-bold text-lg">
                          ${discountedPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-pos-text-muted text-center">
                      Save: ${(product.price - discountedPrice).toFixed(2)} (
                      {promotion.discount_type === 'percentage'
                        ? `${promotion.discount_value}%`
                        : `$${promotion.discount_value}`}
                      )
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-pos-text-muted py-8">
              No products found
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-3 flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium rounded-xl hover:bg-pos-interactive-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionProductsModal;
