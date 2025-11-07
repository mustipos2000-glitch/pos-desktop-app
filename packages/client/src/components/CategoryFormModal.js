import { useState, useEffect } from "react";
import KeypadNumpad from "./KeypadNumpad";

const CategoryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  category = null,
}) => {
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    next_course: 0,
    in_web_shop: 0,
    is_visible: 1,
  });

  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Editing existing category
        setCategoryForm({
          name: category.name || "",
          next_course: Number(category.next_course) || 0,
          in_web_shop: Number(category.in_web_shop) || 0,
          is_visible:
            Number(category.is_visible) !== undefined
              ? Number(category.is_visible)
              : 1,
        });
      } else {
        // Adding new category
        setCategoryForm({
          name: "",
          next_course: 0,
          in_web_shop: 0,
          is_visible: 1,
        });
      }
    }
  }, [isOpen, category]);

  const handleSubmit = () => {
    if (!categoryForm.name.trim()) {
      return;
    }
    onSubmit(categoryForm);
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
      setCategoryForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setCategoryForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setCategoryForm(prev => ({
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
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-pos-bg-tertiary  shadow-2xl max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold text-pos-text-primary">
            {category ? "Edit Category" : "Add New Category"}
          </h3>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <div className="category-form-keypad">
            {/* Form Fields */}
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-pos-text-muted mb-2">
                  Category Name <span className="text-pos-error">*</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  onFocus={() => handleFieldFocus('name')}
                  className={`w-full bg-pos-bg-primary border ${activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_visible === 1}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        is_visible: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary focus:ring-pos-info focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-pos-text-primary">
                    Visible
                  </span>
                </label>
              </div>
            </div>

            {/* Keypad */}
            {showKeypad && (
              <div className="w-full max-w-md">
                <div className="mb-2 text-sm text-pos-text-muted">
                  Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                </div>
                <KeypadNumpad
                  onInput={handleKeypadInput}
                  onEnter={handleKeypadEnter}
                  onBackspace={handleKeypadBackspace}
                  onClear={handleKeypadClear}
                  defaultMode="keypad"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-4 py-2  text-sm font-medium transition-colors ${
              showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}>
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary  text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!categoryForm.name.trim()}
              className="px-6 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary  text-sm font-medium hover:bg-pos-interactive-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {category ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormModal;