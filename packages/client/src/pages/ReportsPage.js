import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('X');
  const [reportData, setReportData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [zReportHistory, setZReportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadZReportHistory();
  }, []);

  const loadZReportHistory = async () => {
    try {
      const response = await ApiService.getZReportHistory(null, null, 10);
      if (response.success) {
        setZReportHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load Z report history:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === 'X') {
        response = await ApiService.getXReport(selectedDate);
      } else {
        response = await ApiService.getZReport(selectedDate, false, false);
      }
      
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const closeZReport = async () => {
    if (!window.confirm('Are you sure you want to close the Z Report? This action marks the end of the business day.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.getZReport(selectedDate, true, false);
      if (response.success) {
        setReportData(response.data);
        alert('Z Report closed successfully!');
        loadZReportHistory();
      }
    } catch (error) {
      console.error('Failed to close Z report:', error);
      alert('Failed to close Z report');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return `€${parseFloat(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="h-screen flex flex-col bg-pos-bg-primary overflow-hidden">
      {/* Header */}
      <div className="bg-pos-bg-secondary border-b border-pos-border-primary p-4 print:hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pos')}
              className="px-4 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors"
            >
              ← Back to POS
            </button>
            <h1 className="text-2xl font-bold text-pos-text-primary">Sales Reports</h1>
          </div>
        </div>
        
        {/* Report Type Selection */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setReportType('X')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              reportType === 'X'
                ? 'bg-blue-600 text-white'
                : 'bg-pos-bg-tertiary text-pos-text-muted hover:bg-pos-interactive-hover'
            }`}
          >
            X Report (Current Sales)
          </button>
          <button
            onClick={() => setReportType('Z')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              reportType === 'Z'
                ? 'bg-purple-600 text-white'
                : 'bg-pos-bg-tertiary text-pos-text-muted hover:bg-pos-interactive-hover'
            }`}
          >
            Z Report (End of Day)
          </button>
        </div>

        {/* Date Selection and Actions */}
        <div className="flex gap-4 items-center mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-pos-text-muted text-lg">📅</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
          >
            {loading ? '⏳ Generating...' : '📊 Generate Report'}
          </button>
          {reportType === 'Z' && reportData && (
            <button
              onClick={closeZReport}
              disabled={loading}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
            >
              🔒 Close Z Report
            </button>
          )}
          {reportData && (
            <button
              onClick={printReport}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
            >
              🖨️ Print
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 bg-opacity-40 border border-blue-600 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{reportType === 'X' ? '📊' : '🔒'}</span>
            <div>
              <p className="text-base text-white font-semibold mb-1">
                {reportType === 'X' ? 'X Report - Current Sales' : 'Z Report - End of Day'}
              </p>
              <p className="text-sm text-blue-100">
                {reportType === 'X' ? (
                  <>Shows all completed orders for the selected date. Can be generated multiple times during the day.</>
                ) : (
                  <>Shows final sales totals for the day. Should be generated once at end of business day.</>
                )}
              </p>
              <p className="text-sm text-blue-200 mt-2">
                ✅ Only shows orders with status = <strong>completed</strong> or <strong>paid</strong>
              </p>
              <p className="text-sm text-blue-200">
                📅 Orders appear based on when they were <strong>completed</strong> (updated_at timestamp)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {reportData ? (
          <div className="bg-pos-bg-secondary rounded-lg border border-pos-border-primary p-6 print:bg-white print:border-black">
            {/* Report Header */}
            <div className="border-b border-pos-border-primary pb-4 mb-6 print:border-black">
              <h2 className="text-2xl font-bold text-pos-text-primary">
                {reportData.reportType} Report
              </h2>
              <p className="text-pos-text-muted">Date: {reportData.reportDate}</p>
              <p className="text-pos-text-muted text-sm">
                Generated: {new Date(reportData.generatedAt).toLocaleString()}
              </p>
              <p className="text-pos-text-muted text-sm mt-2">
                📊 Showing completed orders from {reportData.reportDate}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold">{reportData.summary.totalOrders}</p>
                  </div>
                  <span className="text-4xl">📈</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Net Total</p>
                    <p className="text-3xl font-bold">{formatCurrency(reportData.summary.netTotal)}</p>
                  </div>
                  <span className="text-4xl">💰</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Avg Order Value</p>
                    <p className="text-3xl font-bold">{formatCurrency(reportData.summary.averageOrderValue)}</p>
                  </div>
                  <span className="text-4xl">💵</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-pos-text-primary mb-3">Financial Summary</h3>
              <div className="bg-pos-bg-primary rounded-lg p-4 border border-pos-border-secondary">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-pos-text-muted">Gross Total:</span>
                    <span className="font-semibold text-pos-text-primary">{formatCurrency(reportData.summary.grossTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pos-text-muted">Total Discount:</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(reportData.summary.totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pos-text-muted">Total Tax:</span>
                    <span className="font-semibold text-pos-text-primary">{formatCurrency(reportData.summary.totalTax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-pos-border-secondary pt-2">
                    <span className="text-pos-text-primary font-bold">Net Total:</span>
                    <span className="font-bold text-green-500">{formatCurrency(reportData.summary.netTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Sales */}
            {reportData.categorySales && reportData.categorySales.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-pos-text-primary mb-3">Sales by Category</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-pos-border-secondary">
                    <thead className="bg-pos-bg-tertiary">
                      <tr>
                        <th className="px-4 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Category</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Orders</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Quantity</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.categorySales.map((cat, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary">
                          <td className="px-4 py-2 text-pos-text-primary">{cat.category_name || 'Uncategorized'}</td>
                          <td className="px-4 py-2 text-right text-pos-text-muted">{cat.order_count}</td>
                          <td className="px-4 py-2 text-right text-pos-text-muted">{cat.total_quantity}</td>
                          <td className="px-4 py-2 text-right font-semibold text-pos-text-primary">{formatCurrency(cat.total_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Products */}
            {reportData.topProducts && reportData.topProducts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-pos-text-primary mb-3">Top Selling Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-pos-border-secondary">
                    <thead className="bg-pos-bg-tertiary">
                      <tr>
                        <th className="px-4 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Product</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Quantity Sold</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topProducts.map((product, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary">
                          <td className="px-4 py-2 text-pos-text-primary">{product.product_name}</td>
                          <td className="px-4 py-2 text-right text-pos-text-muted">{product.quantity_sold}</td>
                          <td className="px-4 py-2 text-right font-semibold text-pos-text-primary">{formatCurrency(product.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hourly Sales */}
            {reportData.hourlySales && reportData.hourlySales.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-pos-text-primary mb-3">Hourly Sales Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-pos-border-secondary">
                    <thead className="bg-pos-bg-tertiary">
                      <tr>
                        <th className="px-4 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Hour</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Orders</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.hourlySales.map((hour, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary">
                          <td className="px-4 py-2 text-pos-text-primary">{hour.hour}</td>
                          <td className="px-4 py-2 text-right text-pos-text-muted">{hour.order_count}</td>
                          <td className="px-4 py-2 text-right font-semibold text-pos-text-primary">{formatCurrency(hour.total_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Order List */}
            {reportData.orders && reportData.orders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-pos-text-primary mb-3">Order Details ({reportData.orders.length} orders)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-pos-border-secondary text-sm">
                    <thead className="bg-pos-bg-tertiary">
                      <tr>
                        <th className="px-3 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Order No</th>
                        <th className="px-3 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Time</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Gross</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Discount</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Tax</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders.map((order, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary">
                          <td className="px-3 py-2 text-pos-text-primary">{order.order_no || `#${order.id}`}</td>
                          <td className="px-3 py-2 text-pos-text-muted">{order.updated_at ? new Date(order.updated_at).toLocaleTimeString() : new Date(order.created_at).toLocaleTimeString()}</td>
                          <td className="px-3 py-2 text-right text-pos-text-muted">{formatCurrency(order.gross_total)}</td>
                          <td className="px-3 py-2 text-right text-red-500">{formatCurrency(order.discount)}</td>
                          <td className="px-3 py-2 text-right text-pos-text-muted">{formatCurrency(order.tax)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-pos-text-primary">{formatCurrency(order.net_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Z Report History or Empty State */
          reportType === 'Z' && !loading ? (
            <div className="bg-pos-bg-secondary rounded-lg border border-pos-border-primary p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-pos-text-primary">Recent Z Reports</h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-blue-500 hover:text-blue-400 font-semibold"
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
              
              {showHistory && zReportHistory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border border-pos-border-secondary">
                    <thead className="bg-pos-bg-tertiary">
                      <tr>
                        <th className="px-4 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Date</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Orders</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Net Total</th>
                        <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Generated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zReportHistory.map((report) => (
                        <tr key={report.id} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary">
                          <td className="px-4 py-2 text-pos-text-primary">{report.reportDate}</td>
                          <td className="px-4 py-2 text-right text-pos-text-muted">{report.summary.totalOrders}</td>
                          <td className="px-4 py-2 text-right font-semibold text-pos-text-primary">
                            {formatCurrency(report.summary.netTotal)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-pos-text-muted">
                            {new Date(report.generatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {showHistory && zReportHistory.length === 0 && (
                <p className="text-pos-text-muted text-center py-8">No Z Reports found in history</p>
              )}
            </div>
          ) : (
            <div className="bg-pos-bg-secondary rounded-lg border border-pos-border-primary p-12 text-center">
              <div className="text-6xl mb-4">{reportType === 'X' ? '📊' : '🔒'}</div>
              <h3 className="text-2xl font-bold text-pos-text-primary mb-2">
                {reportType} Report
              </h3>
              <p className="text-pos-text-muted text-lg mb-6">
                Select a date and click "Generate Report" to view sales data
              </p>
              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-pos-text-muted">
                  💡 Reports show only <strong>completed</strong> orders based on completion date
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
