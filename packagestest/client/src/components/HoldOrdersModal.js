import { useState, useEffect } from 'react';
import ApiService from '../services/api';

const HoldOrdersModal = ({ isOpen, onClose, onSelectOrder, selectedEmployeeId }) => {
  const [holdOrders, setHoldOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchHoldOrders();
    }
  }, [isOpen, selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      const response = await ApiService.request('/users');
      const employeeMap = {};
      (response.data || []).forEach(emp => {
        employeeMap[emp.id] = emp;
      });
      setEmployees(employeeMap);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchHoldOrders = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getHoldOrders(selectedEmployeeId);
      setHoldOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching hold orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order) => {
    onSelectOrder(order);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (value) => {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return num.toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col mr-[115px]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-pos-border-primary">
          <h2 className="text-xl font-semibold text-pos-text-primary">
            On Hold Orders ({holdOrders.length})
          </h2>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-pos-text-muted py-10">
              Loading hold orders...
            </div>
          ) : holdOrders.length === 0 ? (
            <div className="text-center text-pos-text-muted py-10">
              No orders on hold
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {holdOrders.map((order) => {
                const employee = order.employee_id ? employees[order.employee_id] : null;
                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className="bg-pos-bg-secondary border border-pos-border-secondary rounded-lg p-4 cursor-pointer hover:bg-pos-bg-tertiary transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-lg font-semibold text-pos-text-primary">
                          {order.order_no || `Order #${order.id}`}
                        </div>
                        <div className="text-xs text-pos-text-muted">
                          {formatDate(order.created_at)}
                        </div>
                        {employee && (
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: employee.avatar_color }}
                            >
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-xs text-pos-text-muted">{employee.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">
                          €{formatAmount(order.total)}
                        </div>
                        <div className="text-xs text-pos-text-muted">
                          {order.details?.length || 0} items
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pos-border-primary flex justify-end">
          <button
            onClick={onClose}
            className="bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary px-4 py-2 rounded hover:bg-pos-interactive-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoldOrdersModal;
