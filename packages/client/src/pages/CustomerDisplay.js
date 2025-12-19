import React, { useState, useEffect } from 'react';

const formatAmount = (value) => {
  const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return num.toFixed(2);
};

const CustomerDisplay = () => {
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrderNo, setCurrentOrderNo] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    // Listen for cart updates from main window
    if (window.electron && window.electron.customerDisplay) {
      const unsubscribe = window.electron.customerDisplay.onCartUpdate((data) => {
        if (data) {
          setCart(data.cart || []);
          setSelectedTable(data.selectedTable || null);
          setCurrentOrderNo(data.currentOrderNo || null);
          setSelectedCustomer(data.selectedCustomer || null);
          setDiscount(data.discount || 0);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const price = typeof item.price === 'number' && !Number.isNaN(item.price) ? item.price : 0;
      const quantity = typeof item.quantity === 'number' && !Number.isNaN(item.quantity) ? item.quantity : 0;
      let itemTotal = price * quantity;
      
      // Add sub-products to total
      if (item.subProducts && item.subProducts.length > 0) {
        item.subProducts.forEach(subItem => {
          const subPrice = typeof subItem.price === 'number' && !Number.isNaN(subItem.price) ? subItem.price : 0;
          const subQty = typeof subItem.quantity === 'number' && !Number.isNaN(subItem.quantity) ? subItem.quantity : 0;
          itemTotal += subPrice * subQty;
        });
      }
      
      return sum + itemTotal;
    }, 0);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-pos-bg-secondary">
      {/* Order Info Section */}
      <div className="px-4 py-3 bg-pos-bg-secondary border-b border-pos-border-light">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Table No */}
          <div className="flex flex-col">
            <div className="text-[10px] text-pos-text-muted uppercase mb-1 font-medium">Table</div>
            <div className="bg-pos-bg-tertiary border border-pos-border-secondary rounded px-3 py-2 text-center">
              <span className="text-sm text-pos-text-primary font-semibold">
                {selectedTable ? selectedTable.table_no : '--'}
              </span>
            </div>
          </div>
          
          {/* Order No */}
          <div className="flex flex-col">
            <div className="text-[10px] text-pos-text-muted uppercase mb-1 font-medium">Order</div>
            <div className="bg-pos-bg-tertiary border border-pos-border-secondary rounded px-3 py-2 text-center">
              <span className="text-sm text-pos-text-primary font-semibold">
                {currentOrderNo ? currentOrderNo : '--'}
              </span>
            </div>
          </div>

          {/* Customer */}
          <div className="flex flex-col">
            <div className="text-[10px] text-pos-text-muted uppercase mb-1 font-medium">Customer</div>
            <div className="bg-pos-bg-tertiary border border-pos-border-secondary rounded px-3 py-2 text-center">
              <span className="text-sm text-pos-text-primary font-semibold">
                {selectedCustomer ? selectedCustomer.name : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-2 bg-pos-bg-secondary border-b border-pos-border-light">
        <div className="grid grid-cols-12 gap-2 text-xs text-pos-text-muted font-semibold uppercase">
          <span className="col-span-5">Item</span>
          <span className="col-span-2 flex justify-center items-center">Qty</span>
          <span className="col-span-5 flex justify-end">Total</span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto flex flex-col scrollbar-custom">
        {cart.length === 0 ? (
          <div className="text-center text-pos-text-disabled py-20 px-5 text-lg">
            No items in cart
          </div>
        ) : (
          cart.map((item) => {
            const cartItemId = item.cartItemId || `${item.id}_${item.name}`;

            return (
              <div key={cartItemId} className="mb-2 px-4 py-2 border-b border-pos-border-light">
                <div className="grid grid-cols-12 gap-2 items-center text-sm">
                  <div className="col-span-5 font-medium text-pos-text-primary">
                    <div className="flex items-center gap-1">
                      <span>
                        {item.name || ''}
                      </span>
                      {item.notes && (
                        <span className="text-xs" title={item.notes}>
                          📝
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-center text-pos-text-primary">
                    <span className="font-semibold">{item.quantity}</span>
                  </div>

                  <div className="col-span-5 flex flex-col items-end gap-1">
                    {item.originalPrice && (
                      <span className="text-xs line-through text-pos-text-muted">
                        €{formatAmount(item.originalPrice * item.quantity)}
                      </span>
                    )}
                    {item.appliedDiscount && (
                      <span className="text-xs italic text-pos-text-muted">
                        {item.appliedDiscount}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-pos-text-primary">
                      €{formatAmount(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {item.subProducts && item.subProducts.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-pos-border-secondary">
                    {item.subProducts.map((subItem) => {
                      const isFree = !subItem.price || subItem.price === 0;

                      return (
                        <div
                          key={subItem.cartItemId}
                          className="grid grid-cols-12 gap-2 items-center text-xs py-1 text-pos-text-muted"
                        >
                          <div className="col-span-5 flex items-center">
                            <span className="font-light">+ {subItem.name}</span>
                          </div>

                          <div className="col-span-2 flex items-center justify-center">
                            <span>{subItem.quantity}</span>
                          </div>

                          <div className="col-span-5 flex items-center justify-end">
                            {!isFree && (
                              <span>
                                €{formatAmount(subItem.price * subItem.quantity)}
                              </span>
                            )}
                            {isFree && (
                              <span className="text-green-500">Free</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Total Section */}
      <div className="bg-pos-bg-secondary px-4 py-4 border-t-2 border-pos-border-primary">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-pos-text-primary uppercase">
            Total
          </div>
          <div className="text-2xl font-bold text-pos-text-secondary">
            €{formatAmount(calculateTotal() - discount)}
          </div>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-pos-text-muted">Discount:</span>
            <span className="text-red-500 font-semibold">-€{formatAmount(discount)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDisplay;
