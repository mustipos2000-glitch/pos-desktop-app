import { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';
import ApiService from '../services/api';

const RoomManager = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    total_table: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    roomId: null,
    roomName: ''
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

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRoom = async () => {
    if (!roomForm.name) {
      showWarning('Room name is required', 'Missing Information');
      return;
    }

    try {
      if (editingRoom) {
        await ApiService.updateRoom(editingRoom.id, roomForm);
      } else {
        await ApiService.createRoom(roomForm);
      }

      fetchRooms();
      setShowAddRoom(false);
      setEditingRoom(null);
      setRoomForm({ name: '', total_table: 0 });
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
      await ApiService.deleteRoom(id);
      fetchRooms();
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting room:', error);
      closeDeleteConfirmation();
      showWarning('Failed to delete room', 'Cannot Delete Room');
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

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Rooms</h2>
        <button className="add-btn" onClick={() => {
          setEditingRoom(null);
          setRoomForm({ name: '', total_table: 0 });
          setShowAddRoom(true);
        }}>
          + Add Room
        </button>
      </div>

      <div className="categories-table">
        {loading ? (
          <div className="loading-state">Loading rooms...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Total Tables</th>
                <th className='actions-cell'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    No rooms found. Click "Add Room" to create your first room.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="">{room.name || 'Unnamed Room'}</td>
                    <td className="">{room.total_table || 0}</td>
                    <td className="actions-cell">
                      <IconButton
                        icon="✏️"
                        className="edit"
                        onClick={() => handleEditRoom(room)}
                        title="Edit room"
                      />
                      <IconButton
                        icon="🗑️"
                        className="delete"
                        onClick={() => openDeleteConfirmation(room)}
                        title="Delete room"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

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
                  min="0"
                  value={roomForm.total_table}
                  onChange={(e) => setRoomForm({ ...roomForm, total_table: parseInt(e.target.value) || 0 })}
                  className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  placeholder="Enter number of tables"
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
