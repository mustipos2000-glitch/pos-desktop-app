import { useState, useCallback } from 'react';

export const useMessageModal = () => {
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showError = useCallback((message, title = 'Error') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type: 'danger'
        });
    }, []);

    const showWarning = useCallback((message, title = 'Warning') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type: 'warning'
        });
    }, []);

    const showInfo = useCallback((message, title = 'Info') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type: 'info'
        });
    }, []);

    const closeModal = useCallback(() => {
        setMessageModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        messageModal,
        showError,
        showWarning,
        showInfo,
        closeModal
    };
};
