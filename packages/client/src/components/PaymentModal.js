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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-pos-bg-secondary rounded-2xl p-6 w-full max-w-4xl border-2 border-pos-border-primary shadow-2xl" style={{margin: "16px" }}>
                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-pos-text-primary mb-4">Checkout Payment</h2>

                    {/* Totals Display */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-pos-bg-primary rounded-xl p-3 border border-pos-border-primary">
                            <div className="text-pos-text-muted text-sm font-medium mb-1">Total</div>
                            <div className="text-2xl font-bold text-pos-text-primary">€ {validTotal.toFixed(2)}</div>
                        </div>
                        <div className="bg-pos-bg-primary rounded-xl p-3 border border-pos-border-primary">
                            <div className="text-pos-text-muted text-sm font-medium mb-1">Assigned</div>
                            <div className="text-2xl font-bold text-pos-text-primary">€ {assigned.toFixed(2)}</div>
                        </div>
                        <div className="bg-pos-bg-primary rounded-xl p-3 border border-pos-border-primary">
                            <div className="text-pos-text-muted text-sm font-medium mb-1">Change Due</div>
                            <div className="text-2xl font-bold text-green-500">€ {Math.max(0, changeDue).toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Amount Input Display */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={enteredAmount}
                            readOnly
                            className="w-full max-w-xs mx-auto bg-pos-bg-primary border-2 border-pos-border-primary text-center text-3xl py-3 rounded-xl text-pos-text-primary font-bold"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Controls */}
                    <div className="space-y-4">
                        {/* Payment Method Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl text-lg font-bold transition-all border-2 min-h-[80px] ${
                                    paymentMethod === 'cash'
                                        ? 'bg-green-600 text-white border-green-700 shadow-lg'
                                        : 'bg-pos-bg-primary text-pos-text-primary border-pos-border-primary hover:bg-pos-interactive-hover'
                                }`}
                            >
                                <div className="text-3xl mb-1">💵</div>
                                <div>Cash</div>
                                <div className="text-sm mt-1">€{cashAmount.toFixed(2)}</div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl text-lg font-bold transition-all border-2 min-h-[80px] ${
                                    paymentMethod === 'card'
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                                        : 'bg-pos-bg-primary text-pos-text-primary border-pos-border-primary hover:bg-pos-interactive-hover'
                                }`}
                            >
                                <div className="text-3xl mb-1">💳</div>
                                <div>Card</div>
                                <div className="text-sm mt-1">€{cardAmount.toFixed(2)}</div>
                            </button>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleQuickAmount('exact')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 text-base rounded-xl font-semibold border border-pos-border-primary"
                            >
                                Exact
                            </button>
                            <button
                                onClick={() => handleQuickAmount('ceiling')}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 text-base rounded-xl font-semibold border border-pos-border-primary"
                            >
                                {Math.ceil(validTotal)}€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(50)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 text-base rounded-xl font-semibold border border-pos-border-primary"
                            >
                                50€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(100)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 text-base rounded-xl font-semibold border border-pos-border-primary"
                            >
                                100€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(200)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 text-base rounded-xl font-semibold border border-pos-border-primary"
                            >
                                200€
                            </button>
                            <button
                                onClick={() => handleQuickAmount(500)}
                                className="bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary py-3 px-3 text-base rounded-xl font-semibold border border-pos-border-primary"
                            >
                                500€
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleAddAmount}
                                disabled={!enteredAmount || parseFloat(enteredAmount) <= 0}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl text-base border-2 border-green-700"
                            >
                                Add to {paymentMethod === 'cash' ? 'Cash' : 'Card'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-4 rounded-xl text-base border-2 border-orange-700"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>

                    {/* Right Side - Numeric Keypad */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'].map((btn) => (
                                <button
                                    key={btn}
                                    onClick={() => handleNumpadInput(btn)}
                                    className={`py-5 px-4 rounded-xl text-2xl font-bold transition-all border-2 ${
                                        btn === 'C'
                                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                                            : 'bg-pos-bg-primary hover:bg-pos-interactive-hover text-pos-text-primary border-pos-border-primary'
                                    }`}
                                >
                                    {btn}
                                </button>
                            ))}
                        </div>

                        {/* Bottom Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg border-2 border-red-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={assigned < validTotal}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg border-2 border-green-700"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;