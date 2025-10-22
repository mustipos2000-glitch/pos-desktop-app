import './css/ConfirmationModal.css';

const MessageModal = ({
    isOpen,
    onClose,
    title = 'Message',
    message = '',
    type = 'info' // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-overlay" onClick={onClose}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
                <div className={`confirmation-icon ${type}`}>
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

                <h3 className="confirmation-title">{title}</h3>
                <p className="confirmation-message">{message}</p>

                <div className="confirmation-actions">
                    <button className={`confirmation-confirm-btn ${type}`} onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageModal;
