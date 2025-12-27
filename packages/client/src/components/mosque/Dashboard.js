import { useState, useEffect } from 'react';
import MosqueApiService from '../../services/mosqueApi';
import ApiService from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    totalMembers: 0,
    paymentsByType: {},
    paymentsByMethod: {},
    recentPayments: []
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data, but handle errors gracefully
      let paymentsResponse, membersResponse, statsByTypeResponse, statsByMethodResponse;
      
      try {
        paymentsResponse = await MosqueApiService.getMosquePayments();
      } catch (error) {
        console.error('Error fetching payments:', error);
        paymentsResponse = { data: [] };
      }
      
      try {
        membersResponse = await ApiService.getMembers();
      } catch (error) {
        console.error('Error fetching members:', error);
        membersResponse = [];
      }
      
      try {
        statsByTypeResponse = await MosqueApiService.getMosquePaymentStatsByType(dateRange.startDate, dateRange.endDate);
      } catch (error) {
        console.error('Error fetching stats by type:', error);
        statsByTypeResponse = { data: {} };
      }
      
      try {
        statsByMethodResponse = await MosqueApiService.getMosquePaymentStatsByMethod(dateRange.startDate, dateRange.endDate);
      } catch (error) {
        console.error('Error fetching stats by method:', error);
        statsByMethodResponse = { data: {} };
      }

      const allPayments = paymentsResponse.data || [];
      const members = membersResponse || [];
      
      // Filter payments by date range
      const filteredPayments = allPayments.filter(p => {
        const paymentDate = new Date(p.created_at);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        return paymentDate >= start && paymentDate <= end;
      });

      // Calculate totals
      const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Group by type
      const paymentsByType = {};
      filteredPayments.forEach(p => {
        const type = p.payment_type || 'other';
        paymentsByType[type] = (paymentsByType[type] || 0) + parseFloat(p.amount || 0);
      });

      // Group by method
      const paymentsByMethod = {};
      filteredPayments.forEach(p => {
        const method = p.payment_method || 'unknown';
        paymentsByMethod[method] = (paymentsByMethod[method] || 0) + parseFloat(p.amount || 0);
      });

      // Recent payments (last 10)
      const recentPayments = allPayments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      setStats({
        totalPayments: filteredPayments.length,
        totalAmount,
        totalMembers: members.length,
        paymentsByType,
        paymentsByMethod,
        recentPayments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set empty stats on error
      setStats({
        totalPayments: 0,
        totalAmount: 0,
        totalMembers: 0,
        paymentsByType: {},
        paymentsByMethod: {},
        recentPayments: []
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pos-text-primary">Dashboard</h2>
        
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-secondary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          />
          <span className="px-2 py-2 text-lg sm:text-xl text-pos-text-secondary text-center">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-secondary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-pos-text-muted text-xl sm:text-2xl">Loading statistics...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6 border-2 border-pos-border-primary">
              <div className="text-base sm:text-lg text-pos-text-secondary mb-2">Total Payments</div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pos-text-primary">{stats.totalPayments}</div>
              <div className="text-sm sm:text-base text-pos-text-muted mt-2">In selected period</div>
            </div>

            <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6 border-2 border-green-600">
              <div className="text-base sm:text-lg text-pos-text-secondary mb-2">Total Amount</div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600">€{stats.totalAmount.toFixed(2)}</div>
              <div className="text-sm sm:text-base text-pos-text-muted mt-2">In selected period</div>
            </div>

            <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6 border-2 border-pos-border-primary sm:col-span-2 lg:col-span-1">
              <div className="text-base sm:text-lg text-pos-text-secondary mb-2">Total Members</div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pos-text-primary">{stats.totalMembers}</div>
              <div className="text-sm sm:text-base text-pos-text-muted mt-2">Registered members</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payments by Type */}
            <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold text-pos-text-primary mb-4 sm:mb-6">Payments by Type</h3>
              {Object.keys(stats.paymentsByType).length === 0 ? (
                <p className="text-pos-text-muted text-lg sm:text-xl">No payments in this period</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.paymentsByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, amount]) => (
                      <div key={type}>
                        <div className="flex justify-between mb-2">
                          <span className="text-base sm:text-lg lg:text-xl text-pos-text-primary font-semibold">
                            {getPaymentTypeLabel(type)}
                          </span>
                          <span className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                            €{amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-pos-bg-primary rounded-full h-3 sm:h-4">
                          <div
                            className="bg-green-600 h-3 sm:h-4 rounded-full"
                            style={{
                              width: `${(amount / stats.totalAmount) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Payments by Method */}
            <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-bold text-pos-text-primary mb-4 sm:mb-6">Payments by Method</h3>
              {Object.keys(stats.paymentsByMethod).length === 0 ? (
                <p className="text-pos-text-muted text-lg sm:text-xl">No payments in this period</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.paymentsByMethod)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, amount]) => (
                      <div key={method}>
                        <div className="flex justify-between mb-2">
                          <span className="text-base sm:text-lg lg:text-xl text-pos-text-primary font-semibold">
                            {getPaymentMethodLabel(method)}
                          </span>
                          <span className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                            €{amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-pos-bg-primary rounded-full h-3 sm:h-4">
                          <div
                            className="bg-blue-600 h-3 sm:h-4 rounded-full"
                            style={{
                              width: `${(amount / stats.totalAmount) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-pos-text-primary mb-4 sm:mb-6">Recent Payments</h3>
            {stats.recentPayments.length === 0 ? (
              <p className="text-pos-text-muted text-lg sm:text-xl">No recent payments</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-pos-bg-tertiary">
                    <tr>
                      <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg font-bold text-pos-text-primary">Date</th>
                      <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg font-bold text-pos-text-primary">Member</th>
                      <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg font-bold text-pos-text-primary hidden md:table-cell">Type</th>
                      <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg font-bold text-pos-text-primary">Amount</th>
                      <th className="px-3 py-3 sm:px-4 sm:py-4 text-left text-base sm:text-lg font-bold text-pos-text-primary hidden lg:table-cell">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pos-border-primary">
                    {stats.recentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-pos-bg-tertiary">
                        <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-primary">
                          {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg font-semibold text-pos-text-primary">
                          {payment.member_name || 'Guest'}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-secondary hidden md:table-cell">
                          {getPaymentTypeLabel(payment.payment_type)}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg lg:text-xl font-bold text-green-600">
                          €{parseFloat(payment.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 sm:px-4 sm:py-4 text-base sm:text-lg text-pos-text-secondary hidden lg:table-cell">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

