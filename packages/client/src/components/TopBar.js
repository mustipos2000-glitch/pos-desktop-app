import { useState, useEffect } from 'react';
import UnifiedTableModal from './UnifiedTableModal';
import MessageModal from './MessageModal';
import ConfirmationModal from './ConfirmationModal';
import HoldOrdersModal from './HoldOrdersModal';
import ApiService from '../services/api';
import { printerService } from '../services/printerService';
import { useTheme } from '../context/ThemeContext';
import { useVersion } from '../context/VersionContext';
import { useMessageModal } from '../hooks/useMessageModal';

const TopBar = ({ selectedTable, onTableSelect, onSendToKitchen, cart, hasExistingOrder, searchQuery, onSearchChange, onRefreshKitchenCount, onLoadHoldOrder }) => {
  const { theme, toggleTheme } = useTheme();
  const { hasFeature } = useVersion();
  const [showTableModal, setShowTableModal] = useState(false);
  const [showHoldOrdersModal, setShowHoldOrdersModal] = useState(false);
  const [kitchenOrderCount, setKitchenOrderCount] = useState(0);
  const [holdOrderCount, setHoldOrderCount] = useState(0);
  const [printers, setPrinters] = useState([]);
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const handleTableClick = () => {
    setShowTableModal(true);
  };

  const handleTableSelect = (table) => {
    onTableSelect(table);
  };

  const processSendToKitchen = async () => {
    // onSendToKitchen now returns the order ID
    const orderId = await onSendToKitchen();
    
    // Try to print kitchen order to thermal printers assigned to products
    const printerNames = new Set();
    cart.forEach(item => {
      if (item.printer1) printerNames.add(item.printer1);
      if (item.printer2) printerNames.add(item.printer2);
      if (item.printer3) printerNames.add(item.printer3);
    });

    if (printerNames.size > 0 && printers.length > 0 && orderId) {
      try {        
        // Collect printer IDs
        const printerIds = [];
        printerNames.forEach(printerName => {
          const printer = printers.find(p => p.name === printerName);
          if (printer) {
            printerIds.push(printer.id);
          } else {
            console.warn(`⚠️ Printer "${printerName}" not found in printer list`);
          }
        });

        if (printerIds.length > 0) {          
          // Single batch request to all printers
          const result = await printerService.printKitchenOrderBatch(printerIds, orderId);
                    
          if (result.success) {
            if (result.failedCount > 0) {
              console.warn(`⚠️ ${result.failedCount} printer(s) failed:`, result.errors);
              showWarning(
                `✅ ${result.successCount} printer(s) succeeded\n❌ ${result.failedCount} printer(s) failed\n\n${result.errors.join('\n')}`,
                '⚠️ Partial Success'
              );
            }
          } else {
            console.error(`❌ All printers failed:`, result.errors);
            showError(
              `${result.errors.join('\n')}\n\nPlease check if printers are ON and connected.`,
              '❌ Failed to Print'
            );
          }
        }
      } catch (error) {
        console.error('❌ Error printing kitchen order:', error);
        showError(
          `Error: ${error.message || 'Unknown error'}\n\nPlease check if printers are ON and connected.`,
          '❌ Print Error'
        );
      }
    } else {
      console.log('ℹ️ No printers to send to or no order ID');
    }

    // Refresh kitchen order count and hold order count after sending to kitchen
    fetchKitchenOrderCount();
    fetchHoldOrderCount();
  };

  const handleSendToKitchen = async () => {    
    // Validate cart has items
    if (!cart || cart.length === 0) {
      return;
    }

    // Validate table is not in cleaning status (if table is selected)
    if (selectedTable && selectedTable.status === 'cleaning') {
      return;
    }

    // Check printers before sending to kitchen
    const printerNames = new Set();
    cart.forEach(item => {
      if (item.printer1) printerNames.add(item.printer1);
      if (item.printer2) printerNames.add(item.printer2);
      if (item.printer3) printerNames.add(item.printer3);
    });

    // Check assigned printers BEFORE sending to kitchen
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
        
        // Show confirmation modal instead of window.confirm
        setConfirmModal({
          isOpen: true,
          title: '⚠️ Printer Issues Detected',
          message: `${warningMessage}\n\nDo you want to continue anyway?`,
          onConfirm: processSendToKitchen
        });
        return;
      }
    }

    // If no printer issues, proceed directly
    await processSendToKitchen();
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

  // Fetch hold orders count
  const fetchHoldOrderCount = async () => {
    try {
      const response = await ApiService.getHoldOrders();
      setHoldOrderCount(response.data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch hold orders:', error);
    }
  };

  useEffect(() => {
    // Fetch only once on component mount
    fetchKitchenOrderCount();
    fetchHoldOrderCount();

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
          {hasFeature('tables') && (
            <button
              onClick={handleTableClick}
              className={`btn-primary px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 ${selectedTable
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-pos-interactive-primary hover:bg-pos-interactive-hover'
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
          )}
          {hasFeature('kitchenPrinter') && (
            <button className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white">
              <span className="text-lg">📋</span>
              Orders ({kitchenOrderCount})
            </button>
          )}
          <button
            onClick={() => setShowHoldOrdersModal(true)}
            className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white"
          >
            <span className="text-lg">⏸️</span>
            On Hold ({holdOrderCount})
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
          {hasFeature('kitchenPrinter') && (
            <button
              onClick={handleSendToKitchen}
              disabled={!cart || cart.length === 0}
              className="bg-pos-interactive-primary btn-primary text-pos-text-muted px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send To Kitchen
            </button>
          )}
        </div>
        <div className="flex gap-2.5 items-center">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-lg flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white rounded-lg"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <UnifiedTableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onSelectTable={handleTableSelect}
        mode="select"
        showNoTableOption={true}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Continue"
        cancelText="Cancel"
        type="warning"
      />

      <HoldOrdersModal
        isOpen={showHoldOrdersModal}
        onClose={() => {
          setShowHoldOrdersModal(false);
          fetchHoldOrderCount();
        }}
        onSelectOrder={onLoadHoldOrder}
      />
    </>
  );
};

export default TopBar;
