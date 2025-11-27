import { useState, useEffect } from 'react';
import UnifiedTableModal from './UnifiedTableModal';
import ApiService from '../services/api';
import { printerService } from '../services/printerService';

const TopBar = ({ selectedTable, onTableSelect, onSendToKitchen, cart, hasExistingOrder, searchQuery, onSearchChange, onRefreshKitchenCount }) => {
  const [showTableModal, setShowTableModal] = useState(false);
  const [kitchenOrderCount, setKitchenOrderCount] = useState(0);
  const [printers, setPrinters] = useState([]);

  const handleTableClick = () => {
    setShowTableModal(true);
  };

  const handleTableSelect = (table) => {
    onTableSelect(table);
  };

  const handleSendToKitchen = async () => {
    // Validate and call parent handler
    if (!selectedTable || !cart || cart.length === 0) {
      return;
    }

    // Validate table is not in cleaning status
    if (selectedTable.status === 'cleaning') {
      return;
    }

    // Debug: Check cart items for printer fields
    console.log('🔍 Checking cart items for printers:', cart.map(item => ({
      name: item.name,
      printer1: item.printer1,
      printer2: item.printer2,
      printer3: item.printer3
    })));

    // Collect all unique printer names from cart items
    const printerNames = new Set();
    cart.forEach(item => {
      if (item.printer1) printerNames.add(item.printer1);
      if (item.printer2) printerNames.add(item.printer2);
      if (item.printer3) printerNames.add(item.printer3);
    });

    console.log('🖨️ Found printers:', Array.from(printerNames));

    // Check assigned printers BEFORE sending to kitchen (same as test printer)
    if (printerNames.size > 0) {
      const printerCheckResults = [];
      
      for (const printerName of printerNames) {
        // Find printer by name
        const printer = printers.find(p => p.name === printerName);
        
        if (!printer) {
          printerCheckResults.push({
            name: printerName,
            status: 'not_found',
            message: `❌ Printer "${printerName}" not found in system`
          });
        } else if (!printer.connection_string || !printer.connection_string.trim()) {
          printerCheckResults.push({
            name: printerName,
            status: 'no_connection',
            message: `❌ Printer "${printerName}" has no connection string configured`
          });
        } else {
          printerCheckResults.push({
            name: printerName,
            status: 'ready',
            message: `✅ Printer "${printerName}" is ready`,
            printer: printer
          });
        }
      }

      // Show warnings for problematic printers
      const problemPrinters = printerCheckResults.filter(r => r.status !== 'ready');
      if (problemPrinters.length > 0) {
        const warningMessage = problemPrinters.map(p => p.message).join('\n');
        const proceed = window.confirm(
          `⚠️ Printer Issues Detected:\n\n${warningMessage}\n\nDo you want to continue anyway?`
        );
        
        if (!proceed) {
          return;
        }
      }
    }

    await onSendToKitchen();
    
    // Try to print kitchen order to thermal printers assigned to products
    if (printerNames.size > 0 && printers.length > 0) {
      try {
        // Get the current order ID from the API
        const orderResponse = await ApiService.getOrderByTableId(selectedTable.id);
        if (orderResponse.data && orderResponse.data.id) {
          const orderId = orderResponse.data.id;
          
          console.log(`📋 Order ID: ${orderId}, sending to printers...`);
          
          // Print to each assigned printer (even if inactive - let backend handle validation)
          const printPromises = [];
          printerNames.forEach(printerName => {
            // Find printer by name (don't check is_active here, backend will validate)
            const printer = printers.find(p => p.name === printerName);
            if (printer) {
              console.log(`📤 Calling API: POST /api/printers/print-kitchen with printerId=${printer.id}, orderId=${orderId}`);
              printPromises.push(
                printerService.printKitchenOrder(printer.id, orderId)
                  .then(response => {
                    console.log(`✅ Success: ${printer.name}`, response);
                    return response;
                  })
                  .catch(err => {
                    console.error(`❌ Failed: ${printer.name}`, err);
                    // Show user-friendly error
                    alert(`❌ Failed to print to ${printer.name}\n\nError: ${err.message || 'Connection failed'}\n\nPlease check if the printer is ON and connected.`);
                    throw err;
                  })
              );
            } else {
              console.warn(`⚠️ Printer "${printerName}" not found in printer list`);
            }
          });

          // Wait for all print jobs to complete (or fail)
          const results = await Promise.allSettled(printPromises);
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const failedCount = results.filter(r => r.status === 'rejected').length;
          
          console.log(`📊 Print Results: ${successCount} succeeded, ${failedCount} failed`);
          
          if (successCount > 0) {
            console.log(`✅ Kitchen order sent to ${successCount} printer(s) successfully`);
          }
        } else {
          console.error('❌ No order ID found after sending to kitchen');
        }
      } catch (error) {
        console.error('❌ Error printing kitchen order:', error);
        // Don't block the operation if printing fails
      }
    } else {
      console.log('ℹ️ No printers to send to (printerNames.size=0 or printers.length=0)');
    }
    
    // Refresh kitchen order count after sending to kitchen
    fetchKitchenOrderCount();
  };

  // Fetch kitchen orders count
  const fetchKitchenOrderCount = async () => {
    try {
      const response = await ApiService.getOrders();
      const kitchenOrders = response.data.filter(order => order.status === 'send_kitchen');
      setKitchenOrderCount(kitchenOrders.length);
    } catch (error) {
      console.error('Failed to fetch kitchen orders:', error);
    }
  };

  useEffect(() => {
    // Fetch only once on component mount
    fetchKitchenOrderCount();
    
    // Fetch printers
    const fetchPrinters = async () => {
      try {
        const response = await printerService.getAllPrinters();
        setPrinters(response.data || []);
      } catch (error) {
        console.error('Error fetching printers:', error);
      }
    };
    fetchPrinters();
  }, []);

  // Expose fetchKitchenOrderCount to parent via callback
  useEffect(() => {
    if (onRefreshKitchenCount) {
      onRefreshKitchenCount(fetchKitchenOrderCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="mt-2 mb-2 ml-2 flex justify-between items-center bg-pos-bg-secondary px-5 py-2.5 border-b border-pos-border-primary rounded-lg mr-1">
        <div className="flex gap-2.5">
          <button
            onClick={handleTableClick}
            className={`btn-primary px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 ${selectedTable
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
            Orders ({kitchenOrderCount})
          </button>
        </div>
        <div className="flex gap-2.5 items-center">
          {/* Search Bar */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-pos-text-muted text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors w-64"
              />
            </div>
          </div>
          <button
            onClick={handleSendToKitchen}
            disabled={!selectedTable || !cart || cart.length === 0}
            className="bg-pos-interactive-primary btn-primary text-pos-text-muted px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send To Kitchen
          </button>
        </div>
        <div className="flex gap-2.5 items-center">
          {/* User info and other buttons can be added here */}
        </div>
      </div>

      <UnifiedTableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onSelectTable={handleTableSelect}
        mode="select"
        showNoTableOption={true}
      />
    </>
  );
};

export default TopBar;
