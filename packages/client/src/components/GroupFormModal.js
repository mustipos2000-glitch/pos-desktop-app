import { useState, useEffect } from "react";
import KeypadNumpad from "./KeypadNumpad";

const GroupFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  group = null,
}) => {
  const [groupForm, setGroupForm] = useState({
    name: "",
    is_visible: 0,
  });

  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (isOpen) {
      if (group) {
        // Editing existing group
        setGroupForm({
          name: group.name || "",
          is_visible: Number(group.is_visible) || 0,
        });
      } else {
        // Adding new group
        setGroupForm({
          name: "",
          is_visible: 0,
        });
      }
    }
  }, [isOpen, group]);

  const handleSubmit = () => {
    if (!groupForm.name.trim()) {
      return;
    }
    onSubmit(groupForm);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setGroupForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setGroupForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setGroupForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    // Keep keypad visible, just blur the active field
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-pos-bg-tertiary rounded-lg max-h-[90vh] overflow-y-auto max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-2 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-pos-text-primary">
            {group ? "Edit Group" : "Add New Group"}
          </h3>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form Section */}
        <div className="px-6 py-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-pos-text-muted mb-2">
              Group Name <span className="text-pos-error">*</span>
            </label>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, name: e.target.value })
              }
              onFocus={() => handleFieldFocus('name')}
              className={`w-full bg-pos-bg-primary border ${activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
              placeholder="Enter group name"
              autoFocus
            />
          </div>

          <div className="">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={groupForm.is_visible === 1}
                onChange={(e) =>
                  setGroupForm({
                    ...groupForm,
                    is_visible: e.target.checked ? 1 : 0,
                  })
                }
                className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary rounded focus:ring-pos-info focus:ring-2"
              />
              <span className="ml-2 text-sm text-pos-text-primary">
                Visible
              </span>
            </label>
          </div>
        </div>

        {/* Keypad Section */}
        {showKeypad && (
          <div className="px-6 py-2 border-t border-pos-border-secondary">
            <div className="mb-2 text-sm text-pos-text-muted text-center">
              Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
            </div>
            <div className="flex justify-center w-full">
              <div className="w-full max-w-md">
                <KeypadNumpad
                  onInput={handleKeypadInput}
                  onEnter={handleKeypadEnter}
                  onBackspace={handleKeypadBackspace}
                  onClear={handleKeypadClear}
                  defaultMode="keypad"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-4 py-2  text-sm font-medium transition-colors ${
              showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}
          >
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary  text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!groupForm.name.trim()}
              className="px-6 py-2.5 bg-pos-bg-primary text-white border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {group ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupFormModal;