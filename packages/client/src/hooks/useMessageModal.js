import { useState } from 'react';

export const useMessageModal = () => {
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showError = (message, title = 'Error') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type: 'danger'
        });
    };

    const showWarning = (message, title = 'Warning') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type: 'warning'
        });
    };

    const showInfo = (message, title = 'Info') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type: 'info'
        });
    };

    const closeModal = () => {
        setMessageModal({ ...messageModal, isOpen: false });
    };

    return {
        messageModal,
        showError,
        showWarning,
        showInfo,
        closeModal
    };
};
