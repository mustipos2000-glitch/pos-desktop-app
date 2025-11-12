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
    <div className="admin-section h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-pos-bg-secondary border-pos-border-primary">
        <h2 className="m-0 text-pos-text-primary text-2xl font-medium flex-1 text-center">Rooms & Tables</h2>
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search rooms, tables..."
        />
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1 flex gap-1 border-pos-border-primary">
        <button
          onClick={() => {
            setEditingRoom(null);
            setShowRoomModal(true);
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
              setEditingTable(null);
              setShowTableModal(true);
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
            rooms.filter(room =>
              !searchQuery || room.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(room => (
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
