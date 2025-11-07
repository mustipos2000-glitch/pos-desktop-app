import { useState, useEffect, useRef } from "react";

const NoteModal = ({ isOpen, onClose, onConfirm, title, currentNote = "" }) => {
  const [note, setNote] = useState(currentNote);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNote(currentNote);
      // Focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentNote]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(note);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-pos-bg-secondary rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-pos-border-light">
          <h3 className="text-lg font-semibold text-pos-text-primary text-center">
            Add Note - {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your note here..."
            className="w-full h-32 px-3 py-2 bg-pos-bg-primary border border-pos-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover resize-none text-pos-text-primary"
          />
          <p className="text-xs text-pos-text-disabled mt-2">
            Press Ctrl+Enter to save, Esc to cancel
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-pos-border-light flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary rounded transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
