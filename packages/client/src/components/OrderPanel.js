import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal";
import NoteModal from "./NoteModal";
import Toast from "./Toast";
import CustomerSelector from "./CustomerSelector";
import ApiService from "../services/api";
import { printerService } from "../services/printerService";
import cashmaticService from "../services/cashmaticService";
import payworldService from "../services/payworldService";

const OrderPanel = ({ cart, setCart, onUpdateQuantity, customQuantity, setCustomQuantity, currentOrderId, currentOrderNo, selectedTable, onOrderComplete, onDeleteAll, onSplitCart, selectedCustomer, onSelectCustomer, onRefreshHoldCount }) => {
  

const formatAmount = (value) => {
  const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return num.toFixed(2);
};
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [cashmaticInfo, setCashmaticInfo] = useState({
    requested: 0,
    inserted: 0,
    dispensed: 0,
    notDispensed: 0,
    state: null,
  });
  const [showCashmaticModal, setShowCashmaticModal] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  const [printers, setPrinters] = useState([]);
  const [completedOrderId, setCompletedOrderId] = useState(null);



  const [selectedIds, setSelectedIds] = useState([]);
  const [lastAddedId, setLastAddedId] = useState(null);
  const prevCartLengthRef = useRef(cart.length);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalTitle, setNoteModalTitle] = useState("");
  const [currentNoteValue, setCurrentNoteValue] = useState("");

  // Payworld state
  const [showPayworldModal, setShowPayworldModal] = useState(false);
  const [payworldStatus, setPayworldStatus] = useState({
    state: "IDLE",
    message: "",
    details: null,
  });

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

  // Cleanup services on unmount
  useEffect(() => {
    return () => {
      if (cashmaticService.isPaymentInProgress()) {
        cashmaticService.cleanup();
      }
      if (payworldService.isPaymentInProgress()) {
        payworldService.cleanup();
      }
    };
  }, []);

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

  const calculateTotal = () =>
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
    }, 0);

  const handlePayment = (paymentMethod = "cash") => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod(paymentMethod);
    setShowPaymentModal(true);
  };

  const handleCashPayment = () => handlePayment("cash");

  // Payworld flow using centralized service
  const startPayworldFlow = async () => {
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
        "Order total must be greater than zero"
      );
      return;
    }

    setShowPayworldModal(true);
    setIsProcessing(true);

    try {
      await payworldService.startPayment(total, {
        onStatusUpdate: (status) => {
          setPayworldStatus(status);
        },
        onSuccess: async (result) => {
          setToastType("success");
          setToastMessage(result.message);

          await handlePaymentConfirm({
            totalPaid: result.totalPaid,
            cashAmount: result.cashAmount,
            cardAmount: result.cardAmount,
            changeDue: result.changeDue,
          });

          setShowPayworldModal(false);
          setIsProcessing(false);
        },
        onError: (error) => {
          setPayworldStatus(error);
          setToastType("error");
          setToastMessage(error.message);
          setIsProcessing(false);
        },
        onCancel: (result) => {
          setPayworldStatus(result);
          setToastType("info");
          setToastMessage(result.message);
          setIsProcessing(false);
        },
        onDeclined: (result) => {
          setPayworldStatus(result);
          setToastType("error");
          setToastMessage(result.message);
          setIsProcessing(false);
        },
      });
    } catch (err) {
      console.error("Payworld start error:", err);
      setToastType("error");
      setToastMessage("Payworld betaling kon niet gestart worden.");
      setShowPayworldModal(false);
      setIsProcessing(false);
    }
  };

  // Cancel Payworld payment
  const handleAbortPayworld = async () => {
    try {
      await payworldService.cancelPayment();
    } catch (err) {
      console.error("Error cancelling Payworld:", err);
      setToastType("error");
      setToastMessage("Annuleren op Payworld-terminal mislukt.");
    }
  };

  const handleCardPayment = () => {
    if (cart.length === 0) return;

    const storedTerminal = localStorage.getItem("pos_card_terminal") || "none";

    // Viva flow
    if (storedTerminal === "viva") {
      const subTotal = calculateTotal();
      const total = subTotal - discount;

      if (total <= 0) {
        setToastType("error");
        setToastMessage(
          "Order total must be greater than zero for Viva payment."
        );
        return;
      }

      let vivaConfig = { merchantId: "", terminalId: "" };
      try {
        const storedConfig = localStorage.getItem("pos_viva_config");
        if (storedConfig) {
          vivaConfig = JSON.parse(storedConfig);
        }
      } catch (e) {
        console.error("Failed to parse Viva config from localStorage", e);
      }

      if (!vivaConfig.merchantId || !vivaConfig.terminalId) {
        setToastType("error");
        setToastMessage(
          "Viva settings are incomplete. Please configure Merchant ID and Terminal ID in Settings -> Payment."
        );
        return;
      }

      setIsProcessing(true);
      setToastType("info");
      setToastMessage(
        "Viva betaling gestart. Volg de instructies op de terminal..."
      );

      ApiService.startVivaPayment({
        amount: total,
        merchantId: vivaConfig.merchantId,
        terminalId: vivaConfig.terminalId,
        orderReference: null,
      })
        .then(async (res) => {
          const data = res?.data || res;
          if (!data || data.ok !== true) {
            console.error(
              "Viva payment failed or returned non-ok response:",
              data
            );
            setToastType("error");
            setToastMessage(
              "Viva betaling mislukt. Controleer de terminal of probeer opnieuw."
            );
            return;
          }

          try {
            await handlePaymentConfirm({
              totalPaid: total,
              cashAmount: 0,
              cardAmount: total,
              changeDue: 0,
            });
            setToastType("success");
            setToastMessage("Viva betaling voltooid.");
          } catch (error) {
            console.error("Error finalizing Viva payment:", error);
            setToastType("error");
            setToastMessage(
              "Viva betaling mislukt bij het afronden van de bestelling."
            );
          }
        })
        .catch((error) => {
          console.error("Error while calling Viva payment endpoint:", error);
          setToastType("error");
          setToastMessage(
            "Viva betaling mislukt. Controleer verbinding met server of Viva API."
          );
        })
        .finally(() => {
          setIsProcessing(false);
        });

      return;
    }

    // Payworld via gekozen terminal
    if (storedTerminal === "payworld") {
      startPayworldFlow();
      return;
    }

    // Default: card modal
    handlePayment("card");
  };

  const handleCashmaticPayment = async () => {
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

    setIsProcessing(true);
    setShowCashmaticModal(true);
    setToastType("info");
    setToastMessage("Cashmatic payment started. Please pay at the machine.");

    try {
      await cashmaticService.startPayment(total, {
        onStatusUpdate: (info) => {
          setCashmaticInfo(info);
        },
        onSuccess: async (result) => {
          setToastType("success");
          setToastMessage(result.message);

          await handlePaymentConfirm({
            totalPaid: result.totalPaid,
            cashAmount: result.cashAmount,
            cardAmount: result.cardAmount,
            changeDue: result.changeDue,
          });

          setIsProcessing(false);

          if (!result.manualChangeRequired) {
            setShowCashmaticModal(false);
          }
        },
        onError: (error) => {
          setCashmaticInfo(error.info || {
            requested: total,
            inserted: 0,
            dispensed: 0,
            notDispensed: 0,
            state: "ERROR",
          });
          setIsProcessing(false);
          setToastType("error");
          setToastMessage(error.message);
        },
        onCancel: (result) => {
          setCashmaticInfo(result.info || {
            requested: total,
            inserted: 0,
            dispensed: 0,
            notDispensed: 0,
            state: "CANCELLED",
          });
          setIsProcessing(false);
          setToastType("error");
          setToastMessage(result.message);
        },
      });
    } catch (error) {
      console.error("Error starting Cashmatic payment:", error);
      setIsProcessing(false);
      setToastType("error");
      setToastMessage("Failed to start Cashmatic payment.");
      setShowCashmaticModal(false);
    }
  };

  const handlePayworldPayment = () => {
    startPayworldFlow();
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

      const orderData = {
        status: "on_hold",
        note,
        sub_total: subTotal,
        total,
        discount,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        table_id: selectedTable ? selectedTable.id : null,
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
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${
                    subItem.notes || ""
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
        setShowToast(true);
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

  const handlePaymentConfirm = async (paymentData) => {
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

      const orderData = {
        status: "completed",
        note,
        sub_total: subTotal,
        total,
        discount,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
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
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${
                    subItem.notes || ""
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
      
      // Show specific error for inventory issues
      if (error.message && error.message.includes('Insufficient inventory')) {
        const errorDetails = error.details ? 
          error.details.map(d => `• ${d.product_name}: requested ${d.requested}, available ${d.available}`).join('\n') : 
          error.message;
        
        alert(`⚠️ Insufficient Inventory\n\n${errorDetails}\n\nPlease adjust quantities and try again.`);
      } else {
        alert("Failed to process payment. Please try again.");
      }
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
        // geen bestaande order
      }

      const orderData = {
        status: "send_kitchen",
        note: "",
        sub_total: subTotal,
        total: subTotal,
        discount: 0,
        table_id: destinationTable.id,
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
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${
                    subItem.notes || ""
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
              <div className="bg-pos-bg-tertiary border border-pos-border-secondary rounded px-2 py-1 text-center">
                <span className="text-xs text-pos-text-primary font-semibold">
                  {selectedTable ? selectedTable.table_no : '--'}
                </span>
              </div>
            </div>
            
            {/* Order No */}
            <div className="flex flex-col">
              <div className="text-[9px] text-pos-text-muted uppercase mb-0.5 font-medium">Order</div>
              <div className="bg-pos-bg-tertiary border border-pos-border-secondary rounded px-2 py-1 text-center">
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
        <div className="px-4 mt-2 bg-pos-bg-secondary border-b border-pos-border-light rounded-lg">
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
          <div className="bg-green-600 px-3 py-2 border-t border-green-700">
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
            className={`bg-pos-interactive-primary text-pos-text-secondary py-2 ${
              !hasSelection
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-pos-interactive-hover"
            }`}
          >
            🗑️
          </button>

          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={cart.length === 0}
            className={`bg-pos-interactive-primary text-pos-text-secondary py-1 ${
              cart.length === 0
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
            className={`bg-pos-interactive-primary text-pos-text-secondary py-1 ${
              cart.length === 0
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
            className={`relative text-pos-text-secondary py-2 ${
              !hasSelection || !selectedTable
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
        ${
          val === "C"
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
                Cashmatic betaling
              </h2>
              <div className="space-y-2 text-pos-text-primary text-sm">
                <div className="flex justify-between">
                  <span>Te ontvangen:</span>
                  <span>€ {formatAmount(cashmaticInfo?.requested)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reeds betaald:</span>
                  <span>€ {formatAmount(cashmaticInfo?.inserted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wisselgeld (theoretisch):</span>
                  <span>
                    €{" "}
                    {formatAmount(
                      Math.max(
                        (cashmaticInfo?.inserted ?? 0) -
                          (cashmaticInfo?.requested ?? 0),
                        0
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Wisselgeld via Cashmatic:</span>
                  <span>€ {formatAmount(cashmaticInfo?.dispensed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wisselgeld manueel:</span>
                  <span>€ {formatAmount(cashmaticInfo?.notDispensed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>
                    {cashmaticInfo.state === "IDLE"
                      ? "Gereed voor volgende klant"
                      : cashmaticInfo.state === "RUNNING" ||
                        cashmaticInfo.state === "IN_PROGRESS"
                      ? "Betaling bezig..."
                      : cashmaticInfo.state === "PAID"
                      ? "Bedrag ontvangen – wisselgeld wordt uitgegeven"
                      : cashmaticInfo.state === "FINISHED_MANUAL"
                      ? "Betaling afgerond – geef manueel wisselgeld"
                      : cashmaticInfo.state === "FINISHED"
                      ? "Betaling afgerond"
                      : cashmaticInfo.state === "CANCELLED"
                      ? "Geannuleerd"
                      : cashmaticInfo.state === "ERROR" ||
                        cashmaticInfo.state === "FAILED"
                      ? "Fout – controleer Cashmatic"
                      : "Onbekende status"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {(cashmaticInfo.state === "FINISHED" ||
                  cashmaticInfo.state === "FINISHED_MANUAL" ||
                  cashmaticInfo.state === "CANCELLED" ||
                  cashmaticInfo.state === "ERROR") && (
                  <button
                    className="px-4 py-2 rounded bg-pos-bg-secondary border border-pos-border-primary text-pos-text-primary hover:bg-pos-interactive-hover"
                    onClick={() => setShowCashmaticModal(false)}
                  >
                    Sluiten
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payworld Modal */}
        {showPayworldModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-pos-bg-primary border border-pos-border-primary rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold text-pos-text-primary mb-4">
                Payworld / PAX A35 betaling
              </h2>

              <div className="space-y-2 text-pos-text-primary text-sm">
                <div className="flex justify-between">
                  <span>Bedrag:</span>
                  <span>€ {formatAmount(calculateTotal() - discount)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>
                    {payworldStatus.state === "IN_PROGRESS"
                      ? "Betaling bezig op de terminal..."
                      : payworldStatus.state === "APPROVED"
                      ? "Betaling goedgekeurd."
                      : payworldStatus.state === "DECLINED"
                      ? "Betaling geweigerd."
                      : payworldStatus.state === "CANCELLED"
                      ? "Betaling geannuleerd."
                      : payworldStatus.state === "ERROR"
                      ? "Fout tijdens de betaling."
                      : "Gereed."}
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
                    Actie beëindigen
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
                    Sluiten
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
      </div>
    </>
  );
};

export default OrderPanel;
