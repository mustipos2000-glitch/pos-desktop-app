import { useState, useEffect } from 'react';
import MosqueApiService from '../../services/mosqueApi';
import ApiService from '../../services/api';

const PaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    memberId: '',
    paymentType: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let response;
      try {
        response = await MosqueApiService.getMosquePayments();
      } catch (error) {
        console.error('Error fetching payments:', error);
        // If connection refused, show helpful message
        if (error.message && error.message.includes('Failed to fetch')) {
          alert('Cannot connect to server. Please make sure the server is running on port 5000.');
        } else {
          alert('Failed to load payments: ' + (error.message || 'Unknown error'));
        }
        setPayments([]);
        return;
      }
      let allPayments = response.data || [];

      // Apply filters
      if (filters.memberId) {
        allPayments = allPayments.filter(p => p.member_id === parseInt(filters.memberId));
      }
      if (filters.paymentType) {
        allPayments = allPayments.filter(p => p.payment_type === filters.paymentType);
      }
      if (filters.paymentMethod) {
        allPayments = allPayments.filter(p => p.payment_method === filters.paymentMethod);
      }
      if (filters.startDate) {
        allPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.created_at);
          return paymentDate >= new Date(filters.startDate);
        });
      }
      if (filters.endDate) {
        allPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.created_at);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          return paymentDate <= endDate;
        });
      }

      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await ApiService.getMembers();
      setMembers(response || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      memberId: '',
      paymentType: '',
      paymentMethod: '',
      startDate: '',
      endDate: ''
    });
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      'member_fee': 'Member Fee',
      'sadaka': 'Sadaka',
      'rent': 'Rental',
      'mortuarium': 'Mortuarium',
      'renovation': 'Renovation',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'cash': 'Cash',
      'card': 'Card',
      'bancontact': 'Bancontact',
      'viva': 'Viva',
      'payworld': 'Payworld',
      'cashmatic': 'Cashmatic'
    };
    return labels[method] || method;
  };

  const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const paymentTypes = [...new Set(payments.map(p => p.payment_type))];
  const paymentMethods = [...new Set(payments.map(p => p.payment_method))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pos-text-primary">Payment Management</h2>
        <div className="text-xl sm:text-2xl font-bold text-green-600">
          Total: €{totalAmount.toFixed(2)}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-pos-bg-secondary rounded-lg sm:rounded-xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">Member</label>
          <select
            value={filters.memberId}
            onChange={(e) => handleFilterChange('memberId', e.target.value)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          >
            <option value="">All Members</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.member_id} - {member.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">Payment Type</label>
          <select
            value={filters.paymentType}
            onChange={(e) => handleFilterChange('paymentType', e.target.value)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          >
            <option value="">All Types</option>
            {paymentTypes.map(type => (
              <option key={type} value={type}>
                {getPaymentTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">Payment Method</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          >
            <option value="">All Methods</option>
            {paymentMethods.map(method => (
              <option key={method} value={method}>
                {getPaymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          />
        </div>

        <div>
          <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-pos-bg-primary text-pos-text-primary border-2 border-pos-border-secondary rounded-xl hover:bg-pos-bg-tertiary transition-colors font-bold text-lg sm:text-xl"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12 text-pos-text-muted text-xl sm:text-2xl">Loading...</div>
      ) : (
        <div className="bg-pos-bg-secondary rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-pos-bg-tertiary">
                <tr>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary">Date</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary">Member</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary">Type</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary hidden lg:table-cell">Subtype</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary">Amount</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary hidden md:table-cell">Method</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary hidden xl:table-cell">Transaction ID</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border-primary">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-pos-text-muted text-lg sm:text-xl">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-pos-bg-tertiary">
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-primary">
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg font-semibold text-pos-text-primary">
                        {payment.member_name || (payment.member_id ? `ID: ${payment.member_id}` : 'Guest')}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-primary">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-secondary hidden lg:table-cell">
                        {payment.payment_subtype || '-'}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg lg:text-xl font-bold text-green-600">
                        €{parseFloat(payment.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-secondary hidden md:table-cell">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-secondary font-mono hidden xl:table-cell">
                        {payment.transaction_id ? payment.transaction_id.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <span className={`px-3 py-2 rounded-xl text-base sm:text-lg font-bold ${
                          payment.status === 'completed' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {payment.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-lg sm:text-xl font-semibold text-pos-text-primary mt-4 text-center sm:text-left">
        Showing {payments.length} payment(s) | Total Amount: €{totalAmount.toFixed(2)}
      </div>
    </div>
  );
};

export default PaymentManager;

