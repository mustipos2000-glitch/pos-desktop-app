import { useState, useEffect, useCallback } from "react";

const PaymentModal = ({
    isOpen,
    onClose,
    total,
    onConfirm,
    defaultPaymentMethod = 'cash'
}) => {
    const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
    const [cashAmount, setCashAmount] = useState(0);
    const [cardAmount, setCardAmount] = useState(0);
    const [enteredAmount, setEnteredAmount] = useState('');
    const [changeDue, setChangeDue] = useState(0);
    const [assigned, setAssigned] = useState(0);

    // Reset amounts when modal opens, but preserve payment method selection
    useEffect(() => {
        if (isOpen) {
            setCashAmount(0);
            setCardAmount(0);
            setEnteredAmount('');
        }
    }, [isOpen]);

    // Update payment method when defaultPaymentMethod prop changes
    useEffect(() => {
        if (isOpen && defaultPaymentMethod) {
            setPaymentMethod(defaultPaymentMethod);
        }
    }, [isOpen, defaultPaymentMethod]);

    // Calculate totals when amounts change
    useEffect(() => {
        const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
        const totalAssigned = cashAmount + cardAmount;
        setAssigned(totalAssigned);
        setChangeDue(Math.max(0, totalAssigned - validTotal));
    }, [cashAmount, cardAmount, total]);

    // Handle numeric keypad input
    const handleNumpadInput = useCallback((value) => {
        if (value === 'C') {
            setEnteredAmount('');
        } else if (value === '.') {
            if (!enteredAmount.includes('.')) {
                setEnteredAmount(prev => prev + '.');
            }
        } else {
            setEnteredAmount(prev => prev + value);
        }
    }, [enteredAmount]);

    // Handle quick amount buttons
    const handleQuickAmount = (amount) => {
        const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
        if (amount === 'exact') {
            const remaining = validTotal - assigned;
            setEnteredAmount(remaining.toFixed(2));
        } else if (amount === 'ceiling') {
            const ceilingAmount = Math.ceil(validTotal);
            setEnteredAmount(ceilingAmount.toString());
        } else {
            setEnteredAmount(amount.toString());
        }
    };

    // Add amount to selected payment method
    const handleAddAmount = useCallback(() => {
        const amount = parseFloat(enteredAmount) || 0;
        if (amount <= 0) return;

        if (paymentMethod === 'cash') {
            setCashAmount(prev => prev + amount);
        } else {
            setCardAmount(prev => prev + amount);
        }
        setEnteredAmount('');
    }, [enteredAmount, paymentMethod]);

    // Reset all amounts
    const handleReset = () => {
        setCashAmount(0);
        setCardAmount(0);
        setEnteredAmount('');
    };

    // Handle payment confirmation
    const handleConfirm = useCallback(() => {
        const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
        if (assigned < validTotal) {
            alert('Payment amount is less than total. Please add more payment.');
            return;
        }

        onConfirm({
            cashAmount,
            cardAmount,
            totalPaid: assigned,
            changeDue: Math.max(0, changeDue)
        });
    }, [assigned, total, onConfirm, cashAmount, cardAmount, changeDue]);

    // Handle keyboard input
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                handleNumpadInput(e.key);
            } else if (e.key === '.') {
                handleNumpadInput('.');
            } else if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                if (enteredAmount && parseFloat(enteredAmount) > 0) {
                    handleAddAmount();
                } else {
                    const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
                    if (assigned >= validTotal) {
                        handleConfirm();
                    }
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                setEnteredAmount(prev => prev.slice(0, -1));
            } else if (e.key.toLowerCase() === 'c') {
                handleNumpadInput('C');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, enteredAmount, assigned, total, handleAddAmount, handleConfirm, handleNumpadInput, onClose]);

    if (!isOpen) return null;

    // Ensure total is a valid number
    const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
    // const remaining = Math.max(0, validTotal - assigned);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-pos-bg-secondary rounded-lg p-4 w-[520px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="text-center mb-3">
                    <h2 className="text-lg font-semibold text-pos-text-primary mb-2">Checkout (Pay)</h2>

                    {/* Totals Display */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-2">
                        <div>
                            <div className="text-pos-text-disabled text-xs">Total</div>
                            <div className="text-sm font-semibold text-pos-text-primary">€ {validTotal.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-pos-text-disabled text-xs">Assigned</div>
                            <div className="text-sm font-semibold text-pos-text-primary">€ {assigned.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-pos-text-disabled text-xs">Change due</div>
                            <div className="text-sm font-semibold text-pos-text-primary">€ {Math.max(0, changeDue).toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Amount Input Display */}
                    <div className="mb-2">
                        <input
                            type="text"
                            value={enteredAmount}
                            readOnly
                            className="w-full max-w-[160px] bg-pos-bg-primary border border-pos-border-light text-center text-lg py-1 text-pos-text-primary"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Left Side - Controls */}
                    <div>
                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-3 gap-1 mb-2">
                            <button
                                onClick={() => handleQuickAmount('exact')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-2 px-2 text-sm rounded"
                            >
                                Exact
                            </button>
                            <button
                                onClick={() => handleQuickAmount('ceiling')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-2 px-2 text-sm rounded"
                            >
                                {Math.ceil(validTotal)}€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(50)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-2 px-2 text-sm rounded"
                            >
                                50€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(100)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-2 px-2 text-sm rounded"
                            >
                                100€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(200)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-2 px-2 text-sm rounded"
                            >
                                200€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(500)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-2 px-2 text-sm rounded"
                            >
                                500€
                            </button>
                            {/* <button
                                onClick={() => handleQuickAmount(remaining)}
                                disabled={remaining <= 0}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-pos-text-primary py-1 px-2 text-xs rounded"
                            >
                                €{remaining.toFixed(2)}
                            </button> */}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex items-center justify-between px-2 py-1 rounded text-sm ${paymentMethod === 'cash'
                                    ? 'bg-pos-interactive-hover text-white'
                                    : 'bg-pos-bg-primary text-pos-text-primary hover:bg-pos-interactive-hover'
                                    }`}
                            >
                                <div className="text-lg">💵</div>
                                <div className="font-medium">Cash</div>
                                <div className="text-xs">€{cashAmount.toFixed(2)}</div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex items-center justify-between px-2 py-1 rounded text-sm ${paymentMethod === 'card'
                                    ? 'bg-pos-interactive-hover text-white'
                                    : 'bg-pos-bg-primary text-pos-text-primary hover:bg-pos-interactive-hover'
                                    }`}
                            >
                                <div className="text-lg">💳</div>
                                <div className="font-medium">Card</div>
                                <div className="text-xs">€{cardAmount.toFixed(2)}</div>
                            </button>

                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 gap-2 mb-1">
                            <button
                                onClick={handleAddAmount}
                                disabled={!enteredAmount || parseFloat(enteredAmount) <= 0}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-2 rounded text-sm"
                            >
                                Add to {paymentMethod === 'cash' ? 'Cash' : 'Card'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-white py-2 px-2 rounded text-sm"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>

                    {/* Right Side - Numeric Keypad */}
                    <div>
                        <div className="grid grid-cols-4 gap-1">
                            <button
                                onClick={() => handleNumpadInput('6')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                6
                            </button>
                            <button
                                onClick={() => handleNumpadInput('7')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                7
                            </button>
                            <button
                                onClick={() => handleNumpadInput('8')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                8
                            </button>
                            <button
                                onClick={() => handleNumpadInput('9')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                9
                            </button>
                            <button
                                onClick={() => handleNumpadInput('5')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                5
                            </button>
                            <button
                                onClick={() => handleNumpadInput('4')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                4
                            </button>
                            <button
                                onClick={() => handleNumpadInput('3')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                3
                            </button>
                            <button
                                onClick={() => handleNumpadInput('2')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                2
                            </button>
                            <button
                                onClick={() => handleNumpadInput('C')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-white py-3 px-3 rounded text-lg font-medium"
                            >
                                C
                            </button>
                            <button
                                onClick={() => handleNumpadInput('.')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                .
                            </button>
                            <button
                                onClick={() => handleNumpadInput('0')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                0
                            </button>
                            <button
                                onClick={() => handleNumpadInput('1')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 rounded text-lg font-medium"
                            >
                                1
                            </button>

                        </div>
                        {/* Bottom Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <button
                                onClick={onClose}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-white  py-2 rounded text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={assigned < validTotal}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 rounded text-sm"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default PaymentModal;