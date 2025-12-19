import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import RoomFormModal from './RoomFormModal';
import TableFormModal from './TableFormModal';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const RoomManager = () => {
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSaveRoom = async (roomForm) => {
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
        closeRoomModal();
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
    setShowRoomModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
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

  const handleSaveTable = async (tableForm) => {
    try {
      const payload = {
        ...tableForm,
        room_id: tableForm.room_id || null,
        order_id: tableForm.order_id || null
      };

      const url = editingTable
        ? `http://localhost:5000/api/pr-tables/${editingTable.id}`
        : 'http://localhost:5000/api/pr-tables';

      const response = await fetch(url, {
        method: editingTable ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchTables();
        closeTableModal();
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || `Failed to ${editingTable ? 'update' : 'create'} table`);
      }
    } catch (error) {
      console.error(`Error ${editingTable ? 'updating' : 'creating'} table:`, error);
      showError(`Failed to ${editingTable ? 'update' : 'create'} table. Please try again.`);
    }
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setShowTableModal(true);
  };

  const closeTableModal = () => {
    setShowTableModal(false);
    setEditingTable(null);
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
    ? tables.filter(t => 
        t.room_id === selectedRoom.id &&
        (!searchQuery || 
          t.table_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.waiter_name && t.waiter_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  return (
    <div className="overflow-y-auto scrollbar-custom mt-1">
      {/* Header with Action Buttons */}
      <div className="flex gap-2 bg-pos-bg-secondary rounded-lg py-2 px-1">
        <button
          onClick={() => {
            setEditingRoom(null);
            setShowRoomModal(true);
          }}
          className="btn-primary"
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
          className={`btn-primary ${!selectedRoom
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
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
          className={`btn-primary ${!selectedRoom
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
        >
          Delete Room
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (selectedRoom) {
                setEditingTable(null);
                setShowTableModal(true);
              }
            }}
            disabled={!selectedRoom}
            className={`btn-primary ${!selectedRoom
              ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              : ""
              }`}
          >
            Add Table
          </button>
        </div>
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search rooms, tables..."
        />
      </div>

      {/* Main Content Area */}
      <div className="flex gap-2 mt-4">
        {/* Left Sidebar - Rooms */}
        <div className="flex-1 max-w-[11rem]">
          <h3 className="text-base font-medium text-pos-text-primary mb-2">
            Rooms
          </h3>
          {loading ? (
            <div className="text-pos-text-muted text-lg p-4 text-center">
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className="h-[500px] text-pos-text-muted text-sm border border-pos-border-secondary bg-pos-bg-secondary rounded-lg p-2 overflow-y-auto scrollbar-custom">
              No rooms found.
            </div>
          ) : (
            <div className="h-[500px] min-w-[160px] max-w-[200px] border border-pos-border-secondary p-2 overflow-y-auto scrollbar-custom bg-pos-bg-secondary rounded-lg">
              {rooms.filter(room =>
                !searchQuery || room.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(room => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`flex text-lg mt-1 mb-2 shadow-md cursor-pointer transition-all duration-200 rounded-lg border border-pos-border-primary px-1 py-1 ${selectedRoom?.id === room.id
                    ? 'bg-pos-bg-primary shadow-md'
                    : 'hover:bg-black/5 hover:shadow-sm hover:scale-[1.02]'
                    }`}
                >
                  <div className="px-1 py-1 flex-1">
                    {room.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Content - Tables */}
        <div className="flex-[3] min-w-[300px]">
          <h3 className="text-base font-medium text-pos-text-primary mb-2">
            Tables
          </h3>
          {!selectedRoom ? (
            <div className="h-[500px] text-pos-text-muted text-lg border border-pos-border-secondary bg-pos-bg-secondary p-2 rounded-lg text-pos-error">
              Select a room to view tables
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="h-[500px] text-pos-text-muted text-lg border border-pos-border-secondary p-2 rounded-lg bg-pos-bg-secondary text-pos-error">
              No tables
            </div>
          ) : (
            <div className="h-[500px] border border-pos-border-secondary p-2 text-base overflow-y-auto scrollbar-custom rounded-lg bg-pos-bg-secondary">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className={`flex justify-between shadow-md items-center border border-pos-border-primary mt-1 mb-2 cursor-pointer transition-all duration-200 rounded-lg px-2 py-1 ${
                    'hover:bg-black/5 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="font-medium min-w-[80px]">{table.table_no}</div>
                    <div className="text-sm text-pos-text-muted flex gap-4">
                      {table.customer_name && <span>Customer: {table.customer_name}</span>}
                      {table.waiter_name && <span>Waiter: {table.waiter_name}</span>}
                      {table.table_size && <span>Size: {table.table_size}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(table.status)}`}>
                      {table.status}
                    </span>
                    <button
                      onClick={() => handleEditTable(table)}
                      className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteTableConfirmation(table)}
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
      </div>

      <RoomFormModal
        isOpen={showRoomModal}
        onClose={closeRoomModal}
        onSubmit={handleSaveRoom}
        room={editingRoom}
      />

      <TableFormModal
        isOpen={showTableModal}
        onClose={closeTableModal}
        onSubmit={handleSaveTable}
        table={editingTable}
        rooms={rooms}
        selectedRoomId={selectedRoom?.id}
      />

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
