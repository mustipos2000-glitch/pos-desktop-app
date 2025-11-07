import { useState, useEffect } from 'react';
import KeypadNumpad from './KeypadNumpad';

const RoomFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  room = null 
}) => {
  const [roomForm, setRoomForm] = useState({
    name: '',
    total_table: 0
  });

  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);

  useEffect(() => {
    if (room) {
      // Edit mode - populate form with room data
      setRoomForm({
        name: room.name || '',
        total_table: Number(room.total_table) || 0
      });
    } else {
      // Add mode - reset form
      setRoomForm({
        name: '',
        total_table: 0
      });
    }
    setActiveField('name');
  }, [room, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoomForm(prev => ({
      ...prev,
      [name]: name === 'total_table' ? parseInt(value) || 0 : value
    }));
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setRoomForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setRoomForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setRoomForm(prev => ({
        ...prev,
        [activeField]: activeField === 'total_table' ? 0 : ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleSubmit = () => {
    if (!roomForm.name) {
      return;
    }
    onSubmit(roomForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-tertiary" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text-primary">
            {room ? 'Edit Room' : 'Add New Room'}
          </h3>
          <button 
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form Section */}
        <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Room Name / Number <span className="text-pos-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={roomForm.name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter room name or number"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Total Tables
              </label>
              <input
                type="number"
                name="total_table"
                value={roomForm.total_table}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('total_table')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'total_table' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Keypad Section */}
        {showKeypad && (
          <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{marginTop:"-1rem"}}>
            <div className="mb-1 text-sm text-pos-text-muted text-center">
              Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
            </div>
            <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
              <KeypadNumpad
                onInput={handleKeypadInput}
                onEnter={handleKeypadEnter}
                onBackspace={handleKeypadBackspace}
                onClear={handleKeypadClear}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Keypad Toggle Button */}
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}>
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className='flex gap-2'>
            <button 
              onClick={onClose}
              className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-5 py-1.5 bg-pos-bg-primary text-white text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
            >
              {room ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomFormModal;
