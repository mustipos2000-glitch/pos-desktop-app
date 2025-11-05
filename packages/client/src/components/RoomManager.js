import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const RoomManager = () => {
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [currentTable, setCurrentTable] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    total_table: 0
  });
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    roomId: null,
    roomName: ''
  });
  const [deleteTableConfirmation, setDeleteTableConfirmation] = useState({
    isOpen: false,
    tableId: null,
    tableName: ''
  });
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getRooms();
      setRooms(result.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showError('Failed to load rooms. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const result = await ApiService.getPrTables();
      setTables(result.data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRoom = async () => {
    if (!roomForm.name) {
      return;
    }

    try {
      const url = editingRoom
        ? `http://localhost:5000/api/rooms/${editingRoom.id}`
        : 'http://localhost:5000/api/rooms';

      const response = await fetch(url, {
        method: editingRoom ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomForm)
      });

      if (response.ok) {
        fetchRooms();
        setShowAddRoom(false);
        setEditingRoom(null);
        setRoomForm({ name: '', total_table: 0 });
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      showError('Error saving room. Please try again.');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name || '',
      total_table: Number(room.total_table) || 0
    });
    setShowAddRoom(true);
  };

  const handleDeleteRoom = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${id}`, {
        method: 'DELETE'
      }); 
      
      if (response.ok) {
        fetchRooms();
        closeDeleteConfirmation();
        if (selectedRoom?.id === id) {
          setSelectedRoom(null);
        }
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showWarning(error.error || 'Failed to delete room', 'Cannot Delete Room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      closeDeleteConfirmation();
      showError('Error deleting room. Please try again.');
    }
  };

  const openDeleteConfirmation = (room) => {
    setDeleteConfirmation({
      isOpen: true,
      roomId: room.id,
      roomName: room.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      roomId: null,
      roomName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.roomId) {
      handleDeleteRoom(deleteConfirmation.roomId);
    }
  };

  const resetTableForm = () => {
    setTableForm({
      table_no: '',
      room_id: '',
      order_id: '',
      status: 'available',
      description: '',
      customer_name: '',
      waiter_name: '',
      table_size: ''
    });
    setFieldErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTableForm({
      ...tableForm,
      [name]: value
    });

    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  const handleAddTable = async () => {
    const errors = {};
    if (!tableForm.table_no) {
      errors.table_no = 'Table number is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      const payload = {
        ...tableForm,
        room_id: tableForm.room_id || null,
        order_id: tableForm.order_id || null
      };

      const response = await fetch('http://localhost:5000/api/pr-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchTables();
        resetTableForm();
        setShowAddTable(false);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to create table');
      }
    } catch (error) {
      console.error('Error creating table:', error);
      showError('Failed to create table. Please try again.');
    }
  };

  const handleEditTable = (table) => {
    setCurrentTable(table);
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
    setShowEditTable(true);
  };

  const handleUpdateTable = async () => {
    const errors = {};
    if (!tableForm.table_no) {
      errors.table_no = 'Table number is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      const payload = {
        ...tableForm,
        room_id: tableForm.room_id || null,
        order_id: tableForm.order_id || null
      };

      const response = await fetch(`http://localhost:5000/api/pr-tables/${currentTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchTables();
        resetTableForm();
        setShowEditTable(false);
        setCurrentTable(null);
        
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to update table');
      }
    } catch (error) {
      console.error('Error updating table:', error);
      showError('Failed to update table. Please try again.');
    }
  };

  const handleDeleteTable = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/pr-tables/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTables();
        closeDeleteTableConfirmation();
      } else {
        const errorResult = await response.json();
        closeDeleteTableConfirmation();
        showWarning(errorResult.error || 'Failed to delete table', 'Cannot Delete Table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      closeDeleteTableConfirmation();
      showError('Failed to delete table. Please try again.');
    }
  };

  const openDeleteTableConfirmation = (table) => {
    setDeleteTableConfirmation({
      isOpen: true,
      tableId: table.id,
      tableName: table.table_no
    });
  };

  const closeDeleteTableConfirmation = () => {
    setDeleteTableConfirmation({
      isOpen: false,
      tableId: null,
      tableName: ''
    });
  };

  const confirmDeleteTable = () => {
    if (deleteTableConfirmation.tableId) {
      handleDeleteTable(deleteTableConfirmation.tableId);
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

  const filteredTables = selectedRoom
    ? tables.filter(t => t.room_id === selectedRoom.id)
    : [];

  return (
    <div className="admin-section h-screen flex flex-col">
      {/* Header */}
      <div className="text-center bg-pos-bg-secondary border-pos-border-primary">
        <h2 className="m-0 text-pos-text-primary text-2xl font-medium">Rooms & Tables</h2>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1 flex gap-1 border-pos-border-primary">
        <button
          onClick={() => {
            setEditingRoom(null);
            setRoomForm({ name: '', total_table: 0 });
            setShowAddRoom(true);
          }}
          className="btn-primary font-semibold"
        >
          Add Room
        </button>
        <button
          onClick={() => {
            if (selectedRoom) {
              handleEditRoom(selectedRoom);
            }
          }}
          disabled={!selectedRoom}
          className="btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit Room
        </button>
        <button
          onClick={() => {
            if (selectedRoom) {
              openDeleteConfirmation(selectedRoom);
            }
          }}
          disabled={!selectedRoom}
          className="btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete Room
        </button>
        <button
          onClick={() => {
            if (selectedRoom) {
              resetTableForm();
              setTableForm({ ...tableForm, room_id: selectedRoom.id });
              setShowAddTable(true);
            }
          }}
          disabled={!selectedRoom}
          className="btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Table
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Rooms */}
        <div className="w-[156px] bg-pos-bg-secondary border-r-2 border-pos-border-primary overflow-y-auto scrollbar-custom px-2">
          {loading ? (
            <div className="p-5 text-pos-text-primary text-center">
              Loading...
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`bg-pos-bg-primary py-2 px-2 mb-1 text-pos-text-primary cursor-pointer text-sm ${selectedRoom?.id === room.id
                  ? 'bg-pos-bg-tertiary'
                  : 'hover:bg-pos-interactive-primary'
                  }`}
              >
                {room.name}
              </div>
            ))
          )}
        </div>

        {/* Right Content - Tables */}
        <div className="flex-1 bg-pos-bg-primary overflow-y-auto scrollbar-custom">
          {!selectedRoom ? (
            <div className="text-pos-text-primary text-center mt-12 text-base">
              Select a room to view tables
            </div>
          ) : (
            <div>
              <table className="w-full border-collapse bg-pos-bg-secondary overflow-hidden">
                <thead>
                  <tr className="bg-pos-bg-tertiary">
                    <th className="p-1 text-left text-pos-text-primary border-b-2 border-pos-border-primary text-sm font-medium">Table No</th>
                    <th className="p-1 text-left text-pos-text-primary border-b-2 border-pos-border-primary text-sm font-medium">Customer</th>
                    <th className="p-1 text-left text-pos-text-primary border-b-2 border-pos-border-primary text-sm font-medium">Waiter</th>
                    <th className="p-1 text-left text-pos-text-primary border-b-2 border-pos-border-primary text-sm font-medium">Size</th>
                    <th className="p-1 text-left text-pos-text-primary border-b-2 border-pos-border-primary text-sm font-medium">Status</th>
                    <th className="p-1 text-right text-pos-text-primary border-b-2 border-pos-border-primary text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTables.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-pos-text-secondary text-sm">
                        No tables found for this room
                      </td>
                    </tr>
                  ) : (
                    filteredTables.map(table => (
                      <tr key={table.id} className="border-b border-pos-border-primary hover:bg-pos-bg-tertiary transition-colors">
                        <td className="p-1 text-pos-text-primary text-sm font-medium">{table.table_no}</td>
                        <td className="p-1 text-pos-text-primary text-sm">{table.customer_name || '-'}</td>
                        <td className="p-1 text-pos-text-primary text-sm">{table.waiter_name || '-'}</td>
                        <td className="p-1 text-pos-text-primary text-sm">{table.table_size || '-'}</td>
                        <td className="p-1 text-pos-text-primary text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(table.status)}`}>
                            {table.status}
                          </span>
                        </td>
                        <td className="p-1 text-right">
                          <button
                            onClick={() => handleEditTable(table)}
                            className="btn-secondary mr-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteTableConfirmation(table)}
                            className="btn-secondary py-1"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowAddRoom(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[500px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button
                onClick={() => setShowAddRoom(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-pos-text-muted mb-2">
                  Room Name / Number <span className="text-pos-error">*</span>
                </label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  placeholder="Enter room name or number"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-pos-text-muted mb-2">
                  Total Tables
                </label>
                <input
                  type="number"
                  value={roomForm.total_table}
                  onChange={(e) => setRoomForm({ ...roomForm, total_table: parseInt(e.target.value) })}
                  className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddRoom(false)}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoom}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                {editingRoom ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowAddTable(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[500px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">Add New Table</h3>
              <button
                onClick={() => setShowAddTable(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Table Number <span className="text-pos-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="table_no"
                    value={tableForm.table_no}
                    onChange={handleInputChange}
                    className={`w-full bg-pos-bg-primary border ${fieldErrors.table_no ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Enter table number"
                  />
                  {fieldErrors.table_no && <p className="text-pos-error text-xs mt-1">{fieldErrors.table_no}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Room
                  </label>
                  <select
                    name="room_id"
                    value={tableForm.room_id}
                    onChange={handleInputChange}
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
                    Status
                  </label>
                  <select
                    name="status"
                    value={tableForm.status}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Table Size
                  </label>
                  <select
                    name="table_size"
                    value={tableForm.table_size}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select size</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
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
                    name="customer_name"
                    value={tableForm.customer_name}
                    onChange={handleInputChange}
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
                    name="waiter_name"
                    value={tableForm.waiter_name}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Enter waiter name"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-pos-text-muted mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={tableForm.description}
                  onChange={handleInputChange}
                  className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  placeholder="Enter description (optional)"
                  rows="3"
                />
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
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditTable && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowEditTable(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[500px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">Edit Table</h3>
              <button
                onClick={() => setShowEditTable(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Table Number <span className="text-pos-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="table_no"
                    value={tableForm.table_no}
                    onChange={handleInputChange}
                    className={`w-full bg-pos-bg-primary border ${fieldErrors.table_no ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Enter table number"
                  />
                  {fieldErrors.table_no && <p className="text-pos-error text-xs mt-1">{fieldErrors.table_no}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Room
                  </label>
                  <select
                    name="room_id"
                    value={tableForm.room_id}
                    onChange={handleInputChange}
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
                    Status
                  </label>
                  <select
                    name="status"
                    value={tableForm.status}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Table Size
                  </label>
                  <select
                    name="table_size"
                    value={tableForm.table_size}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select size</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
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
                    name="customer_name"
                    value={tableForm.customer_name}
                    onChange={handleInputChange}
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
                    name="waiter_name"
                    value={tableForm.waiter_name}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Enter waiter name"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-pos-text-muted mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={tableForm.description}
                  onChange={handleInputChange}
                  className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditTable(false)}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTable}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Room"
        message={`Are you sure you want to delete "${deleteConfirmation.roomName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationModal
        isOpen={deleteTableConfirmation.isOpen}
        onClose={closeDeleteTableConfirmation}
        onConfirm={confirmDeleteTable}
        title="Delete Table"
        message={`Are you sure you want to delete table "${deleteTableConfirmation.tableName}"? This action cannot be undone.`}
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

export default RoomManager;
