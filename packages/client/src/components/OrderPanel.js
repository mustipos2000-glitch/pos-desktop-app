import { useState, useRef, useEffect,useCallback } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal";
import NoteModal from "./NoteModal";
import Toast from "./Toast";
import CustomerSelector from "./CustomerSelector";
import ApiService from "../services/api";
import { printerService } from "../services/printerService";

const OrderPanel = ({ cart, setCart, onUpdateQuantity, customQuantity, setCustomQuantity, currentOrderId, currentOrderNo, selectedTable, onOrderComplete, onDeleteAll, onSplitCart, selectedCustomer, onSelectCustomer, onRefreshHoldCount, selectedEmployee }) => {


  const formatAmount = (value) => {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return num.toFixed(2);
  };
  
  // Helper function to generate manual change receipt data
  const generateManualChangeReceipt = useCallback((orderData, manualChangeAmount) => {
    return {
      type: 'manual_change',
      orderId: orderData.id || currentOrderId,
      orderNo: currentOrderNo,
      tableNo: selectedTable?.table_no,
      manualChangeAmount,
      timestamp: new Date().toISOString(),
      cashier: selectedEmployee?.name || 'Unknown',
      reason: 'Cashmatic insufficient denominations'
    };
  });

  // Helper function to save manual change record to database (optional)
  const saveManualChangeRecord = async (receiptData) => {
    try {
      // You can implement this API call to save manual change records
      // await ApiService.saveManualChangeRecord(receiptData);
      console.log("Manual change record saved:", receiptData);
    } catch (error) {
      console.error("Error saving manual change record:", error);
    }
  };
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  const [printers, setPrinters] = useState([]);
  const [completedOrderId, setCompletedOrderId] = useState(null);



  const [selectedIds, setSelectedIds] = useState([]);
  const [lastAddedId, setLastAddedId] = useState(null);
  const prevCartLengthRef = useRef(cart.length);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalTitle, setNoteModalTitle] = useState("");
  const [currentNoteValue, setCurrentNoteValue] = useState("");

  // Cashmatic state
  const [cashmaticSessionId, setCashmaticSessionId] = useState(null);
  const [cashmaticPolling, setCashmaticPolling] = useState(false);
  const [cashmaticInfo, setCashmaticInfo] = useState({
    requested: 0,
    inserted: 0,
    dispensed: 0,
    notDispensed: 0,
    state: null,
  });
  const [showCashmaticModal, setShowCashmaticModal] = useState(false);
  const [manualChangeReceipt, setManualChangeReceipt] = useState(null);
  const [showManualChangeModal, setShowManualChangeModal] = useState(false);
  const [manualChangeAmount, setManualChangeAmount] = useState(0);

  // Payworld state
  const [showPayworldModal, setShowPayworldModal] = useState(false);
  const [payworldStatus, setPayworldStatus] = useState({
    state: "IDLE", // 'IN_PROGRESS' | 'APPROVED' | 'DECLINED' | 'CANCELLED' | 'ERROR'
    message: "",
    details: null,
  });
  const [payworldSessionId, setPayworldSessionId] = useState(null);
  const [payworldPolling, setPayworldPolling] = useState(false);
  const payworldFinalizedRef = useRef(false);

  // Payment Modal state (for Cash/Card payments)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");

  // Fetch printers on component mount
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const response = await printerService.getAllPrinters();
        setPrinters(response.data || []);
      } catch (error) {
        console.error("Error fetching printers:", error);
      }
    };
    fetchPrinters();
  }, []);

  // Track last added item
  useEffect(() => {
    const prevLen = prevCartLengthRef.current;
    const currLen = cart.length;

    if (currLen > prevLen) {
      const lastItem = cart[cart.length - 1];
      const itemId = lastItem.cartItemId || `${lastItem.id}_${lastItem.name}`;
      setLastAddedId(itemId);
      setSelectedIds([itemId]);
    } else if (currLen < prevLen) {
      setLastAddedId(null);
      setSelectedIds([]);
    }

    prevCartLengthRef.current = currLen;
  }, [cart]);

  const calculateTotal = useCallback(() =>
    cart.reduce((sum, item) => {
      const price =
        typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
      const quantity =
        typeof item.quantity === "number" && !isNaN(item.quantity)
          ? item.quantity
          : 0;
      let itemTotal = price * quantity;

      if (item.subProducts && item.subProducts.length > 0) {
        item.subProducts.forEach((subItem) => {
          const subPrice =
            typeof subItem.price === "number" && !isNaN(subItem.price)
              ? subItem.price
              : 0;
          const subQty =
            typeof subItem.quantity === "number" && !isNaN(subItem.quantity)
              ? subItem.quantity
              : 0;
          itemTotal += subPrice * subQty;
        });
      }

      return sum + itemTotal;
    }, 0));

  const handlePaymentConfirm = useCallback(async (paymentData) => {
    if (cart.length === 0) {
      alert("Cart is empty. Cannot process payment.");
      return;
    }

    if (
      !paymentData ||
      typeof paymentData.totalPaid !== "number" ||
      paymentData.totalPaid < 0
    ) {
      alert("Invalid payment data. Please try again.");
      return;
    }

    setIsProcessing(true);
    try {
      const subTotal = calculateTotal();
      const total = subTotal - discount;

      if (total < 0) {
        alert("Order total cannot be negative. Please review discounts.");
        setIsProcessing(false);
        return;
      }

      if (paymentData.totalPaid < total) {
        alert(
          `Insufficient payment. Total: €${formatAmount(
            total
          )}, Paid: €${formatAmount(paymentData.totalPaid)}`
        );
        setIsProcessing(false);
        return;
      }

      const orderType = localStorage.getItem('posVersion') || 'horeca';

      const orderData = {
        status: "completed",
        note,
        sub_total: subTotal,
        total,
        discount,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        order_type: orderType,
        payment_method:
          paymentData.cashAmount > 0 && paymentData.cardAmount > 0
            ? "mixed"
            : paymentData.cashAmount > 0
              ? "cash"
              : "card",
        cash_amount: paymentData.cashAmount || 0,
        card_amount: paymentData.cardAmount || 0,
        total_paid: paymentData.totalPaid,
        change_due: paymentData.changeDue || 0,
        // Add Cashmatic-specific fields if present
        ...(paymentData.cashmaticDispensed !== undefined && {
          cashmatic_dispensed: paymentData.cashmaticDispensed,
          manual_change_due: paymentData.manualChangeDue || 0,
        }),
        details: (() => {
          const allDetails = [];
          let detailIndex = 0;

          cart.forEach((item) => {
            const parentDetailIndex = detailIndex;

            allDetails.push({
              product_id: item.id,
              qty: item.quantity,
              total: item.price * item.quantity,
              notes: item.notes || null,
              discount: item.discount || 0,
            });
            detailIndex++;

            if (item.subProducts && item.subProducts.length > 0) {
              item.subProducts.forEach((subItem) => {
                allDetails.push({
                  product_id: subItem.id,
                  qty: subItem.quantity,
                  total: subItem.price * subItem.quantity,
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${subItem.notes || ""
                    }`,
                  discount: 0,
                });
                detailIndex++;
              });
            }
          });

          return allDetails;
        })(),
      };

      let finalOrderId = currentOrderId;

      if (currentOrderId) {
        if (selectedTable) {
          orderData.table_id = selectedTable.id;
        }

        await ApiService.updateOrder(currentOrderId, orderData);

        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: "available",
            });
          } catch (error) {
            console.error("Error updating table status:", error);
          }
        }
      } else {
        if (selectedTable) {
          orderData.table_id = selectedTable.id;
        }

        const response = await ApiService.createOrder(orderData);
        const data = response.data || response;

        if (data && data.id) {
          finalOrderId = data.id;
        }

        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: "available",
            });
          } catch (error) {
            console.error("Error updating table status:", error);
          }
        }
      }

      setNote("");
      setCompletedOrderId(finalOrderId);

      setShowPaymentModal(false);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  });

  // Poll Cashmatic payment status
  useEffect(() => {
    if (!cashmaticPolling || !cashmaticSessionId) return;

    const poll = async () => {
      try {

        const res = await ApiService.getCashmaticStatus(cashmaticSessionId);
        const s = res.data || res;
        console.log("Cashmatic status:", s);

        // Handle error state from server
        if (s.errorMessage) {
          console.error("Cashmatic error:", s.errorMessage);
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          setIsProcessing(false);
          setToastType("error");
          setToastMessage("Cashmatic communication error: " + s.errorMessage);
          return;
        }

        const requested = (s.requestedAmount || 0) / 100;
        const inserted = (s.insertedAmount || 0) / 100;
        const dispensed = (s.dispensedAmount || 0) / 100;
        const notDispensed = (s.notDispensedAmount || 0) / 100;

        setCashmaticInfo({
          requested,
          inserted,
          dispensed,
          notDispensed,
          state: s.state,
        });
        
        if (s.state === "PAID" || s.state === "FINISHED" || s.state === "FINISHED_MANUAL") {
          console.log('insertd:' + inserted, " Requested : " + requested , " dispensed " + dispensed , " not Dspensed " + notDispensed );
          
          if(inserted < requested)  return;  
          if(inserted > requested && (dispensed > 0 || notDispensed > 0) ){

            const change = inserted - requested;
            if(change > 0){
              const manualChangeDue = change - dispensed;
              if(manualChangeDue > 0){
               // Show a popup with a button that Manual amount to customer is "Change" and when the operator press the button it should print the order receipt. 
                setManualChangeAmount(manualChangeDue);
                setShowManualChangeModal(true);
                setCashmaticPolling(false);
                setCashmaticSessionId(null);
                setShowCashmaticModal(false);
                return;
              }
            }
          }else{
            return
          }

          console.log("Finished the Cashmatic ");

          setCashmaticPolling(false);
          const currentSessionId = cashmaticSessionId;
          setCashmaticSessionId(null); // FIX: Properly clear session

          const subTotal = calculateTotal();
          const total = subTotal - discount;

          // Calculate the actual change due
          const totalChange = inserted - requested;
          const manualChangeDue = notDispensed; // Amount that needs to be given manually

          try {
            // Call finish API to close transaction and print receipt on Cashmatic
            console.log("Calling finish API to close Cashmatic transaction..." + currentSessionId);
            await ApiService.finishCashmaticPayment(currentSessionId);

            // Generate manual change receipt if needed
            // if (manualChangeDue > 0) {
              // const receiptData = generateManualChangeReceipt(
              //   { id: currentOrderId }, 
              //   manualChangeDue
              // );
              // setManualChangeReceipt(receiptData);
              
              // // Save manual change record for tracking
              // await saveManualChangeRecord(receiptData);
              
              // console.log("Manual change receipt generated:", receiptData);
            // }

            // Complete the payment with proper change calculation
            await handlePaymentConfirm({
              totalPaid: inserted, // Customer actually paid this amount
              cashAmount: inserted,
              cardAmount: 0,
              changeDue: totalChange, // Total change due (dispensed + manual)
              cashmaticDispensed: dispensed, // Change given by machine
              manualChangeDue: manualChangeDue, // Change to be given manually
            });

            setToastType("success");
            let message = "Cashmatic payment completed successfully!";
            
            if (manualChangeDue > 0) {
              message = `Payment completed! Please give €${formatAmount(manualChangeDue)} manual change to customer.`;
            }
            
            setToastMessage(message);
            setIsProcessing(false);
          } catch (error) {
            console.error("Error completing order after Cashmatic payment:", error);
            setToastType("error");
            setToastMessage("Payment successful but failed to complete order.");
            setIsProcessing(false);
            setShowCashmaticModal(false);
          }
          return;
        }

        if (s.state === "CANCELLED" || s.state === "ERROR") {
          console.log("Cancelled or Error");
          setCashmaticPolling(false);
          setCashmaticSessionId(null);
          setIsProcessing(false);
          setToastType("error");
          setToastMessage(
            s.state === "CANCELLED"
              ? "Cashmatic payment cancelled."
              : "Error during Cashmatic payment."
          );
          return;
        }
      } catch (error) {
        console.error("Cashmatic polling error:", error);
        setCashmaticPolling(false);
        setCashmaticSessionId(null);
        setIsProcessing(false);
        setToastType("error");
        setToastMessage("Failed to communicate with Cashmatic device.");
        setShowCashmaticModal(false);
      }
    };

    const intervalId = setInterval(poll, 1000);
    return () => clearInterval(intervalId);
  }, [cashmaticPolling, cashmaticSessionId, cart, discount, calculateTotal, handlePaymentConfirm, generateManualChangeReceipt, currentOrderId]);

  // Poll Payworld status
  useEffect(() => {
    if (!payworldPolling || !payworldSessionId) return;
    console.log("Payworld polling started");

    const startTime = Date.now();
    const MAX_POLLING_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

    const poll = async () => {
      // Check if timeout exceeded
      const elapsed = Date.now() - startTime;
      if (elapsed >= MAX_POLLING_DURATION) {
        console.log("Payworld polling timeout reached (2 minutes)");
        setPayworldPolling(false);
        setPayworldSessionId(null);
        setIsProcessing(false);
        setShowPayworldModal(false);
        setToastType("error");
        setToastMessage("Payworld payment timeout. Please try again.");
        setPayworldStatus({
          state: "ERROR",
          message: "Payment timeout - maximum polling duration exceeded.",
          details: null,
        });
        return;
      }

      try {
        const res = await ApiService.getPayworldStatus(payworldSessionId);
        const data = res.data || res;
        if (!data || data.ok === false) return;
        console.log("Payworld status:", data);
        const state = data.state || "IN_PROGRESS";
        const message = data.message || payworldStatus.message;
        const details = data.details || payworldStatus.details;

        setPayworldStatus({
          state,
          message,
          details,
        });

        // finale states
        if (state === "APPROVED" && !payworldFinalizedRef.current) {
          console.log("Payworld status is Approved");
          payworldFinalizedRef.current = true;

          const subTotal = calculateTotal();
          const total = subTotal - discount;

          await handlePaymentConfirm({
            totalPaid: total,
            cashAmount: 0,
            cardAmount: total,
            changeDue: 0,
          });

          setToastType("success");
          console.log("Payworld status is Approved");
          setToastMessage("Payworld payment completed.");

          setShowPayworldModal(false);
          setPayworldPolling(false);
          setPayworldSessionId(null);
          setIsProcessing(false);
        } else if (["DECLINED", "CANCELLED", "ERROR"].includes(state)) {
          console.log("Payworld status is Declined, Cancelled or Error");
          setPayworldPolling(false);
          setPayworldSessionId(null);
          setIsProcessing(false);

          if (state === "CANCELLED") {
            setToastType("info");
            setToastMessage("Payworld payment cancelled.");
          } else if (state === "DECLINED") {
            setToastType("error");
            setToastMessage("Payworld payment declined.");
          } else if (state === "ERROR") {
            setToastType("error");
            setToastMessage("Error during Payworld payment.");
          }
        }
      } catch (err) {
        console.error("Payworld polling error:", err);
        setPayworldPolling(false);
        setPayworldSessionId(null);
        setIsProcessing(false);
        setPayworldStatus({
          state: "ERROR",
          message: "Error retrieving Payworld status.",
          details: { error: err.message },
        });
        setToastType("error");
        setToastMessage("Error retrieving Payworld status.");
      }
    };

    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [calculateTotal, discount, handlePaymentConfirm, payworldPolling, payworldSessionId, payworldStatus.details, payworldStatus.message]);

  const handleSelect = (id) => {
    setSelectedIds((prev) => {
      const alreadySelected = prev.includes(id);
      if (alreadySelected) {
        setLastAddedId(null);
        return prev.filter((x) => x !== id);
      }
      setLastAddedId(id);
      return [...prev, id];
    });
  };

  const handleClearSelected = () => {
    if (selectedIds.length === 0) {
      setToastType("error");
      setToastMessage("Please select at least one item to delete.");
      return;
    }
    setCart((prev) =>
      prev.filter((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return !selectedIds.includes(itemCartId);
      })
    );
    setSelectedIds([]);
    setLastAddedId(null);
  };

  const handleDeleteAllConfirm = () => {
    setCart([]);
    setSelectedIds([]);
    setLastAddedId(null);
    setDiscount(0);
    setNote("");
    setCustomQuantity("");
    if (onSelectCustomer) {
      onSelectCustomer(null);
    }

    // Notify parent to deselect table and clear order
    if (onDeleteAll) {
      onDeleteAll();
    }
  };

  const totalProductCount = () => cart.length;
  const hasSelection = selectedIds.length > 0;

  // Cashmatic payment handler
  const handleCashmaticPayment = async () => {
    console.log("Click on handle cashmatic Payment ");

    if (cart.length === 0) {
      setToastType("error");
      setToastMessage("Cart is empty. Cannot start Cashmatic payment.");
      return;
    }

    const subTotal = calculateTotal();
    const total = subTotal - discount;

    if (total <= 0) {
      setToastType("error");
      setToastMessage(
        "Order total must be greater than zero for Cashmatic payment."
      );
      return;
    }

    try {
      setIsProcessing(true);
      console.log("inside try on Button Cashmatic payment started. Please pay at the machine.");

      setToastType("info");
      setToastMessage("Cashmatic payment started. Please pay at the machine.");
      console.log("Setting the cashmatic Info", total, "State is In Progerss");

      setCashmaticInfo({
        requested: total,
        inserted: 0,
        dispensed: 0,
        notDispensed: 0,
        state: "IN_PROGRESS",
      });
      setShowCashmaticModal(true);

      const res = await ApiService.startCashmaticPayment({
        amount: Math.round(total * 100),
      });

      const data = res.data || res;
      const sessionId = data.sessionId;
      setCashmaticSessionId(sessionId);
      setCashmaticPolling(true);
    } catch (error) {
      console.error("Error starting Cashmatic payment:", error);
      setIsProcessing(false);
      setToastType("error");
      setToastMessage("Failed to start Cashmatic payment.");
      setShowCashmaticModal(false);
    }
  };

  // Cancel Cashmatic payment
  // Handle manual change payment and print receipt
  const handleManualChangePayment = async () => {
    try {
      const subTotal = calculateTotal();
      const total = subTotal - discount;

      // Complete the payment with proper change calculation
      await handlePaymentConfirm({
        totalPaid: cashmaticInfo.inserted, // Customer actually paid this amount
        cashAmount: cashmaticInfo.inserted,
        cardAmount: 0,
        changeDue: cashmaticInfo.inserted - cashmaticInfo.requested, // Total change due
        cashmaticDispensed: cashmaticInfo.dispensed, // Change given by machine
        manualChangeDue: manualChangeAmount, // Change to be given manually
      });

      // Generate manual change receipt
      const receiptData = generateManualChangeReceipt(
        { id: currentOrderId }, 
        manualChangeAmount
      );
      setManualChangeReceipt(receiptData);
      
      // Save manual change record for tracking
      await saveManualChangeRecord(receiptData);

      setToastType("success");
      setToastMessage(`Payment completed! Manual change of €${formatAmount(manualChangeAmount)} given to customer.`);
      setIsProcessing(false);
      setShowManualChangeModal(false);
      
    } catch (error) {
      console.error("Error completing manual change payment:", error);
      setToastType("error");
      setToastMessage("Payment successful but failed to complete order.");
      setIsProcessing(false);
      setShowManualChangeModal(false);
    }
  };

  const handleCancelCashmatic = () => {
    console.log("Cancelling Cashmatic payment");
    
    // Stop polling
    setCashmaticPolling(false);
    
    // Clear session
    setCashmaticSessionId(null);
    
    // Reset processing state
    setIsProcessing(false);
    
    // Close modal
    setShowCashmaticModal(false);
    
    // Reset Cashmatic info
    setCashmaticInfo({
      requested: 0,
      inserted: 0,
      dispensed: 0,
      notDispensed: 0,
      state: null,
    });
    
    // Show cancellation message
    setToastType("info");
    setToastMessage("Cashmatic payment cancelled.");
  };

  // Payworld flow
  const startPayworldFlow = async () => {
    console.log("Click on start Payworld Flow ");
    if (cart.length === 0) {
      setToastType("error");
      setToastMessage("Cart is empty. Cannot start Payworld payment.");
      return;
    }

    const subTotal = calculateTotal();
    const total = subTotal - discount;

    if (total <= 0) {
      setToastType("error");
      setToastMessage(
        "Order total must be greater than zero for Payworld payment."
      );
      return;
    }

    setShowPayworldModal(true);
    setPayworldStatus({
      state: "IN_PROGRESS",
      message: "Payworld payment started. Connecting to terminal...",
      details: null,
    });
    console.log("Set the Payworld status to In Progress", payworldFinalizedRef.current);
    payworldFinalizedRef.current = false;

    try {
      setIsProcessing(true);
      console.log("Start the Payworld payment");
      const res = await ApiService.startPayworldPayment({
        amount: total,
      });
      console.log("Payworld payment response:", res);
      const data = res || {};
      const sessionId = data.sessionId || (data.data && data.data.sessionId);
      console.log("Payworld sessionId:", sessionId);
      if (!sessionId) {
        console.log("No Payworld sessionId received from server.");
        throw new Error("No Payworld sessionId received from server.");
      }
      console.log("Set the Payworld sessionId:", sessionId);
      setPayworldSessionId(sessionId);
      setPayworldPolling(true);

      setPayworldStatus((prev) => ({
        ...prev,
        message:
          "Connection established. Follow the instructions on the terminal...",
      }));
    } catch (err) {
      console.error("Payworld start error:", err);
      setPayworldStatus({
        state: "ERROR",
        message:
          "Payment could not be started. Check settings / connection.",
        details: { error: err.message },
      });
      setToastType("error");
      setToastMessage("Payworld payment could not be started.");
      setShowPayworldModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayworldPayment = () => {
    console.log("Click on handle Payworld Payment ");
    startPayworldFlow();
  };

  // Cancel Payworld on terminal
  const handleAbortPayworld = async () => {
    if (!payworldSessionId) {
      setPayworldStatus({
        state: "ERROR",
        message: "No active Payworld session to cancel.",
        details: null,
      });
      return;
    }

    setPayworldStatus({
      state: "IN_PROGRESS",
      message: "Payment is being cancelled on the terminal...",
      details: null,
    });

    try {
      await ApiService.cancelPayworldPayment(payworldSessionId);

      setPayworldStatus({
        state: "CANCELLED",
        message: "Payworld payment cancelled on the terminal.",
        details: null,
      });

      setPayworldPolling(false);
      setPayworldSessionId(null);

      setToastType("info");
      setToastMessage("Payworld payment cancelled.");
    } catch (err) {
      console.error("Error cancelling Payworld:", err);
      setPayworldStatus({
        state: "ERROR",
        message: "Failed to cancel on terminal.",
        details: { error: err.message },
      });
      setToastType("error");
      setToastMessage("Failed to cancel on Payworld terminal.");
    }
  };

  // Cash and Card payment handlers
  const handleCashPayment = () => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod("cash");
    setShowPaymentModal(true);
  };

  const handleCardPayment = () => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod("card");
    setShowPaymentModal(true);
  };

  const handleOnHold = async () => {
    if (cart.length === 0) {
      setToastType("error");
      setToastMessage("Cart is empty. Cannot put order on hold.");
      return;
    }

    setIsProcessing(true);
    try {
      const subTotal = calculateTotal();
      const total = subTotal - discount;
      const orderType = localStorage.getItem('posVersion') || 'horeca';

      const orderData = {
        status: "on_hold",
        note,
        sub_total: subTotal,
        total,
        discount,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        employee_id: selectedEmployee ? selectedEmployee.id : null,
        table_id: selectedTable ? selectedTable.id : null,
        order_type: orderType,
        details: (() => {
          const allDetails = [];
          let detailIndex = 0;

          cart.forEach((item) => {
            const parentDetailIndex = detailIndex;

            allDetails.push({
              product_id: item.id,
              qty: item.quantity,
              total: item.price * item.quantity,
              notes: item.notes || null,
              discount: item.discount || 0,
            });
            detailIndex++;

            if (item.subProducts && item.subProducts.length > 0) {
              item.subProducts.forEach((subItem) => {
                allDetails.push({
                  product_id: subItem.id,
                  qty: subItem.quantity,
                  total: subItem.price * subItem.quantity,
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${subItem.notes || ""
                    }`,
                  discount: 0,
                });
                detailIndex++;
              });
            }
          });

          return allDetails;
        })(),
      };

      try {
        if (currentOrderId) {
          // Update existing order
          await ApiService.updateOrder(currentOrderId, orderData);
        } else {
          // Create new order
          await ApiService.createOrder(orderData);
        }

        // Update table status if table is selected
        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: "reserved",
            });
          } catch (error) {
            console.error("Error updating table status:", error);
          }
        }

        // Clear cart and reset state
        setCart([]);
        setDiscount(0);
        setNote("");
        setSelectedIds([]);
        setLastAddedId(null);
        if (onSelectCustomer) {
          onSelectCustomer(null);
        }

        // Notify parent to clear order and table selection
        if (onOrderComplete) {
          onOrderComplete();
        }

        // Refresh hold orders count in top bar
        if (onRefreshHoldCount) {
          onRefreshHoldCount();
        }

        setToastType("success");
        setToastMessage("Order placed on hold successfully!");
      } catch (error) {
        console.error("Error placing order on hold:", error);

        // Show inventory error to user
        if (error.message && error.message.includes('Insufficient inventory')) {
          const errorDetails = error.details ?
            error.details.map(d => `• ${d.product_name}: requested ${d.requested}, available ${d.available}`).join('\n') :
            error.message;

          setToastType("error");
          setToastMessage(`⚠️ Insufficient Inventory\n\n${errorDetails}`);
        } else {
          setToastType("error");
          setToastMessage("Failed to place order on hold");
        }
        return; // Don't proceed if there's an error
      }
    } catch (error) {
      console.error("Error putting order on hold:", error);
      setToastType("error");
      setToastMessage("Failed to put order on hold. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotes = () => {
    if (selectedIds.length === 0) {
      setNoteModalTitle("Whole Order");
      setCurrentNoteValue(note);
      setShowNoteModal(true);
    } else if (selectedIds.length === 1) {
      const selectedItem = cart.find((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return itemCartId === selectedIds[0];
      });
      setNoteModalTitle(selectedItem?.name || "Item");
      setCurrentNoteValue(selectedItem?.notes || "");
      setShowNoteModal(true);
    } else {
      setNoteModalTitle(`${selectedIds.length} Items`);
      setCurrentNoteValue("");
      setShowNoteModal(true);
    }
  };

  const handleNoteConfirm = (noteText) => {
    if (selectedIds.length === 0) {
      setNote(noteText);
    } else {
      setCart((prev) =>
        prev.map((item) => {
          const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
          if (selectedIds.includes(itemCartId)) {
            return { ...item, notes: noteText };
          }
          return item;
        })
      );

      setSelectedIds([]);
      setLastAddedId(null);
    }
  };

  const handleSplitCart = () => {
    if (selectedIds.length === 0) {
      setToastType("error");
      setToastMessage("Please select items to move to another table.");
      return;
    }
    if (!selectedTable) {
      setToastType("error");
      setToastMessage("No table selected. Cannot split cart.");
      return;
    }

    const itemsToSplit = cart.filter((item) => {
      const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
      return selectedIds.includes(itemCartId);
    });

    if (onSplitCart) {
      onSplitCart(itemsToSplit, handleSplitCartConfirm);
    }
  };

  const handleSplitCartConfirm = async (destinationTable) => {
    try {
      const itemsToMove = cart.filter((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return selectedIds.includes(itemCartId);
      });

      const subTotal = itemsToMove.reduce((sum, item) => {
        const price =
          typeof item.price === "number" && !isNaN(item.price)
            ? item.price
            : 0;
        const quantity =
          typeof item.quantity === "number" && !isNaN(item.quantity)
            ? item.quantity
            : 0;
        let itemTotal = price * quantity;

        if (item.subProducts && item.subProducts.length > 0) {
          item.subProducts.forEach((subItem) => {
            const subPrice =
              typeof subItem.price === "number" && !isNaN(subItem.price)
                ? subItem.price
                : 0;
            const subQty =
              typeof subItem.quantity === "number" && !isNaN(subItem.quantity)
                ? subItem.quantity
                : 0;
            itemTotal += subPrice * subQty;
          });
        }

        return sum + itemTotal;
      }, 0);

      let destinationOrderId = null;
      try {
        const response = await ApiService.getOrderByTableId(destinationTable.id);
        const data = response.data || response;
        if (data && data.id) {
          destinationOrderId = data.id;
        }
      } catch (error) {
        // no existing order
      }

      const orderType = localStorage.getItem('posVersion') || 'horeca';

      const orderData = {
        status: "send_kitchen",
        note: "",
        sub_total: subTotal,
        total: subTotal,
        discount: 0,
        table_id: destinationTable.id,
        order_type: orderType,
        details: (() => {
          const allDetails = [];
          let detailIndex = 0;

          itemsToMove.forEach((item) => {
            const parentDetailIndex = detailIndex;

            allDetails.push({
              product_id: item.id,
              qty: item.quantity,
              total: item.price * item.quantity,
              notes: item.notes || null,
              discount: item.discount || 0,
            });
            detailIndex++;

            if (item.subProducts && item.subProducts.length > 0) {
              item.subProducts.forEach((subItem) => {
                allDetails.push({
                  product_id: subItem.id,
                  qty: subItem.quantity,
                  total: subItem.price * subItem.quantity,
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${subItem.notes || ""
                    }`,
                  discount: 0,
                });
                detailIndex++;
              });
            }
          });

          return allDetails;
        })(),
      };

      if (destinationOrderId) {
        const existingOrderResponse =
          await ApiService.getOrderByTableId(destinationTable.id);
        const existingData = existingOrderResponse.data || existingOrderResponse;
        const existingOrder = existingData;

        const mergedDetails = [
          ...(existingOrder.details || []),
          ...orderData.details,
        ];
        const mergedSubTotal = (existingOrder.sub_total || 0) + subTotal;

        await ApiService.updateOrder(destinationOrderId, {
          ...orderData,
          sub_total: mergedSubTotal,
          total: mergedSubTotal,
          details: mergedDetails,
        });
      } else {
        await ApiService.createOrder(orderData);
      }

      if (destinationTable.status === "available") {
        await ApiService.updatePrTable(destinationTable.id, {
          ...destinationTable,
          status: "reserved",
        });
      }

      const remainingCart = cart.filter((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return !selectedIds.includes(itemCartId);
      });

      setCart(remainingCart);
      setSelectedIds([]);
      setLastAddedId(null);

      if (remainingCart.length === 0 && currentOrderId) {
        await ApiService.deleteOrder(currentOrderId);

        if (selectedTable) {
          await ApiService.updatePrTable(selectedTable.id, {
            ...selectedTable,
            status: "available",
          });
        }

        if (onDeleteAll) {
          onDeleteAll();
        }
      }

      setToastType("success");
      setToastMessage(
        `Successfully moved ${itemsToMove.length} item(s) to Table ${destinationTable.table_no}`
      );
    } catch (error) {
      console.error("Error splitting cart:", error);
      setToastType("error");
      setToastMessage("Failed to move items. Please try again.");
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCart([]);
    setDiscount(0);
    setNote("");
    if (onSelectCustomer) {
      onSelectCustomer(null);
    }
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  const handlePrintReceipt = async () => {
    // Try to print to thermal printers assigned to products    
    if (printers.length > 0 && completedOrderId && cart.length > 0) {
      try {
        // First, check if there's a printer whose name contains "receipt"
        const receiptPrinter = printers.find(p => p.name.toLowerCase().includes('receipt'));

        if (receiptPrinter) {
          // If a "Receipt" printer is found, print only to that printer
          try {
            const response = await printerService.printReceipt(receiptPrinter.id, completedOrderId);
            setToastType("success");
            setToastMessage(`Receipt printed successfully to '${receiptPrinter.name}' printer!`);
          } catch (err) {
            console.error(`❌ Failed to print to 'Receipt' printer:`, err);
            setToastType("error");
            setToastMessage(`Failed to print to '${receiptPrinter.name}' printer: ${err.message || 'Connection failed'}`);
            // Fallback to browser print
            window.print();
          }
        } else {
          // If no "Receipt" printer, use the existing logic
          // Collect all unique printer names from cart items
          const printerNames = new Set();
          cart.forEach(item => {
            if (item.printer1) printerNames.add(item.printer1);
            if (item.printer2) printerNames.add(item.printer2);
            if (item.printer3) printerNames.add(item.printer3);
          });

          // If no printers assigned to products, use browser print
          if (printerNames.size === 0) {
            window.print();
          } else {
            // Print to each assigned printer
            const printPromises = [];
            printerNames.forEach(printerName => {
              // Find printer by name
              const printer = printers.find(p => p.name === printerName);
              if (printer) {
                printPromises.push(
                  printerService.printReceipt(printer.id, completedOrderId)
                    .then(response => {
                      return response;
                    })
                    .catch(err => {
                      console.error(`❌ Failed: ${printer.name}`, err);
                      // Set toast message but don't block the operation
                      setToastType("error");
                      setToastMessage(`Failed to print to ${printer.name}: ${err.message || 'Connection failed'}`);
                      // Return a resolved promise to prevent Promise.allSettled from failing
                      return { success: false, error: err.message };
                    })
                );
              } else {
                console.warn(`⚠️ Printer "${printerName}" not found in printer list`);
              }
            });

            // Wait for all print jobs to complete (or fail)
            const results = await Promise.allSettled(printPromises);
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value && r.value.success !== false).length;
            const failedCount = results.length - successCount;

            if (successCount > 0) {
              setToastType("success");
              setToastMessage(`Receipt sent to ${successCount} printer(s) successfully!`);
            } else {
              setToastType("error");
              setToastMessage("Failed to print to thermal printers. Using browser print.");
              window.print();
            }
          }
        }
      } catch (error) {
        console.error('Error printing to thermal printer:', error);
        setToastType("error");
        setToastMessage("Failed to print to thermal printer. Using browser print.");
        window.print();
      }
    } else {
      // No printer configured or no order, use browser print
      window.print();
    }

    setShowReceipt(false);
    setCart([]);
    setDiscount(0);
    setNote(""); // Reset order-level note after order completion
    if (onSelectCustomer) {
      onSelectCustomer(null);
    }
    setCompletedOrderId(null);

    // Call onOrderComplete to clear table and order selection in parent
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  const handleNumpadInput = (value) => {
    if (value === "C") {
      setCustomQuantity("");
    } else if (value === ".") {
      if (!customQuantity.includes(".")) setCustomQuantity(customQuantity + ".");
    } else {
      setCustomQuantity((prev) => prev + value);
    }
  };

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => {
            setToastMessage("");
            setToastType("error");
          }}
        />
      )}

      <div className="mt-2 mb-2 w-1/6 min-w-[300px] flex flex-col border-l border-pos-border-light h-screen bg-pos-bg-secondary rounded-lg">
        {/* Order Info Section - Compact Design */}
        <div className="px-2 py-1 mt-1 bg-pos-bg-secondary border-b border-pos-border-light">
          <div className="grid grid-cols-3 gap-1 text-xs">
            {/* Table No */}
            <div className="flex flex-col">
              <div className="text-[9px] text-pos-text-muted uppercase mb-0.5 font-medium">Table</div>
              <div className="border border-pos-border-light rounded px-2 py-1 text-center">
                <span className="text-xs text-pos-text-primary font-semibold">
                  {selectedTable ? selectedTable.table_no : '--'}
                </span>
              </div>
            </div>

            {/* Order No */}
            <div className="flex flex-col">
              <div className="text-[9px] text-pos-text-muted uppercase mb-0.5 font-medium">Order</div>
              <div className="border border-pos-border-light rounded px-1 py-1 text-center">
                <span className="text-xs text-pos-text-primary font-semibold">
                  {currentOrderNo ? currentOrderNo : '--'}
                </span>
              </div>
            </div>

            {/* Customer */}
            <div className="flex flex-col">
              <div className="text-[9px] text-pos-text-muted uppercase mb-0.5 font-medium">Customer</div>
              <div className="h-[26px]">
                <CustomerSelector
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={onSelectCustomer}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="px-4 mt-2 bg-pos-bg-secondary border-b border-pos-border-light">
          <div className="grid grid-cols-12 gap-2.5 text-xs text-pos-text-muted font-semibold uppercase">
            <span className="col-span-4">Item</span>
            <span className="col-span-2 flex justify-center items-center">
              Quantity
            </span>
            <span className="col-span-6 ps-5">Total</span>
            <span></span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-[160px] scrollbar-custom">
          {cart.length === 0 ? (
            <div className="text-center text-pos-text-disabled py-10 px-5 text-sm">
              No items in cart
            </div>
          ) : (
            cart.map((item) => {
              const cartItemId = item.cartItemId || `${item.id}_${item.name}`;
              const isSelected = selectedIds.includes(cartItemId);
              const isLastAdded = cartItemId === lastAddedId;

              const bgColor = isLastAdded
                ? "bg-green-500"
                : isSelected
                  ? "bg-green-500"
                  : "bg-blue-500";
              const textColor = "text-dark";

              return (
                <div key={cartItemId} className="mb-1">
                  <div
                    onClick={() => handleSelect(cartItemId)}
                    className={`cursor-pointer ${bgColor}`}
                  >
                    <div className="grid grid-cols-12 gap-3 items-center text-sm py-1 px-2">
                      <div
                        className={`font-light col-span-4 ${textColor} flex items-center gap-1`}
                      >
                        <span>
                          {item.name
                            ? item.name.split(" ").length > 1
                              ? item.name.split(" ").slice(0, 5).join(" ") +
                              (item.name.split(" ").length > 5
                                ? "..."
                                : "")
                              : item.name.length > 20
                                ? item.name.slice(0, 14) + "..."
                                : item.name
                            : ""}
                        </span>
                        {item.notes && (
                          <span className="text-xs" title={item.notes}>
                            📝
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex items-center col-span-2 gap-2 justify-center ${textColor}`}
                      >
                        <button
                          className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-sm font-semibold justify-center hover:bg-pos-interactive-hover`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQuantity(cartItemId, item.quantity - 1);
                          }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-sm justify-center hover:bg-pos-interactive-hover`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQuantity(cartItemId, item.quantity + 1);
                          }}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex gap-2 col-span-6 items-end ps-4 text-center">
                        <span className="text-xs line-through">
                          {item.originalPrice
                            ? formatAmount(item.originalPrice * item.quantity)
                            : ""}
                        </span>

                        {item.appliedDiscount && (
                          <span className="text-xs italic text-white">
                            {item.appliedDiscount}
                          </span>
                        )}

                        <span className={`text-xs mt-1 ${textColor}`}>
                          €{formatAmount(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {item.subProducts && item.subProducts.length > 0 && (
                      <div className="pb-1">
                        {item.subProducts.map((subItem, subIndex) => {
                          const isFree =
                            !subItem.price || subItem.price === 0;

                          return (
                            <div
                              key={subItem.cartItemId}
                              className={`grid grid-cols-12 gap-3 items-center text-xs py-0.5 px-2 ${textColor}`}
                            >
                              <div className="col-span-4 flex items-center gap-1 pl-4">
                                <span className="font-light">
                                  {subItem.name}
                                </span>
                              </div>

                              <div className="col-span-2 flex items-center gap-2 justify-center">
                                <button
                                  className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-xs font-semibold justify-center hover:bg-pos-interactive-hover`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newCart = [...cart];
                                    const parentIndex = cart.findIndex(
                                      (c) => c.cartItemId === cartItemId
                                    );
                                    if (
                                      parentIndex !== -1 &&
                                      newCart[parentIndex].subProducts[subIndex]
                                    ) {
                                      if (
                                        newCart[parentIndex].subProducts[subIndex]
                                          .quantity > 1
                                      ) {
                                        newCart[parentIndex].subProducts[
                                          subIndex
                                        ].quantity -= 1;
                                      } else {
                                        newCart[parentIndex].subProducts.splice(
                                          subIndex,
                                          1
                                        );
                                      }
                                      setCart(newCart);
                                    }
                                  }}
                                >
                                  -
                                </button>
                                <span>{subItem.quantity}</span>
                                <button
                                  className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-xs justify-center hover:bg-pos-interactive-hover`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newCart = [...cart];
                                    const parentIndex = cart.findIndex(
                                      (c) => c.cartItemId === cartItemId
                                    );
                                    if (
                                      parentIndex !== -1 &&
                                      newCart[parentIndex].subProducts[subIndex]
                                    ) {
                                      newCart[parentIndex].subProducts[
                                        subIndex
                                      ].quantity += 1;
                                      setCart(newCart);
                                    }
                                  }}
                                >
                                  +
                                </button>
                              </div>

                              <div className="col-span-4 flex items-center gap-2 justify-center">
                                {!isFree && (
                                  <span>
                                    €
                                    {formatAmount(
                                      subItem.price * subItem.quantity
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasSelection && (
          <div className="bg-green-600 px-3 py-1 border-t border-green-700">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span className="text-sm font-semibold">
                  {selectedIds.length} item
                  {selectedIds.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedIds([]);
                  setLastAddedId(null);
                }}
                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="bg-pos-bg-secondary px-2 py-1 border-t border-pos-border-light">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-pos-text-disabled uppercase">
              Total
            </div>
            <div className="text-lg font-bold text-pos-text-secondary">
              {formatAmount(calculateTotal() - discount)}
            </div>

            <input
              type="text"
              placeholder="Add Quantity"
              value={customQuantity}
              onChange={(e) => setCustomQuantity(e.target.value)}
              className="max-w-[7rem] text-center py-1 px-2 bg-white text-black text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 p-1 bg-pos-bg-secondary border-t border-pos-border-light">
          <button
            onClick={handleClearSelected}
            disabled={!hasSelection}
            className={`bg-pos-interactive-primary text-pos-text-secondary py-2 ${!hasSelection
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-pos-interactive-hover"
              }`}
          >
            🗑️
          </button>

          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={cart.length === 0}
            className={`bg-pos-interactive-primary text-pos-text-secondary py-1 ${cart.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-pos-interactive-hover"
              }`}
          >
            <span className="relative inline-block">
              🛒
              <span className="absolute -top-1 -right-1 text-red-500 font-bold">
                ✕
              </span>
            </span>
          </button>

          <button
            onClick={handleNotes}
            disabled={cart.length === 0}
            className={`bg-pos-interactive-primary text-pos-text-secondary py-1 ${cart.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-pos-interactive-hover"
              }`}
          >
            📝
          </button>

          <button
            onClick={() => setShowDiscountModal(true)}
            className="bg-pos-interactive-primary text-pos-text-secondary py-2 hover:bg-pos-interactive-hover disabled:opacity-50"
            disabled={isProcessing || cart.length === 0}
          >
            🏷️
          </button>

          <button
            onClick={handleSplitCart}
            disabled={!hasSelection || !selectedTable}
            className={`relative text-pos-text-secondary py-2 ${!hasSelection || !selectedTable
              ? "bg-pos-interactive-primary opacity-50 cursor-not-allowed"
              : "bg-pos-interactive-primary hover:bg-pos-interactive-hover"
              }`}
            title="Move selected items to another table"
          >
            <span className="text-lg">🔀</span>
            {hasSelection && (
              <span className="absolute -top-1 -right-1 bg-white text-green-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {selectedIds.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1">
          {["C", "7", "8", "9", ".", "4", "5", "6", "0", "1", "2", "3"].map(
            (val) => (
              <button
                key={val}
                onClick={() => handleNumpadInput(val)}
                className={`aspect-auto flex items-center py-1 justify-center transition-all duration-150 
        ${val === "C"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-pos-bg-quaternary hover:bg-pos-bg-tertiary text-white active:scale-95"
                  }`}
              >
                {val}
              </button>
            )
          )}
        </div>

        {/* Payment Buttons - Top Row: Cash, Card, On Hold */}
        <div className="grid grid-cols-3 gap-1 px-1 mb-1">
          {/* Cash */}
          <button
            className="bg-pos-bg-primary border border-pos-border-primary aspect-auto flex items-center py-1 justify-center hover:bg-pos-interactive-hover disabled:opacity-50"
            onClick={handleCashPayment}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? "Processing..." : "Cash"}
          </button>

          {/* Card */}
          <button
            className="bg-pos-bg-primary border border-pos-border-primary aspect-auto flex items-center py-1 justify-center hover:bg-pos-interactive-hover disabled:opacity-50"
            onClick={handleCardPayment}
            disabled={isProcessing || cart.length === 0}
          >
            Card
          </button>

          {/* On Hold */}
          <button
            className="bg-orange-500 border border-orange-600 text-white aspect-auto flex items-center py-1 justify-center hover:bg-orange-600 disabled:opacity-50"
            onClick={handleOnHold}
            disabled={isProcessing || cart.length === 0}
          >
            On Hold
          </button>
        </div>

        {/* Payment Buttons - Bottom Row: Cashmatic, Payworld */}
        <div className="grid grid-cols-2 gap-1 px-1 mb-2">
          {/* Cashmatic */}
          <button
            className="bg-pos-bg-primary border border-pos-border-primary text-pos-text-primary aspect-auto flex items-center py-1 justify-center hover:bg-pos-interactive-hover disabled:opacity-50"
            onClick={handleCashmaticPayment}
            disabled={isProcessing || cart.length === 0}
          >
            Cashmatic
          </button>

          {/* Payworld A35 */}
          <button
            className="bg-pos-bg-primary border border-pos-border-primary text-pos-text-primary aspect-auto flex items-center py-1 justify-center hover:bg-pos-interactive-hover disabled:opacity-50"
            onClick={handlePayworldPayment}
            disabled={isProcessing || cart.length === 0}
          >
            Payworld
          </button>
        </div>

        {/* Cashmatic Modal */}
        {showCashmaticModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold text-pos-text-primary mb-4">
                Cashmatic Payment
              </h2>
              <div className="space-y-2 text-pos-text-primary text-sm">
                <div className="flex justify-between">
                  <span>Requested:</span>
                  <span>€ {formatAmount(cashmaticInfo?.requested)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inserted:</span>
                  <span>€ {formatAmount(cashmaticInfo?.inserted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change dispensed by machine:</span>
                  <span>€ {formatAmount(cashmaticInfo?.dispensed)}</span>
                </div>
                {cashmaticInfo?.notDispensed > 0 && (
                  <div className="flex justify-between bg-yellow-100 p-2 rounded border-l-4 border-yellow-500">
                    <span className="font-semibold text-yellow-800">Manual change required:</span>
                    <span className="font-bold text-yellow-800">€ {formatAmount(cashmaticInfo?.notDispensed)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>
                    {cashmaticInfo.state === "IDLE"
                      ? "Ready for next customer"
                      : cashmaticInfo.state === "RUNNING" ||
                        cashmaticInfo.state === "IN_PROGRESS"
                        ? "Payment in progress..."
                        : cashmaticInfo.state === "PAID"
                          ? "Amount received – processing change"
                          : cashmaticInfo.state === "FINISHED_MANUAL"
                            ? "Payment completed – give manual change"
                            : cashmaticInfo.state === "FINISHED"
                              ? "Payment completed"
                              : cashmaticInfo.state === "CANCELLED"
                                ? "Cancelled"
                                : cashmaticInfo.state === "ERROR" ||
                                  cashmaticInfo.state === "FAILED"
                                  ? "Error – check Cashmatic"
                                  : "Unknown status"}
                  </span>
                </div>
              </div>
             {(cashmaticInfo.state !== "PAID") &&  
             <div className="flex justify-center items-center w-full">
                <button 
                    className="mt-4 px-4 py-2 rounded bg-red-500 text-white items-center hover:bg-red-600"
                    onClick={handleCancelCashmatic}
                    disabled={cashmaticInfo.state === "CANCELLED"}
                  >
                    Cancel Payment
                  </button>
                </div>
                }
              {/* Manual Change Alert */}
              {(cashmaticInfo.state === "FINISHED_MANUAL" || 
                (cashmaticInfo.state === "FINISHED" && cashmaticInfo?.notDispensed > 0)) && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
                  <div className="flex items-center">
                    <div className="text-red-600 mr-2">⚠️</div>
                    <div>
                      <p className="text-red-800 font-semibold">Action Required!</p>
                      <p className="text-red-700 text-sm">
                        Please give €{formatAmount(cashmaticInfo?.notDispensed)} change to the customer manually.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* <div className="mt-6 flex justify-end gap-2"> */}
                {/* Print Manual Change Receipt Button */}
                {/* {cashmaticInfo?.notDispensed > 0 && 
                 (cashmaticInfo.state === "FINISHED" || cashmaticInfo.state === "FINISHED_MANUAL") && (
                  <button
                    className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={() => {
                      if (manualChangeReceipt) { */}
                        // Print manual change receipt
                        {/* const receiptContent = `
                          MANUAL CHANGE RECEIPT
                          =====================
                          Order #: ${manualChangeReceipt.orderNo || 'N/A'}
                          Table: ${manualChangeReceipt.tableNo || 'N/A'}
                          Amount Due: €${formatAmount(manualChangeReceipt.manualChangeAmount)}
                          Reason: ${manualChangeReceipt.reason}
                          Time: ${new Date(manualChangeReceipt.timestamp).toLocaleString()}
                          Cashier: ${manualChangeReceipt.cashier}
                          =====================
                        `; */}
                        
                        // Create a temporary element for printing
                        {/* const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
                          <html>
                            <head><title>Manual Change Receipt</title></head>
                            <body style="font-family: monospace; white-space: pre-line;">
                              ${receiptContent}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                        printWindow.close();
                      }
                    }}
                  >
                    Print Change Receipt
                  </button>
                )} */}
                
                {/* { (
                    <button
                      className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                      onClick={async () => {
                        setShowCashmaticModal(false);
                        console.log("completed order id : ", completedOrderId);
                        // Print receipt if order is completed
                        
                      }}
                    >
                      Close
                    </button>
                  )}
              </div> */}
            </div>
          </div>
        )}

        {/* Payworld Modal */}
        {showPayworldModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold text-pos-text-primary mb-4">
                Payworld / PAX A35 Payment
              </h2>

              <div className="space-y-2 text-pos-text-primary text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>€ {formatAmount(calculateTotal() - discount)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>
                    {payworldStatus.state === "IN_PROGRESS"
                      ? "Payment in progress on terminal..."
                      : payworldStatus.state === "APPROVED"
                        ? "Payment approved."
                        : payworldStatus.state === "DECLINED"
                          ? "Payment declined."
                          : payworldStatus.state === "CANCELLED"
                            ? "Payment cancelled."
                            : payworldStatus.state === "ERROR"
                              ? "Error during payment."
                              : "Ready."}
                  </span>
                </div>

                {payworldStatus.message && (
                  <div className="mt-2 text-xs text-pos-text-secondary whitespace-pre-line">
                    {payworldStatus.message}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {payworldStatus.state === "IN_PROGRESS" && (
                  <button
                    className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                    onClick={handleAbortPayworld}
                  >
                    Cancel Payment
                  </button>
                )}

                {(payworldStatus.state === "APPROVED" ||
                  payworldStatus.state === "DECLINED" ||
                  payworldStatus.state === "CANCELLED" ||
                  payworldStatus.state === "ERROR") && (
                    <button
                      className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                      onClick={() => {
                        setShowPayworldModal(false);
                        setPayworldStatus({
                          state: "IDLE",
                          message: "",
                          details: null,
                        });
                      }}
                    >
                      Close
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={showDeleteAllModal}
          onClose={() => setShowDeleteAllModal(false)}
          onConfirm={() => {
            handleDeleteAllConfirm();
            setShowDeleteAllModal(false);
          }}
          title="Delete Order"
          message={`This order has ${totalProductCount()} product(s). Do you want to delete?`}
          confirmText="Yes, Delete"
          cancelText="No"
          type="danger"
        />

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          total={calculateTotal() - discount}
          onConfirm={handlePaymentConfirm}
          defaultPaymentMethod={selectedPaymentMethod}
        />


        {showReceipt && (
          <ReceiptModal
            cart={cart}
            total={calculateTotal() - discount}
            subTotal={calculateTotal()}
            discount={discount}
            onClose={handleCloseReceipt}
            onPrint={handlePrintReceipt}
          />
        )}

        {showDiscountModal && (
          <DiscountModal
            title={
              selectedIds.length === 0
                ? "Whole Order"
                : selectedIds.length === 1
                  ? cart.find((item) => {
                    const itemCartId =
                      item.cartItemId || `${item.id}_${item.name}`;
                    return itemCartId === selectedIds[0];
                  })?.name
                  : cart
                    .filter((item) => {
                      const itemCartId =
                        item.cartItemId || `${item.id}_${item.name}`;
                      return selectedIds.includes(itemCartId);
                    })
                    .map((i) => i.name)
                    .join(", ")
            }
            basePrice={
              selectedIds.length === 0
                ? cart.reduce((sum, i) => {
                  const priceToUse = i.originalPrice || i.price;
                  return sum + priceToUse * i.quantity;
                }, 0)
                : cart
                  .filter((item) => {
                    const itemCartId =
                      item.cartItemId || `${item.id}_${item.name}`;
                    return selectedIds.includes(itemCartId);
                  })
                  .reduce((sum, i) => {
                    const priceToUse = i.originalPrice || i.price;
                    return sum + priceToUse * i.quantity;
                  }, 0)
            }
            onClose={() => setShowDiscountModal(false)}
            onConfirm={({ finalPrice, mode, rawInput }) => {
              const discountValueInput = parseFloat(rawInput);
              const discountAmount = isNaN(discountValueInput)
                ? 0
                : discountValueInput;

              if (mode === "percentage" && discountAmount > 100) {
                setToastMessage("Percentage discount cannot exceed 100%");
                return;
              }

              if (selectedIds.length === 0) {
                const totalCartValueOriginal = cart.reduce((sum, item) => {
                  const priceToUse = item.originalPrice || item.price;
                  return sum + priceToUse * item.quantity;
                }, 0);

                if (mode === "amount" && discountAmount > totalCartValueOriginal) {
                  setToastMessage("Discount amount cannot exceed the total");
                  return;
                }

                const itemsWithSpecificDiscount = cart.filter(
                  (item) =>
                    item.discount &&
                    item.discount > 0 &&
                    item.discountType === "specific"
                );

                const itemsToApplyDiscount = cart.filter(
                  (item) =>
                    !item.discount ||
                    item.discount === 0 ||
                    item.discountType === "whole"
                );

                const totalToApplyDiscount = itemsToApplyDiscount.reduce(
                  (sum, item) => {
                    const priceToUse = item.originalPrice || item.price;
                    return sum + priceToUse * item.quantity;
                  },
                  0
                );

                if (itemsToApplyDiscount.length === 0) {
                  setToastMessage(
                    "All items already have a specific discount applied"
                  );
                  return;
                }

                setCart((prev) =>
                  prev.map((item) => {
                    if (
                      item.discount &&
                      item.discount > 0 &&
                      item.discountType === "specific"
                    ) {
                      return item;
                    }

                    const originalPricePerUnit =
                      item.originalPrice || item.price;
                    const originalTotal = originalPricePerUnit * item.quantity;
                    let discountValue = 0;

                    if (mode === "percentage") {
                      discountValue = (originalTotal * discountAmount) / 100;
                    } else {
                      const itemProportion = originalTotal / totalToApplyDiscount;
                      discountValue = discountAmount * itemProportion;
                    }

                    const updatedTotal = Math.max(
                      0,
                      originalTotal - discountValue
                    );
                    return {
                      ...item,
                      originalPrice: originalPricePerUnit,
                      price: updatedTotal / item.quantity,
                      appliedDiscount:
                        mode === "percentage"
                          ? `${discountAmount}%`
                          : `€${formatAmount(discountValue)}`,
                      discount: discountValue,
                      discountType: "whole",
                    };
                  })
                );
              } else {
                const selectedTotal = cart
                  .filter((item) => {
                    const itemCartId =
                      item.cartItemId || `${item.id}_${item.name}`;
                    return selectedIds.includes(itemCartId);
                  })
                  .reduce((sum, i) => {
                    const priceToUse = i.originalPrice || i.price;
                    return sum + priceToUse * i.quantity;
                  }, 0);

                if (mode === "amount" && discountAmount > selectedTotal) {
                  setToastMessage(
                    "Discount amount cannot exceed the selected items total"
                  );
                  return;
                }

                setCart((prev) =>
                  prev.map((item) => {
                    const itemCartId =
                      item.cartItemId || `${item.id}_${item.name}`;
                    if (selectedIds.includes(itemCartId)) {
                      const originalPricePerUnit =
                        item.originalPrice || item.price;
                      const originalTotal =
                        originalPricePerUnit * item.quantity;
                      let discountValue = 0;

                      if (mode === "percentage") {
                        discountValue =
                          (originalTotal * discountAmount) / 100;
                      } else {
                        discountValue = discountAmount;
                      }

                      const updatedTotal = Math.max(
                        0,
                        originalTotal - discountValue
                      );
                      return {
                        ...item,
                        originalPrice: originalPricePerUnit,
                        price: updatedTotal / item.quantity,
                        appliedDiscount:
                          mode === "percentage"
                            ? `${discountAmount}%`
                            : `€${formatAmount(discountValue)}`,
                        discount: discountValue,
                        discountType: "specific",
                      };
                    }
                    return item;
                  })
                );

                setSelectedIds([]);
                setLastAddedId(null);
              }
              setShowDiscountModal(false);
            }}
          />
        )}

        <NoteModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          onConfirm={handleNoteConfirm}
          title={noteModalTitle}
          currentNote={currentNoteValue}
        />

        {/* Manual Change Modal */}
        {showManualChangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Manual Change Required
                  </h2>
                  <p className="text-gray-600 mb-4">
                    The Cashmatic machine could not dispense the full change amount.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-lg font-semibold text-yellow-800">
                      Manual Amount to Pay: €{formatAmount(manualChangeAmount)}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please give this amount to the customer manually
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleManualChangePayment}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    ✓ Manual Amount Paid - Print Receipt
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowManualChangeModal(false);
                      setShowCashmaticModal(true); // Go back to Cashmatic modal
                    }}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderPanel;
