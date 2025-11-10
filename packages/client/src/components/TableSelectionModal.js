import { useState, useEffect } from 'react';
import ApiService from '../services/api';

const TableSelectionModal = ({ isOpen, onClose, onSelectTable }) => {
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsResult, tablesResult] = await Promise.all([
        ApiService.getRooms(),
        ApiService.getPrTables()
      ]);
      setRooms(roomsResult.data || []);
      setTables(tablesResult.data || []);
      if (roomsResult.data && roomsResult.data.length > 0) {
        setSelectedRoom(roomsResult.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = selectedRoom
    ? tables.filter(t => t.room_id === selectedRoom.id)
    : [];

  const getStatusBadge = (status) => {
    const statusColors = {
      available: 'bg-green-500/20 text-green-400',
      occupied: 'bg-red-500/20 text-red-400',
      reserved: 'bg-yellow-500/20 text-yellow-400',
      cleaning: 'bg-blue-500/20 text-blue-400'
    };
    return statusColors[status] || statusColors.available;
  };

  const handleTableSelect = (table) => {
    onSelectTable(table);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-pos-bg-secondary rounded-lg w-[90%] max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-pos-border-primary flex justify-between items-center">
          <h2 className="text-xl font-semibold text-pos-text-primary">Select Table</h2>
          <button
            onClick={onClose}
            className="text-pos-text-secondary hover:text-pos-text-primary text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Rooms */}
          <div className="w-48 bg-pos-bg-tertiary border-r border-pos-border-primary overflow-y-auto scrollbar-custom">
            {loading ? (
              <div className="p-4 text-pos-text-primary text-center text-sm">
                Loading...
              </div>
            ) : (
              rooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`py-3 px-4 cursor-pointer text-sm ${
                    selectedRoom?.id === room.id
                      ? 'bg-pos-interactive-primary text-white'
                      : 'text-pos-text-primary hover:bg-pos-bg-secondary'
                  }`}
                >
                  {room.name}
                </div>
              ))
            )}
          </div>

          {/* Right Content - Tables */}
          <div className="flex-1 overflow-y-auto scrollbar-custom p-4">
            {!selectedRoom ? (
              <div className="text-pos-text-secondary text-center mt-12">
                Select a room to view tables
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="text-pos-text-secondary text-center mt-12">
                No tables found for this room
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredTables.map(table => (
                  <div
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className="bg-pos-bg-primary border border-pos-border-primary rounded p-4 cursor-pointer hover:bg-pos-bg-tertiary transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-semibold text-pos-text-primary">
                        {table.table_no}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(table.status)}`}>
                        {table.status}
                      </span>
                    </div>
                    {table.customer_name && (
                      <div className="text-xs text-pos-text-secondary mt-1">
                        👤 {table.customer_name}
                      </div>
                    )}
                    {table.waiter_name && (
                      <div className="text-xs text-pos-text-secondary mt-1">
                        🍽️ {table.waiter_name}
                      </div>
                    )}
                    {table.table_size && (
                      <div className="text-xs text-pos-text-secondary mt-1">
                        👥 {table.table_size} seats
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSelectionModal;
