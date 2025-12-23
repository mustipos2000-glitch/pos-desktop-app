import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import MessageModal from '../MessageModal';
import IconButton from '../IconButton';
import { useMessageModal } from '../../hooks/useMessageModal';
import PaymentTerminalManager from '../PaymentTerminalManager';
import KeypadNumpad from '../KeypadNumpad';


const SettingsModal = ({ onClose, initialTab = 'general', limitedTabs = null }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [rolePermissions, setRolePermissions] = useState({
    'Super Admin': { admin: true, settings: true, reports: true },
    'Admin': { admin: false, settings: false, reports: false },
    'User': { admin: false, settings: false, reports: false }
  });
  const [printers, setPrinters] = useState([]);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [printerForm, setPrinterForm] = useState({
    name: '',
    type: 'EPSON',
    connection_string: 'tcp://192.168.1.100:9100',
    is_main: false
  });
  const { messageModal, showError, showInfo, closeModal } = useMessageModal();
  const [printerFormErrors, setPrinterFormErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    printerId: null,
    printerName: ''
  });
  const [testingPrinter, setTestingPrinter] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const [showKeypad, setShowKeypad] = useState(true);
  const [activeField, setActiveField] = useState(null);
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'My POS Store',
    taxRate: '8',
    currency: 'USD',
    language: 'en'
  });
  
  // Member Fee states
  const [memberFees, setMemberFees] = useState([]);
  const [showAddMemberFee, setShowAddMemberFee] = useState(false);
  const [editingMemberFee, setEditingMemberFee] = useState(null);
  const [memberFeeForm, setMemberFeeForm] = useState({ member_fee: '' });
  const [memberFeeFormErrors, setMemberFeeFormErrors] = useState({});
  const [deleteMemberFeeConfirmation, setDeleteMemberFeeConfirmation] = useState({
    isOpen: false,
    memberFeeId: null
  });
  
  // Rental Charge states
  const [rentalCharges, setRentalCharges] = useState([]);
  const [showAddRentalCharge, setShowAddRentalCharge] = useState(false);
  const [editingRentalCharge, setEditingRentalCharge] = useState(null);
  const [rentalChargeForm, setRentalChargeForm] = useState({ rental_charge: '' });
  const [rentalChargeFormErrors, setRentalChargeFormErrors] = useState({});
  const [deleteRentalChargeConfirmation, setDeleteRentalChargeConfirmation] = useState({
    isOpen: false,
    rentalChargeId: null
  });
  
  // Members list states
  const [members, setMembers] = useState([]);
  const [membersWithPayments, setMembersWithPayments] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  // Get version from localStorage
  const version = localStorage.getItem('posVersion');

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'permissions') {
      fetchRolePermissions();
    }
    if (activeTab === 'printer') {
      fetchPrinters();
    }
    if (activeTab === 'memberFee' && version === 'mosque') {
      fetchMemberFees();
    }
    if (activeTab === 'rentalCharge' && version === 'mosque') {
      fetchRentalCharges();
    }
    if (activeTab === 'members' && version === 'mosque') {
      fetchMembersWithPayments();
    }
  }, [activeTab, isSuperAdmin, version]);

  const fetchPrinters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/printers');
      const result = await response.json();
      setPrinters(result.data || []);
    } catch (error) {
      console.error('Error fetching printers:', error);
    }
  };

  const fetchMemberFees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/member-fees');
      const result = await response.json();
      setMemberFees(result.data || []);
    } catch (error) {
      console.error('Error fetching member fees:', error);
    }
  };

  const fetchRentalCharges = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rental-charges');
      const result = await response.json();
      setRentalCharges(result.data || []);
    } catch (error) {
      console.error('Error fetching rental charges:', error);
    }
  };

  const fetchMembersWithPayments = async () => {
    setLoadingMembers(true);
    try {
      // Fetch all members
      const membersResponse = await fetch('http://localhost:5000/api/members');
      const membersResult = await membersResponse.json();
      const allMembers = membersResult || [];

      // Fetch all mosque payments
      const paymentsResponse = await fetch('http://localhost:5000/api/mosque/payments');
      const paymentsResult = await paymentsResponse.json();
      const allPayments = paymentsResult.data || [];

      // Combine members with their membership payments
      const membersWithPaymentData = allMembers.map(member => {
        // Find all membership payments for this member
        const membershipPayments = allPayments.filter(
          payment => payment.member_id === member.id && payment.payment_type === 'membership'
        );

        // Get the most recent membership payment
        const latestPayment = membershipPayments.length > 0
          ? membershipPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          : null;

        return {
          ...member,
          hasPayment: membershipPayments.length > 0,
          latestPayment: latestPayment,
          totalPayments: membershipPayments.length,
          totalAmount: membershipPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
        };
      });

      setMembersWithPayments(membersWithPaymentData);
    } catch (error) {
      console.error('Error fetching members with payments:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handlePrinterFormChange = (e) => {
    const { name, value } = e.target;
    setPrinterForm({
      ...printerForm,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (printerFormErrors[name]) {
      setPrinterFormErrors({
        ...printerFormErrors,
        [name]: ''
      });
    }
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      // Check if we're in printer form or general settings
      if (activeField === 'name' || activeField === 'connection_string') {
        setPrinterForm(prev => ({
          ...prev,
          [activeField]: prev[activeField] + input
        }));
      } else if (activeField === 'storeName' || activeField === 'taxRate') {
        setGeneralSettings(prev => ({
          ...prev,
          [activeField]: prev[activeField] + input
        }));
      } else if (activeField === 'member_fee') {
        setMemberFeeForm(prev => ({
          ...prev,
          member_fee: prev.member_fee + input
        }));
      } else if (activeField === 'rental_charge') {
        setRentalChargeForm(prev => ({
          ...prev,
          rental_charge: prev.rental_charge + input
        }));
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      if (activeField === 'name' || activeField === 'connection_string') {
        setPrinterForm(prev => ({
          ...prev,
          [activeField]: prev[activeField].toString().slice(0, -1)
        }));
      } else if (activeField === 'storeName' || activeField === 'taxRate') {
        setGeneralSettings(prev => ({
          ...prev,
          [activeField]: prev[activeField].toString().slice(0, -1)
        }));
      } else if (activeField === 'member_fee') {
        setMemberFeeForm(prev => ({
          ...prev,
          member_fee: prev.member_fee.toString().slice(0, -1)
        }));
      } else if (activeField === 'rental_charge') {
        setRentalChargeForm(prev => ({
          ...prev,
          rental_charge: prev.rental_charge.toString().slice(0, -1)
        }));
      }
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      if (activeField === 'name' || activeField === 'connection_string') {
        setPrinterForm(prev => ({
          ...prev,
          [activeField]: ""
        }));
      } else if (activeField === 'storeName' || activeField === 'taxRate') {
        setGeneralSettings(prev => ({
          ...prev,
          [activeField]: ""
        }));
      } else if (activeField === 'member_fee') {
        setMemberFeeForm(prev => ({
          ...prev,
          member_fee: ""
        }));
      } else if (activeField === 'rental_charge') {
        setRentalChargeForm(prev => ({
          ...prev,
          rental_charge: ""
        }));
      }
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPrinter = async () => {
    // Validate form
    const errors = {};
    if (!printerForm.name.trim()) {
      errors.name = 'Printer name is required';
    }
    if (!printerForm.type) {
      errors.type = 'Printer type is required';
    }

    if (Object.keys(errors).length > 0) {
      setPrinterFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerForm)
      });

      if (response.ok) {
        await fetchPrinters();
        setShowAddPrinter(false);
        setPrinterForm({ name: '', type: 'EPSON', connection_string: 'tcp://192.168.1.100:9100', is_main: false });
        setPrinterFormErrors({});
      }
    } catch (error) {
      console.error('Error adding printer:', error);
    }
  };

  const handleEditPrinter = (printer) => {
    setEditingPrinter(printer);
    setPrinterForm({
      name: printer.name,
      type: printer.type,
      connection_string: printer.connection_string || '',
      is_main: printer.is_main === 1 || printer.is_main === true
    });
    setPrinterFormErrors({});
    setShowAddPrinter(true);
  };

  const handleUpdatePrinter = async () => {
    // Validate form
    const errors = {};
    if (!printerForm.name.trim()) {
      errors.name = 'Printer name is required';
    }
    if (!printerForm.type) {
      errors.type = 'Printer type is required';
    }

    if (Object.keys(errors).length > 0) {
      setPrinterFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/printers/${editingPrinter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerForm)
      });

      if (response.ok) {
        await fetchPrinters();
        setShowAddPrinter(false);
        setEditingPrinter(null);
        setPrinterForm({ name: '', type: 'EPSON', connection_string: 'tcp://192.168.1.100:9100', is_main: false });
        setPrinterFormErrors({});
      }
    } catch (error) {
      console.error('Error updating printer:', error);
    }
  };

  const openDeleteConfirmation = (printer) => {
    setDeleteConfirmation({
      isOpen: true,
      printerId: printer.id,
      printerName: printer.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      printerId: null,
      printerName: ''
    });
  };

  const handleDeletePrinter = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/printers/${deleteConfirmation.printerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPrinters();
        closeDeleteConfirmation();
      }
    } catch (error) {
      console.error('Error deleting printer:', error);
      closeDeleteConfirmation();
    }
  };

  const handleTestPrinter = async (printerId) => {
    setTestingPrinter(printerId);
    try {
      const response = await fetch(`http://localhost:5000/api/printers/${printerId}/test`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        showInfo('Test print sent successfully! Check your printer.', '✅ Success');
      } else {
        showError('Test print failed: ' + (result.error || 'Unknown error'), '❌ Test Failed');
      }
    } catch (error) {
      console.error('Error testing printer:', error);
      showError('Test print failed: ' + error.message, '❌ Test Failed');
    } finally {
      setTestingPrinter(null);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      
      // Get default permissions for Admin and User roles from first user of each role
      const newRolePerms = {
        'Super Admin': { admin: true, settings: true, reports: true },
        'Admin': { admin: false, settings: false, reports: false },
        'User': { admin: false, settings: false, reports: false }
      };
      
      data.forEach(user => {
        if (user.role === 'Admin' || user.role === 'User') {
          try {
            const perms = user.permissions ? JSON.parse(user.permissions) : [];
            newRolePerms[user.role] = {
              admin: perms.includes('admin'),
              settings: perms.includes('settings'),
              reports: perms.includes('reports')
            };
          } catch (e) {
            // Keep defaults
          }
        }
      });
      
      setRolePermissions(newRolePerms);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const toggleRolePermission = async (role, permission) => {
    if (role === 'Super Admin') return; // Cannot modify Super Admin
    
    const newValue = !rolePermissions[role][permission];
    
    setRolePermissions({
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [permission]: newValue
      }
    });

    // Update all users with this role
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      
      const usersWithRole = data.filter(user => user.role === role);
      
      for (const user of usersWithRole) {
        let perms = [];
        try {
          perms = user.permissions ? JSON.parse(user.permissions) : [];
        } catch (e) {
          perms = [];
        }
        
        if (newValue) {
          // Add permission if not exists
          if (!perms.includes(permission)) {
            perms.push(permission);
          }
        } else {
          // Remove permission
          perms = perms.filter(p => p !== permission);
        }
        
        await fetch(`http://localhost:5000/api/users/${user.id}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: JSON.stringify(perms) })
        });
      }
    } catch (error) {
      console.error('Error updating role permissions:', error);
    }
  };

  // Function to generate connection string examples based on type
  const getConnectionExamples = () => {
    return [
      { type: 'Network (LAN)', example: 'tcp://192.168.1.100:9100' },
      { type: 'USB (Windows)', example: '\\\\.\\COM3' },
      { type: 'USB (Linux/Mac)', example: '/dev/usb/lp0' }
    ];
  };

  // Member Fee Functions
  const handleMemberFeeFormChange = (e) => {
    const { name, value } = e.target;
    setMemberFeeForm({
      ...memberFeeForm,
      [name]: value
    });
    
    if (memberFeeFormErrors[name]) {
      setMemberFeeFormErrors({
        ...memberFeeFormErrors,
        [name]: ''
      });
    }
  };

  const handleAddMemberFee = async () => {
    const errors = {};
    if (!memberFeeForm.member_fee || memberFeeForm.member_fee.trim() === '') {
      errors.member_fee = 'Member fee is required';
    }

    if (Object.keys(errors).length > 0) {
      setMemberFeeFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/member-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberFeeForm)
      });

      if (response.ok) {
        await fetchMemberFees();
        setShowAddMemberFee(false);
        setMemberFeeForm({ member_fee: '' });
        setMemberFeeFormErrors({});
        showInfo('Member fee added successfully', '✅ Success');
      }
    } catch (error) {
      console.error('Error adding member fee:', error);
      showError('Failed to add member fee', '❌ Error');
    }
  };

  const handleEditMemberFee = (memberFee) => {
    setEditingMemberFee(memberFee);
    setMemberFeeForm({
      member_fee: memberFee.member_fee.toString()
    });
    setMemberFeeFormErrors({});
    setShowAddMemberFee(true);
  };

  const handleUpdateMemberFee = async () => {
    const errors = {};
    if (!memberFeeForm.member_fee || memberFeeForm.member_fee.trim() === '') {
      errors.member_fee = 'Member fee is required';
    }

    if (Object.keys(errors).length > 0) {
      setMemberFeeFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/member-fees/${editingMemberFee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberFeeForm)
      });

      if (response.ok) {
        await fetchMemberFees();
        setShowAddMemberFee(false);
        setEditingMemberFee(null);
        setMemberFeeForm({ member_fee: '' });
        setMemberFeeFormErrors({});
        showInfo('Member fee updated successfully', '✅ Success');
      }
    } catch (error) {
      console.error('Error updating member fee:', error);
      showError('Failed to update member fee', '❌ Error');
    }
  };

  const openDeleteMemberFeeConfirmation = (memberFee) => {
    setDeleteMemberFeeConfirmation({
      isOpen: true,
      memberFeeId: memberFee.id
    });
  };

  const closeDeleteMemberFeeConfirmation = () => {
    setDeleteMemberFeeConfirmation({
      isOpen: false,
      memberFeeId: null
    });
  };

  const handleDeleteMemberFee = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/member-fees/${deleteMemberFeeConfirmation.memberFeeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchMemberFees();
        closeDeleteMemberFeeConfirmation();
        showInfo('Member fee deleted successfully', '✅ Success');
      }
    } catch (error) {
      console.error('Error deleting member fee:', error);
      showError('Failed to delete member fee', '❌ Error');
      closeDeleteMemberFeeConfirmation();
    }
  };

  // Rental Charge Functions
  const handleRentalChargeFormChange = (e) => {
    const { name, value } = e.target;
    setRentalChargeForm({
      ...rentalChargeForm,
      [name]: value
    });
    
    if (rentalChargeFormErrors[name]) {
      setRentalChargeFormErrors({
        ...rentalChargeFormErrors,
        [name]: ''
      });
    }
  };

  const handleAddRentalCharge = async () => {
    const errors = {};
    if (!rentalChargeForm.rental_charge || rentalChargeForm.rental_charge.trim() === '') {
      errors.rental_charge = 'Rental charge is required';
    }

    if (Object.keys(errors).length > 0) {
      setRentalChargeFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/rental-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rentalChargeForm)
      });

      if (response.ok) {
        await fetchRentalCharges();
        setShowAddRentalCharge(false);
        setRentalChargeForm({ rental_charge: '' });
        setRentalChargeFormErrors({});
        showInfo('Rental charge added successfully', '✅ Success');
      }
    } catch (error) {
      console.error('Error adding rental charge:', error);
      showError('Failed to add rental charge', '❌ Error');
    }
  };

  const handleEditRentalCharge = (rentalCharge) => {
    setEditingRentalCharge(rentalCharge);
    setRentalChargeForm({
      rental_charge: rentalCharge.rental_charge.toString()
    });
    setRentalChargeFormErrors({});
    setShowAddRentalCharge(true);
  };

  const handleUpdateRentalCharge = async () => {
    const errors = {};
    if (!rentalChargeForm.rental_charge || rentalChargeForm.rental_charge.trim() === '') {
      errors.rental_charge = 'Rental charge is required';
    }

    if (Object.keys(errors).length > 0) {
      setRentalChargeFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/rental-charges/${editingRentalCharge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rentalChargeForm)
      });

      if (response.ok) {
        await fetchRentalCharges();
        setShowAddRentalCharge(false);
        setEditingRentalCharge(null);
        setRentalChargeForm({ rental_charge: '' });
        setRentalChargeFormErrors({});
        showInfo('Rental charge updated successfully', '✅ Success');
      }
    } catch (error) {
      console.error('Error updating rental charge:', error);
      showError('Failed to update rental charge', '❌ Error');
    }
  };

  const openDeleteRentalChargeConfirmation = (rentalCharge) => {
    setDeleteRentalChargeConfirmation({
      isOpen: true,
      rentalChargeId: rentalCharge.id
    });
  };

  const closeDeleteRentalChargeConfirmation = () => {
    setDeleteRentalChargeConfirmation({
      isOpen: false,
      rentalChargeId: null
    });
  };

  const handleDeleteRentalCharge = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rental-charges/${deleteRentalChargeConfirmation.rentalChargeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchRentalCharges();
        closeDeleteRentalChargeConfirmation();
        showInfo('Rental charge deleted successfully', '✅ Success');
      }
    } catch (error) {
      console.error('Error deleting rental charge:', error);
      showError('Failed to delete rental charge', '❌ Error');
      closeDeleteRentalChargeConfirmation();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-pos-bg-secondary rounded-lg shadow-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-pos-border-primary">
          <h2 className="text-pos-text-primary text-xl font-semibold">Settings</h2>
          <button className="text-pos-text-muted hover:text-pos-text-primary text-2xl" onClick={onClose}>×</button>
        </div>

        <div className="flex border-b pb-1 mt-1 border-pos-border-primary">
          {(!limitedTabs || limitedTabs.includes('general')) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'general' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
          )}
          {(!limitedTabs || limitedTabs.includes('display')) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'display' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('display')}
            >
              Display
            </button>
          )}
          {(!limitedTabs || limitedTabs.includes('printer')) && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'printer' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('printer')}
            >
              Printer
            </button>
          )}
          {(!limitedTabs || limitedTabs.includes('payment')) && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'payment' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('payment')}
            >
              Payment
            </button>
          )}

          {(!limitedTabs || limitedTabs.includes('permissions')) && isSuperAdmin && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'permissions' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('permissions')}
            >
              Permissions
            </button>
          )}

          {/* Member Fee tab - Only visible for mosque version */}
          {version === 'mosque' && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'memberFee' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('memberFee')}
            >
              Member Fee
            </button>
          )}

          {/* Rental Charge tab - Only visible for mosque version */}
          {version === 'mosque' && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'rentalCharge' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('rentalCharge')}
            >
              Rental Charge
            </button>
          )}

          {/* Members tab - Only visible for mosque version */}
          {version === 'mosque' && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'members' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
          )}
        </div>

        <div className="px-4 py-2 overflow-y-auto max-h-[60vh] scrollbar-custom">
          {activeTab === 'general' && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Store Name</label>
                  <input 
                    type="text" 
                    name="storeName"
                    value={generalSettings.storeName}
                    onChange={handleGeneralSettingsChange}
                    onFocus={() => handleFieldFocus('storeName')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'storeName' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Tax Rate (%)</label>
                  <input 
                    type="text" 
                    name="taxRate"
                    value={generalSettings.taxRate}
                    onChange={handleGeneralSettingsChange}
                    onFocus={() => handleFieldFocus('taxRate')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'taxRate' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Currency</label>
                  <select 
                    name="currency"
                    value={generalSettings.currency}
                    onChange={handleGeneralSettingsChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Language</label>
                  <select 
                    name="language"
                    value={generalSettings.language}
                    onChange={handleGeneralSettingsChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="nl">Nederlands</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              {/* Keypad Section for General Tab */}
              {showKeypad && (
                <div style={{marginTop:"-1rem"}}>
                  <div className="mb-1 text-sm text-pos-text-muted text-center">
                    Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                  </div>
                  <KeypadNumpad
                    onInput={handleKeypadInput}
                    onEnter={handleKeypadEnter}
                    onBackspace={handleKeypadBackspace}
                    onClear={handleKeypadClear}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'display' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-pos-text-muted mb-1">Theme</label>
                <select defaultValue="dark" className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-pos-text-muted mb-1">Font Size</label>
                <select defaultValue="medium" className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="show-images" defaultChecked className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="show-images" className="text-pos-text-primary text-sm">Show Product Images</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="compact-mode" className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="compact-mode" className="text-pos-text-primary text-sm">Compact Mode</label>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-pos-text-primary text-base font-semibold">Manage Printers</h3>
                <button 
                  onClick={() => {
                    setShowAddPrinter(true);
                    setEditingPrinter(null);
                    setPrinterForm({ name: '', type: 'EPSON', connection_string: 'tcp://192.168.1.100:9100', is_main: false });
                  }}
                  className="btn-primary py-1.5"
                >
                  + Add Printer
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-48">Printer Name</th>
                      <th className="w-32">Type</th>
                      <th className="w-64">Connection String</th>
                      <th className="w-32 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-pos-text-muted">
                          No printers configured. Click "Add Printer" to get started.
                        </td>
                      </tr>
                    ) : (
                      printers.map(printer => (
                        <tr key={printer.id} className={printer.is_main ? 'bg-blue-900 bg-opacity-20' : ''}>
                          <td className="font-medium text-pos-text-primary">
                            <div className="flex items-center gap-2">
                              {printer.name}
                              {printer.is_main === 1 && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Main</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              printer.type === 'serial'
                                ? 'bg-pos-info bg-opacity-20 text-pos-info'
                                : printer.type === 'windows'
                                  ? 'bg-purple-500 bg-opacity-20 text-purple-400'
                                  : 'bg-pos-warning bg-opacity-20 text-pos-warning'
                            }`}>
                              {printer.type.charAt(0).toUpperCase() + printer.type.slice(1)}
                            </span>
                          </td>
                          <td className="text-pos-text-secondary font-mono text-sm">
                            {printer.connection_string || '-'}
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-2">
                            
                              <IconButton
                                icon="✏️"
                                className="edit"
                                onClick={() => handleEditPrinter(printer)}
                                title="Edit printer"
                              />
                              <IconButton
                                icon="🗑️"
                                className="delete"
                                onClick={() => openDeleteConfirmation(printer)}
                                title="Delete printer"
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {showAddPrinter && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => {
                  setShowAddPrinter(false);
                  setPrinterFormErrors({});
                  setActiveField(null);
                }}>
                  <div className="bg-pos-bg-tertiary rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-pos-text-primary">
                        {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
                      </h3>
                      <button 
                        onClick={() => {
                          setShowAddPrinter(false);
                          setPrinterFormErrors({});
                          setActiveField(null);
                        }}
                        className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Printer Name <span className="text-pos-error">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="name"
                            value={printerForm.name}
                            onChange={handlePrinterFormChange}
                            onFocus={() => handleFieldFocus('name')}
                            className={`w-full bg-pos-bg-primary border ${printerFormErrors.name ? 'border-pos-error' : activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                            placeholder="e.g., Kitchen Printer"
                          />
                          {printerFormErrors.name && (
                            <p className="text-pos-error text-xs mt-1">{printerFormErrors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Printer Type <span className="text-pos-error">*</span>
                          </label>
                          <select 
                            name="type"
                            value={printerForm.type}
                            onChange={handlePrinterFormChange}
                            className={`w-full bg-pos-bg-primary border ${printerFormErrors.type ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                          >
                            <option value="EPSON">EPSON </option>
                            <option value="STAR">STAR Micronics</option>
                            <option value="TANCA">TANCA</option>
                            <option value="DARUMA">DARUMA</option>
                            <option value="BROTHER">BROTHER</option>
                          </select>
                          {printerFormErrors.type && (
                            <p className="text-pos-error text-xs mt-1">{printerFormErrors.type}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Connection String <span className="text-pos-error">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="connection_string"
                            value={printerForm.connection_string}
                            onChange={handlePrinterFormChange}
                            onFocus={() => handleFieldFocus('connection_string')}
                            className={`w-full bg-pos-bg-primary border ${activeField === 'connection_string' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                            placeholder="tcp://192.168.1.100:9100"
                          />
                        </div>
                      </div>
                      <div className="text-pos-text-muted text-xs space-y-1">
                        <p className="font-medium">Connection Examples:</p>
                        {getConnectionExamples().map((example, index) => (
                          <p key={index}><strong>{example.type}:</strong> {example.example}</p>
                        ))}
                      </div>

                      {/* Main Printer Checkbox */}
                      <div className="px-4 py-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={printerForm.is_main}
                            onChange={(e) => setPrinterForm({ ...printerForm, is_main: e.target.checked })}
                            className="w-5 h-5 mt-0.5 text-blue-600 bg-pos-bg-primary border-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div>
                            <span className="text-pos-text-primary font-medium text-sm">Set as Main Printer</span>
                            <p className="text-pos-text-muted text-xs mt-1">
                              Only one printer can be main. Setting this will unmark the current main printer.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Keypad Section */}
                    {showKeypad && (
                      <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{marginTop:"-1rem"}}>
                        <div className="mb-1 text-sm text-pos-text-muted text-center">
                          Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
                          <KeypadNumpad
                            onInput={handleKeypadInput}
                            onEnter={handleKeypadEnter}
                            onBackspace={handleKeypadBackspace}
                            onClear={handleKeypadClear}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowKeypad(!showKeypad)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${showKeypad
                          ? 'bg-pos-info text-white'
                          : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                          }`}>
                        {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setShowAddPrinter(false);
                            setPrinterFormErrors({});
                            setActiveField(null);
                          }}
                          className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={editingPrinter ? handleUpdatePrinter : handleAddPrinter}
                          className="px-5 py-1.5 bg-pos-bg-primary text-pos-text-primary text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
                        >
                          {editingPrinter ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <PaymentTerminalManager />
          )}



          {activeTab === 'permissions' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="mb-4">
                <p className="text-pos-text-muted text-sm">Manage user permissions for Admin Panel, Settings, and Reports access</p>
              </div>

              {/* Role Permissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-pos-bg-tertiary border-b-2 border-pos-border-primary">
                      <th className="text-left py-3 px-4 text-pos-text-primary text-sm font-semibold">Role</th>
                      <th className="text-center py-3 px-4 text-pos-text-primary text-sm font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <span>🔌</span>
                          <span>Admin Panel</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-pos-text-primary text-sm font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <span>⚙️</span>
                          <span>Settings</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-pos-text-primary text-sm font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <span>📊</span>
                          <span>Reports</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Super Admin Role */}
                    <tr className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500 bg-opacity-20 text-purple-400">
                          Super Admin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-pos-text-muted text-xs">Always</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-pos-text-muted text-xs">Always</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-pos-text-muted text-xs">Always</span>
                        </div>
                      </td>
                    </tr>

                    {/* Admin Role */}
                    <tr className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors bg-pos-bg-secondary">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pos-error bg-opacity-20 text-pos-error">
                          Admin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('Admin', 'admin')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['Admin'].admin
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['Admin'].admin ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('Admin', 'settings')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['Admin'].settings
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['Admin'].settings ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('Admin', 'reports')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['Admin'].reports
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['Admin'].reports ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                    </tr>

                    {/* User Role */}
                    <tr className="hover:bg-pos-bg-tertiary transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pos-info bg-opacity-20 text-pos-light">
                          User
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('User', 'admin')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['User'].admin
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['User'].admin ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('User', 'settings')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['User'].settings
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['User'].settings ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('User', 'reports')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['User'].reports
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['User'].reports ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Member Fee Tab Content */}
          {activeTab === 'memberFee' && version === 'mosque' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-pos-text-primary text-base font-semibold">Manage Member Fees</h3>
                <button 
                  onClick={() => {
                    setShowAddMemberFee(true);
                    setEditingMemberFee(null);
                    setMemberFeeForm({ member_fee: '' });
                  }}
                  className="btn-primary py-1.5"
                >
                  + Add Member Fee
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-32">ID</th>
                      <th className="w-48">Member Fee</th>
                      <th className="w-32 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberFees.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-pos-text-muted">
                          No member fees configured. Click "Add Member Fee" to get started.
                        </td>
                      </tr>
                    ) : (
                      memberFees.map(memberFee => (
                        <tr key={memberFee.id}>
                          <td className="font-medium text-pos-text-primary">{memberFee.id}</td>
                          <td className="text-pos-text-secondary">${memberFee.member_fee}</td>
                          <td>
                            <div className="flex items-center justify-center gap-2">
                              <IconButton
                                icon="✏️"
                                className="edit"
                                onClick={() => handleEditMemberFee(memberFee)}
                                title="Edit member fee"
                              />
                              <IconButton
                                icon="🗑️"
                                className="delete"
                                onClick={() => openDeleteMemberFeeConfirmation(memberFee)}
                                title="Delete member fee"
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {showAddMemberFee && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => {
                  setShowAddMemberFee(false);
                  setMemberFeeFormErrors({});
                  setActiveField(null);
                }}>
                  <div className="bg-pos-bg-tertiary rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-pos-text-primary">
                        {editingMemberFee ? 'Edit Member Fee' : 'Add New Member Fee'}
                      </h3>
                      <button 
                        onClick={() => {
                          setShowAddMemberFee(false);
                          setMemberFeeFormErrors({});
                          setActiveField(null);
                        }}
                        className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
                      <div className="grid grid-cols-1 gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Member Fee <span className="text-pos-error">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="member_fee"
                            value={memberFeeForm.member_fee}
                            onChange={handleMemberFeeFormChange}
                            onFocus={() => handleFieldFocus('member_fee')}
                            className={`w-full bg-pos-bg-primary border ${memberFeeFormErrors.member_fee ? 'border-pos-error' : activeField === 'member_fee' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                            placeholder="e.g., 50.00"
                          />
                          {memberFeeFormErrors.member_fee && (
                            <p className="text-pos-error text-xs mt-1">{memberFeeFormErrors.member_fee}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Keypad Section */}
                    {showKeypad && (
                      <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{marginTop:"-1rem"}}>
                        <div className="mb-1 text-sm text-pos-text-muted text-center">
                          Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
                          <KeypadNumpad
                            onInput={handleKeypadInput}
                            onEnter={handleKeypadEnter}
                            onBackspace={handleKeypadBackspace}
                            onClear={handleKeypadClear}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowKeypad(!showKeypad)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${showKeypad
                          ? 'bg-pos-info text-white'
                          : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                          }`}>
                        {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setShowAddMemberFee(false);
                            setMemberFeeFormErrors({});
                            setActiveField(null);
                          }}
                          className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={editingMemberFee ? handleUpdateMemberFee : handleAddMemberFee}
                          className="px-5 py-1.5 bg-pos-bg-primary text-pos-text-primary text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
                        >
                          {editingMemberFee ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rental Charge Tab Content */}
          {activeTab === 'rentalCharge' && version === 'mosque' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-pos-text-primary text-base font-semibold">Manage Rental Charges</h3>
                <button 
                  onClick={() => {
                    setShowAddRentalCharge(true);
                    setEditingRentalCharge(null);
                    setRentalChargeForm({ rental_charge: '' });
                  }}
                  className="btn-primary py-1.5"
                >
                  + Add Rental Charge
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-32">ID</th>
                      <th className="w-48">Rental Charge</th>
                      <th className="w-32 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalCharges.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-pos-text-muted">
                          No rental charges configured. Click "Add Rental Charge" to get started.
                        </td>
                      </tr>
                    ) : (
                      rentalCharges.map(rentalCharge => (
                        <tr key={rentalCharge.id}>
                          <td className="font-medium text-pos-text-primary">{rentalCharge.id}</td>
                          <td className="text-pos-text-secondary">${rentalCharge.rental_charge}</td>
                          <td>
                            <div className="flex items-center justify-center gap-2">
                              <IconButton
                                icon="✏️"
                                className="edit"
                                onClick={() => handleEditRentalCharge(rentalCharge)}
                                title="Edit rental charge"
                              />
                              <IconButton
                                icon="🗑️"
                                className="delete"
                                onClick={() => openDeleteRentalChargeConfirmation(rentalCharge)}
                                title="Delete rental charge"
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {showAddRentalCharge && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => {
                  setShowAddRentalCharge(false);
                  setRentalChargeFormErrors({});
                  setActiveField(null);
                }}>
                  <div className="bg-pos-bg-tertiary rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-pos-text-primary">
                        {editingRentalCharge ? 'Edit Rental Charge' : 'Add New Rental Charge'}
                      </h3>
                      <button 
                        onClick={() => {
                          setShowAddRentalCharge(false);
                          setRentalChargeFormErrors({});
                          setActiveField(null);
                        }}
                        className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
                      <div className="grid grid-cols-1 gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Rental Charge <span className="text-pos-error">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="rental_charge"
                            value={rentalChargeForm.rental_charge}
                            onChange={handleRentalChargeFormChange}
                            onFocus={() => handleFieldFocus('rental_charge')}
                            className={`w-full bg-pos-bg-primary border ${rentalChargeFormErrors.rental_charge ? 'border-pos-error' : activeField === 'rental_charge' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                            placeholder="e.g., 100.00"
                          />
                          {rentalChargeFormErrors.rental_charge && (
                            <p className="text-pos-error text-xs mt-1">{rentalChargeFormErrors.rental_charge}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Keypad Section */}
                    {showKeypad && (
                      <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{marginTop:"-1rem"}}>
                        <div className="mb-1 text-sm text-pos-text-muted text-center">
                          Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
                          <KeypadNumpad
                            onInput={handleKeypadInput}
                            onEnter={handleKeypadEnter}
                            onBackspace={handleKeypadBackspace}
                            onClear={handleKeypadClear}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowKeypad(!showKeypad)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${showKeypad
                          ? 'bg-pos-info text-white'
                          : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                          }`}>
                        {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setShowAddRentalCharge(false);
                            setRentalChargeFormErrors({});
                            setActiveField(null);
                          }}
                          className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={editingRentalCharge ? handleUpdateRentalCharge : handleAddRentalCharge}
                          className="px-5 py-1.5 bg-pos-bg-primary text-pos-text-primary text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
                        >
                          {editingRentalCharge ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members Tab Content */}
          {activeTab === 'members' && version === 'mosque' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3">
                <h3 className="text-pos-text-primary text-base font-semibold">Members & Membership Status</h3>
                
                {/* Search Bar - Inline */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full px-4 py-1.5 pl-9 bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pos-text-muted" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

              </div>

              <div className="overflow-x-auto">
                  {/* Summary Stats */}
              {!loadingMembers && membersWithPayments.length > 0 && (
                <div className="grid grid-cols-3 mb-2 gap-3 mt-4 pt-4 border-t border-pos-border-primary">
                  <div className="bg-pos-bg-tertiary rounded-lg p-3 border border-pos-border-secondary">
                    <div className="text-xs text-pos-text-muted mb-1">
                      {memberSearchQuery ? 'Filtered Results' : 'Total Members'}
                    </div>
                    <div className="text-2xl font-bold text-pos-text-primary">
                      {memberSearchQuery 
                        ? membersWithPayments.filter(m => {
                            const searchLower = memberSearchQuery.toLowerCase();
                            return m.full_name.toLowerCase().includes(searchLower) || 
                                   (m.phone && m.phone.includes(memberSearchQuery));
                          }).length
                        : membersWithPayments.length
                      }
                    </div>
                  </div>
                  <div className="bg-green-900 bg-opacity-20 rounded-lg p-3 border border-green-700">
                    <div className="text-xs text-green-400 mb-1">Members Paid</div>
                    <div className="text-2xl font-bold text-green-400">
                      {memberSearchQuery
                        ? membersWithPayments.filter(m => {
                            const searchLower = memberSearchQuery.toLowerCase();
                            const matchesSearch = m.full_name.toLowerCase().includes(searchLower) || 
                                                 (m.phone && m.phone.includes(memberSearchQuery));
                            return matchesSearch && m.hasPayment;
                          }).length
                        : membersWithPayments.filter(m => m.hasPayment).length
                      }
                    </div>
                  </div>
                  <div className="bg-gray-900 bg-opacity-20 rounded-lg p-3 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">No Payment</div>
                    <div className="text-2xl font-bold text-gray-400">
                      {memberSearchQuery
                        ? membersWithPayments.filter(m => {
                            const searchLower = memberSearchQuery.toLowerCase();
                            const matchesSearch = m.full_name.toLowerCase().includes(searchLower) || 
                                                 (m.phone && m.phone.includes(memberSearchQuery));
                            return matchesSearch && !m.hasPayment;
                          }).length
                        : membersWithPayments.filter(m => !m.hasPayment).length
                      }
                    </div>
                  </div>
                </div>
              )}
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-48">Member Name</th>
                      <th className="w-32">Phone</th>
                      <th className="w-32 text-center">Status</th>
                      <th className="w-32 text-center">Payment Type</th>
                      <th className="w-32 text-right">Amount Paid</th>
                      <th className="w-32 text-center">Last Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMembers ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-pos-text-muted">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pos-text-primary"></div>
                            <span>Loading members...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (() => {
                      // Filter members based on search query
                      const filteredMembers = membersWithPayments.filter(member => {
                        const searchLower = memberSearchQuery.toLowerCase();
                        const nameMatch = member.full_name.toLowerCase().includes(searchLower);
                        const phoneMatch = member.phone && member.phone.includes(memberSearchQuery);
                        return nameMatch || phoneMatch;
                      });

                      if (filteredMembers.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-pos-text-muted">
                              {memberSearchQuery ? `No members found matching "${memberSearchQuery}"` : 'No members found.'}
                            </td>
                          </tr>
                        );
                      }

                      return filteredMembers.map(member => (
                        <tr key={member.id} className={member.hasPayment ? 'bg-green-900 bg-opacity-10' : ''}>
                          <td className="font-medium text-pos-text-primary">
                            {member.full_name}
                          </td>
                          <td className="text-pos-text-secondary text-sm">
                            {member.phone || '-'}
                          </td>
                          <td className="text-center">
                            {member.hasPayment ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-400">
                                ✓ Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 bg-opacity-20 text-gray-400">
                                No Payment
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {member.latestPayment ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.latestPayment.is_half_payment === 1
                                  ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                                  : 'bg-blue-500 bg-opacity-20 text-blue-400'
                              }`}>
                                {member.latestPayment.is_half_payment === 1 ? 'Half' : 'Full'}
                              </span>
                            ) : (
                              <span className="text-pos-text-muted text-xs">-</span>
                            )}
                          </td>
                          <td className="text-right font-mono text-pos-text-secondary">
                            {member.hasPayment ? (
                              <span>€ {member.totalAmount.toFixed(2)}</span>
                            ) : (
                              <span className="text-pos-text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center text-pos-text-secondary text-xs">
                            {member.latestPayment ? (
                              new Date(member.latestPayment.created_at).toLocaleDateString()
                            ) : (
                              <span className="text-pos-text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

            
            </div>
          )}
        </div>

        {/* Keyboard Toggle Button - Only show for General tab */}
        {activeTab === 'general' && (
          <div className="px-4 py-2 border-t border-pos-border-primary flex justify-center">
            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                }`}>
              {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeletePrinter}
        title="Delete Printer"
        message={`Are you sure you want to delete "${deleteConfirmation.printerName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationModal
        isOpen={deleteMemberFeeConfirmation.isOpen}
        onClose={closeDeleteMemberFeeConfirmation}
        onConfirm={handleDeleteMemberFee}
        title="Delete Member Fee"
        message="Are you sure you want to delete this member fee? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationModal
        isOpen={deleteRentalChargeConfirmation.isOpen}
        onClose={closeDeleteRentalChargeConfirmation}
        onConfirm={handleDeleteRentalCharge}
        title="Delete Rental Charge"
        message="Are you sure you want to delete this rental charge? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default SettingsModal;