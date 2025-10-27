const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getIconColor = () => {
        switch (type) {
            case 'danger': return 'text-pos-error';
            case 'warning': return 'text-pos-warning';
            case 'info': return 'text-pos-info';
            default: return 'text-pos-error';
        }
    };

    const getConfirmButtonClass = () => {
        switch (type) {
            case 'danger': return 'btn-danger';
            case 'warning': return 'btn-warning';
            case 'info': return 'btn-info';
            default: return 'btn-danger';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-pos-bg-secondary rounded-lg p-6 max-w-md w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className={`flex justify-center mb-4 ${getIconColor()}`}>
                    {type === 'danger' && (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    )}
                    {type === 'warning' && (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    )}
                    {type === 'info' && (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    )}
                </div>

                <h3 className="text-pos-text-primary text-xl font-semibold text-center mb-4">{title}</h3>
                <p className="text-pos-text-secondary text-center mb-6 leading-relaxed">{message}</p>

                <div className="flex gap-3 justify-end">
                    {cancelText && (
                        <button className="btn-secondary" onClick={onClose}>
                            {cancelText}
                        </button>
                    )}
                    <button className={getConfirmButtonClass()} onClick={handleConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
