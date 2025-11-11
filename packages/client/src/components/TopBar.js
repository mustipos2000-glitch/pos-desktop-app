import { useState } from 'react';
import TableSelectionModal from './TableSelectionModal';

const TopBar = ({ selectedTable, onTableSelect, onSendToKitchen, cart, hasExistingOrder }) => {
  const [showTableModal, setShowTableModal] = useState(false);

  const handleTableClick = () => {
    setShowTableModal(true);
  };

  const handleTableSelect = (table) => {
    onTableSelect(table);
  };

  const handleSendToKitchen = () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }
    if (!cart || cart.length === 0) {
      alert('Cart is empty. Add items before sending to kitchen.');
      return;
    }
    onSendToKitchen();
  };

  return (
    <>
      <div className="flex justify-between items-center bg-pos-bg-secondary px-5 py-2.5 border-b border-pos-border-primary">
        <div className="flex gap-2.5">
          <button 
            onClick={handleTableClick}
            className={`border-none px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 ${
              selectedTable 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-pos-interactive-primary text-white hover:bg-pos-interactive-hover'
            }`}
          >
            <span className="text-lg">🪑</span>
            {selectedTable ? (
              <span>
                Table: {selectedTable.table_no}
                {hasExistingOrder && <span className="ml-1 text-xs"></span>}
              </span>
            ) : 'Select Table'}
          </button>
          <button className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white">
            <span className="text-lg">📋</span>
            Orders (0)
          </button>
        </div>
        <div className="flex gap-2.5">
          <button className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white">
            On Hold
          </button>
          <button 
            onClick={handleSendToKitchen}
            disabled={!selectedTable || !cart || cart.length === 0}
            className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send To Kitchen
          </button>
        </div>
        <div className="flex gap-2.5 items-center">
          {/* User info and other buttons can be added here */}
        </div>
      </div>

      <TableSelectionModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onSelectTable={handleTableSelect}
      />
    </>
  );
};

export default TopBar;
