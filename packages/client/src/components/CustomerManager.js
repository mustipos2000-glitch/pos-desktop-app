import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import CustomerFormModal from './CustomerFormModal';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    customerId: null,
    customerName: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { messageModal, showError, showSuccess, closeModal } = useMessageModal();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getCustomers();
      setCustomers(result.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showError('Failed to load customers. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCustomer = async (customerForm) => {
    if (!customerForm.name) {
      return;
    }

    try {
      if (editingCustomer) {
        await ApiService.updateCustomer(editingCustomer.id, customerForm);
      } else {
        await ApiService.createCustomer(customerForm);
      }
      fetchCustomers();
      closeCustomerModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      showError('Error saving customer. Please try again.');
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const closeCustomerModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await ApiService.deleteCustomer(id);
      fetchCustomers();
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting customer:', error);
      closeDeleteConfirmation();
      showError('Error deleting customer. Please try again.');
    }
  };

  const openDeleteConfirmation = (customer) => {
    setDeleteConfirmation({
      isOpen: true,
      customerId: customer.id,
      customerName: customer.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      customerId: null,
      customerName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.customerId) {
      handleDeleteCustomer(deleteConfirmation.customerId);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    !searchQuery ||
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

 

  return (
    <div className="overflow-y-auto scrollbar-custom mt-1">
      {/* Header with Action Buttons */}
      <div className="flex gap-2 bg-pos-bg-secondary rounded-lg py-2 px-1">
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          Add Customer
        </button>
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search customers..."
        />
      </div>

      {/* Main Content Area */}
      <div className="mt-4">
        {loading ? (
          <div className="text-pos-text-muted text-lg p-4 text-center">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="h-[500px] text-pos-text-muted text-sm border border-pos-border-secondary bg-pos-bg-secondary rounded-lg p-2 overflow-y-auto scrollbar-custom">
            No customers found.
          </div>
        ) : (
          <div className="h-[500px] border border-pos-border-secondary p-2 text-base overflow-y-auto scrollbar-custom rounded-lg bg-pos-bg-secondary">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex justify-between items-center border border-pos-border-primary mt-1 mb-2 cursor-pointer transition-all duration-200 rounded-lg px-2 py-2 hover:bg-black/5 hover:shadow-sm hover:scale-[1.02]"
              >
                <div className="flex-1">
                  <div className="font-medium text-pos-text-primary">{customer.name}</div>
                  <div className="text-sm text-pos-text-muted flex gap-4 mt-1">
                    {customer.phone && <span>📞 {customer.phone}</span>}
                    {customer.email && <span>📧 {customer.email}</span>}
                    {customer.address && <span>📍 {customer.address}</span>}
                    {customer.notes && <span className="text-xs text-pos-text-muted italic">📝 {customer.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirmation(customer)}
                    className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomerFormModal
        isOpen={showModal}
        onClose={closeCustomerModal}
        onSubmit={handleSaveCustomer}
        customer={editingCustomer}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteConfirmation.customerName}"? This action cannot be undone.`}
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

export default CustomerManager;
