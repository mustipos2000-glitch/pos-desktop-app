import { useState, useEffect } from 'react';
import ApiService from '../services/api';

const UnifiedTableModal = ({ 
  isOpen, 
  onClose, 
  onSelectTable,
  mode = 'select', // 'select' or 'split'
  currentTable = null,
  selectedItems = [],
  showNoTableOption = false
}) => {
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedTable(null); // Reset selection when modal opens
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
    ? tables.filter(t => {
        // For split mode, exclude current table
        if (mode === 'split' && currentTable && t.id === currentTable.id) {
          return false;
        }
        return t.room_id === selectedRoom.id;
      })
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

  const handleTableClick = (table) => {
    if (table.status === 'cleaning') {
      alert(`Table ${table.table_no} is currently being cleaned. Please select another table.`);
      return;
    }

    if (mode === 'select') {
      // Direct selection for table selection mode
      onSelectTable(table);
      onClose();
    } else {
      // Two-step selection for split mode
      setSelectedTable(table);
    }
  };

  const handleConfirm = () => {
    if (!selectedTable) {
      alert('Please select a destination table');
      return;
    }
    onSelectTable(selectedTable);
    onClose();
  };

  const handleNoTable = () => {
    onSelectTable(null);
    onClose();
  };

  if (!isOpen) return null;

  const isSplitMode = mode === 'split';
  const title = isSplitMode ? 'Move Items to Another Table' : 'Select Table';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] pr-[100px]">
      <div className="bg-pos-bg-secondary w-[90%] max-w-3xl max-h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-pos-border-primary ${isSplitMode ? 'bg-pos-bg-tertiary' : ''}`}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-pos-text-primary">{title}</h2>
            {showNoTableOption && !isSplitMode && (
              <button
                onClick={handleNoTable}
                className="bg-pos-bg-tertiary border-2 border-pos-border-primary px-3 py-1 hover:bg-pos-interactive-primary hover:border-pos-interactive-primary hover:text-white transition-colors text-pos-text-primary font-medium text-sm"
              >
                No Table / Take Away
              </button>
            )}
            <button
              onClick={onClose}
              className="text-pos-text-secondary hover:text-pos-text-primary text-2xl"
            >
              ×
            </button>
          </div>

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
                {isSplitMode ? 'No available tables in this room' : 'No tables found for this room'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredTables.map(table => (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`bg-pos-bg-primary border p-4 cursor-pointer transition-colors ${
                      isSplitMode && selectedTable?.id === table.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-pos-border-primary hover:bg-pos-bg-tertiary'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-semibold text-pos-text-primary">
                        {table.table_no}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium ${getStatusBadge(table.status)}`}>
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

        {/* Footer - Only for Split Mode */}
        {isSplitMode && (
          <div className="px-6 py-4 border-t border-pos-border-primary bg-pos-bg-tertiary">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-pos-bg-tertiary text-pos-text-primary hover:bg-pos-interactive-primary hover:text-white transition-colors border border-pos-border-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedTable}
                className="px-6 py-2 ms-1 bg-pos-bg-primary text-white  hover:bg-pos-interactive-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                <span>Confirm Move</span>
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedTableModal;
