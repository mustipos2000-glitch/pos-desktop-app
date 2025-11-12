import { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const PrTableManager = () => {
  const [tables, setTables] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({
    table_no: '',
    room_id: '',
    order_id: '',
    status: 'available',
    description: '',
    customer_name: '',
    waiter_name: '',
    table_size: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    tableId: null,
    tableName: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  const fetchTables = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getPrTables();
      setTables(result.data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      showError('Failed to load tables. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const result = await ApiService.getRooms();
      setRooms(result.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const result = await ApiService.getOrders();
      setOrders(result.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchRooms();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTable = async () => {
    if (!tableForm.table_no) {
      showWarning('Table number is required', 'Missing Information');
      return;
    }

    try {
      const payload = {
        ...tableForm,
        room_id: tableForm.room_id || null,
        order_id: tableForm.order_id || null
      };

      if (editingTable) {
        await ApiService.updatePrTable(editingTable.id, payload);
      } else {
        await ApiService.createPrTable(payload);
      }

      fetchTables();
      setShowAddTable(false);
      setEditingTable(null);
      setTableForm({ table_no: '', room_id: '', order_id: '', status: 'available', description: '', customer_name: '', waiter_name: '', table_size: '' });
    } catch (error) {
      console.error('Error saving table:', error);
      showError('Error saving table. Please try again.');
    }
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableForm({
      table_no: table.table_no || '',
      room_id: table.room_id || '',
      order_id: table.order_id || '',
      status: table.status || 'available',
      description: table.description || '',
      customer_name: table.customer_name || '',
      waiter_name: table.waiter_name || '',
      table_size: table.table_size || ''
    });
    setShowAddTable(true);
  };

  const handleDeleteTable = async (id) => {
    try {
      await ApiService.deletePrTable(id);
      fetchTables();
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting table:', error);
      closeDeleteConfirmation();
      showWarning('Failed to delete table', 'Cannot Delete Table');
    }
  };

  const openDeleteConfirmation = (table) => {
    setDeleteConfirmation({
      isOpen: true,
      tableId: table.id,
      tableName: table.table_no
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      tableId: null,
      tableName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.tableId) {
      handleDeleteTable(deleteConfirmation.tableId);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      available: 'bg-green-500/20 text-green-400',
      occupied: 'bg-red-500/20 text-red-400',
      reserved: 'bg-yellow-500/20 text-yellow-400',
      cleaning: 'bg-blue-500/20 text-blue-400'
    };
    return statusColors[status] || statusColors.available;
  };

  const filteredTables = tables.filter(table =>
    !searchQuery ||
    table.table_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (table.customer_name && table.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (table.waiter_name && table.waiter_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (table.room_name && table.room_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Tables</h2>
        <div className="flex gap-2 items-center">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search tables..."
          />
          <button className="add-btn" onClick={() => {
          setEditingTable(null);
            setTableForm({ table_no: '', room_id: '', order_id: '', status: 'available', description: '', customer_name: '', waiter_name: '', table_size: '' });
            setShowAddTable(true);
          }}>
            + Add Table
          </button>
        </div>
      </div>

      <div className="categories-table">
        {loading ? (
          <div className="loading-state">Loading tables...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Table No</th>
                <th>Room</th>
                <th>Customer</th>
                <th>Waiter</th>
                <th>Size</th>
                <th>Status</th>
                <th className='actions-cell'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    {searchQuery ? 'No tables match your search.' : 'No tables found. Click "Add Table" to create your first table.'}
                  </td>
                </tr>
              ) : (
                filteredTables.map((table) => (
                  <tr key={table.id}>
                    <td className="font-medium">{table.table_no}</td>
                    <td>{table.room_name || '-'}</td>
                    <td>{table.customer_name || '-'}</td>
                    <td>{table.waiter_name || '-'}</td>
                    <td>{table.table_size || '-'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(table.status)}`}>
                        {table.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <IconButton
                        icon="✏️"
                        className="edit"
                        onClick={() => handleEditTable(table)}
                        title="Edit table"
                      />
                      <IconButton
                        icon="🗑️"
                        className="delete"
                        onClick={() => openDeleteConfirmation(table)}
                        title="Delete table"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddTable && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowAddTable(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[500px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
              <button
                onClick={() => setShowAddTable(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Table Number <span className="text-pos-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={tableForm.table_no}
                    onChange={(e) => setTableForm({ ...tableForm, table_no: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Enter table number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Room
                  </label>
                  <select
                    value={tableForm.room_id}
                    onChange={(e) => setTableForm({ ...tableForm, room_id: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">


                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Order
                  </label>
                  <select
                    value={tableForm.order_id}
                    onChange={(e) => setTableForm({ ...tableForm, order_id: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select an order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        Order #{order.id} - ${order.gross_total || 0} ({order.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Status
                  </label>
                  <select
                    value={tableForm.status}
                    onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={tableForm.customer_name}
                    onChange={(e) => setTableForm({ ...tableForm, customer_name: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Waiter Name
                  </label>
                  <input
                    type="text"
                    value={tableForm.waiter_name}
                    onChange={(e) => setTableForm({ ...tableForm, waiter_name: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Enter waiter name"
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4 mb-4">

                     <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                      Table Size
                  </label>
                  <select
                    value={tableForm.table_size}
                    onChange={(e) => setTableForm({ ...tableForm, table_size: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Description
                  </label>
                  <textarea
                    value={tableForm.description}
                    onChange={(e) => setTableForm({ ...tableForm, description: e.target.value })}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Enter description (optional)"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddTable(false)}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTable}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                {editingTable ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Table"
        message={`Are you sure you want to delete table "${deleteConfirmation.tableName}"? This action cannot be undone.`}
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

export default PrTableManager;
