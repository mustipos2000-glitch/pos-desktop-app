import React, { useState, useEffect } from 'react';
import ApiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('X');
  const [reportData, setReportData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    try {
      const response = await ApiService.getReportHistory(10);
      if (response.success) {
        setReportHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load report history:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === 'X') {
        response = await ApiService.getXReport(selectedDate);
      } else {
        response = await ApiService.getZReport(selectedDate);
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

  const printReport = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return `€${parseFloat(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="h-screen flex flex-col bg-pos-bg-primary overflow-hidden">
      {/* Header */}
      <div className="bg-pos-bg-secondary border-b border-pos-border-primary p-3 print:hidden">
        {/* Top Bar - Title and Action Buttons */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-semibold shadow-md hover:shadow-lg border border-gray-600"
            >
              <span className="text-lg">←</span>
              <span>Back to POS</span>
            </button>
            <h1 className="text-lg font-bold text-pos-text-primary">Sales Reports</h1>
          </div>
          
          {/* Action Buttons - Right Corner */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
            >
              {loading ? '⏳ Generating...' : '📊 Generate Report'}
            </button>
            {reportData && (
              <button
                onClick={printReport}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
              >
                🖨️ Print
              </button>
            )}
          </div>
        </div>
        
        {/* Report Type Selection */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setReportType('X')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm ${
              reportType === 'X'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md scale-105'
                : 'bg-pos-bg-tertiary text-pos-text-muted hover:bg-pos-interactive-hover hover:shadow-md'
            }`}
          >
            📊 X Report (Current Sales)
          </button>
          <button
            onClick={() => setReportType('Z')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm ${
              reportType === 'Z'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                : 'bg-pos-bg-tertiary text-pos-text-muted hover:bg-pos-interactive-hover hover:shadow-md'
            }`}
          >
            🔒 Z Report (End of Day)
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-600/50 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-xl">{reportType === 'X' ? '📊' : '🔒'}</span>
            <div className="flex-1">
              <p className="text-xs text-white font-semibold mb-1">
                {reportType === 'X' ? 'X Report - Current Sales' : 'Z Report - End of Day'}
              </p>
              <p className="text-xs text-blue-100 mb-1.5">
                {reportType === 'X' ? (
                  <>Shows all completed orders for the selected date. Can be generated multiple times.</>
                ) : (
                  <>Shows final sales totals for the day. Generate once at end of business day.</>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-blue-200 bg-blue-900/30 rounded px-2 py-0.5 inline-block">
                <span>✅</span>
                <span>Shows orders with status = <strong>completed</strong> or <strong>paid</strong> based on completion time</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
        {reportData ? (
          <div className="bg-pos-bg-secondary rounded-lg border border-pos-border-primary p-4 print:bg-white print:border-black">
            {/* Report Header */}
            <div className="border-b border-pos-border-primary pb-3 mb-4 print:border-black">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{reportData.reportType === 'X' ? '📊' : '🔒'}</span>
                <h2 className="text-xl font-bold text-pos-text-primary">
                  {reportData.reportType} Report
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-pos-bg-tertiary px-2 py-1 rounded">
                  <span>📅</span>
                  <span className="text-pos-text-muted">Date:</span>
                  <span className="text-pos-text-primary font-semibold">{reportData.reportDate}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-pos-bg-tertiary px-2 py-1 rounded">
                  <span>🕐</span>
                  <span className="text-pos-text-muted">Generated:</span>
                  <span className="text-pos-text-primary font-semibold">{new Date(reportData.generatedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-600/50 px-2 py-1 rounded">
                  <span>✅</span>
                  <span className="text-blue-200">Showing completed orders from {reportData.reportDate}</span>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium mb-0.5">Total Orders</p>
                    <p className="text-2xl font-bold">{reportData.summary.totalOrders}</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-2">
                    <span className="text-3xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs font-medium mb-0.5">Net Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.netTotal)}</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-2">
                    <span className="text-3xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-medium mb-0.5">Avg Order Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary.averageOrderValue)}</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-2">
                    <span className="text-3xl">💵</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-pos-text-primary mb-2 flex items-center gap-1.5">
                <span className="text-lg">💳</span>
                <span>Financial Summary</span>
              </h3>
              <div className="bg-pos-bg-primary rounded-lg p-3 border border-pos-border-secondary shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center p-2 bg-pos-bg-secondary rounded text-sm">
                    <span className="text-pos-text-muted font-medium">Gross Total:</span>
                    <span className="font-bold text-pos-text-primary">{formatCurrency(reportData.summary.grossTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-pos-bg-secondary rounded text-sm">
                    <span className="text-pos-text-muted font-medium">Total Discount:</span>
                    <span className="font-bold text-red-500">-{formatCurrency(reportData.summary.totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-pos-bg-secondary rounded text-sm">
                    <span className="text-pos-text-muted font-medium">Total Tax:</span>
                    <span className="font-bold text-pos-text-primary">{formatCurrency(reportData.summary.totalTax)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-green-600/20 to-green-700/20 border border-green-600 rounded text-sm">
                    <span className="text-pos-text-primary font-bold">Net Total:</span>
                    <span className="font-bold text-green-500 text-base">{formatCurrency(reportData.summary.netTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Sales */}
            {reportData.categorySales && reportData.categorySales.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-bold text-pos-text-primary mb-2 flex items-center gap-1.5">
                  <span className="text-lg">📂</span>
                  <span>Sales by Category</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-pos-border-secondary shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-pos-bg-tertiary to-pos-bg-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left text-pos-text-primary font-semibold border-b border-pos-border-secondary">Category</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Orders</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Quantity</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.categorySales.map((cat, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors">
                          <td className="px-3 py-2 text-pos-text-primary">{cat.category_name || 'Uncategorized'}</td>
                          <td className="px-3 py-2 text-right text-pos-text-muted">{cat.order_count}</td>
                          <td className="px-3 py-2 text-right text-pos-text-muted">{cat.total_quantity}</td>
                          <td className="px-3 py-2 text-right font-semibold text-green-500">{formatCurrency(cat.total_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Products */}
            {reportData.topProducts && reportData.topProducts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-bold text-pos-text-primary mb-2 flex items-center gap-1.5">
                  <span className="text-lg">🏆</span>
                  <span>Top Selling Products</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-pos-border-secondary shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-pos-bg-tertiary to-pos-bg-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left text-pos-text-primary font-semibold border-b border-pos-border-secondary">Product</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Quantity Sold</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topProducts.map((product, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors">
                          <td className="px-3 py-2 text-pos-text-primary">{product.product_name}</td>
                          <td className="px-3 py-2 text-right text-pos-text-muted">{product.quantity_sold}</td>
                          <td className="px-3 py-2 text-right font-semibold text-green-500">{formatCurrency(product.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hourly Sales */}
            {reportData.hourlySales && reportData.hourlySales.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-bold text-pos-text-primary mb-2 flex items-center gap-1.5">
                  <span className="text-lg">⏰</span>
                  <span>Hourly Sales Breakdown</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-pos-border-secondary shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-pos-bg-tertiary to-pos-bg-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left text-pos-text-primary font-semibold border-b border-pos-border-secondary">Hour</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Orders</th>
                        <th className="px-3 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.hourlySales.map((hour, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors">
                          <td className="px-3 py-2 text-pos-text-primary">{hour.hour}</td>
                          <td className="px-3 py-2 text-right text-pos-text-muted">{hour.order_count}</td>
                          <td className="px-3 py-2 text-right font-semibold text-green-500">{formatCurrency(hour.total_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Order List */}
            {reportData.orders && reportData.orders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-bold text-pos-text-primary mb-2 flex items-center gap-1.5">
                  <span className="text-lg">📋</span>
                  <span>Order Details ({reportData.orders.length} orders)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-pos-border-secondary shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-pos-bg-tertiary to-pos-bg-secondary">
                      <tr>
                        <th className="px-2 py-2 text-left text-pos-text-primary font-semibold border-b border-pos-border-secondary">Order No</th>
                        <th className="px-2 py-2 text-left text-pos-text-primary font-semibold border-b border-pos-border-secondary">Time</th>
                        <th className="px-2 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Gross</th>
                        <th className="px-2 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Discount</th>
                        <th className="px-2 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Tax</th>
                        <th className="px-2 py-2 text-right text-pos-text-primary font-semibold border-b border-pos-border-secondary">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders.map((order, idx) => (
                        <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors">
                          <td className="px-2 py-2 text-pos-text-primary">{order.order_no || `#${order.id}`}</td>
                          <td className="px-2 py-2 text-pos-text-muted">{order.updated_at ? new Date(order.updated_at).toLocaleTimeString() : new Date(order.created_at).toLocaleTimeString()}</td>
                          <td className="px-2 py-2 text-right text-pos-text-muted">{formatCurrency(order.gross_total)}</td>
                          <td className="px-2 py-2 text-right text-red-500">{formatCurrency(order.discount)}</td>
                          <td className="px-2 py-2 text-right text-pos-text-muted">{formatCurrency(order.tax)}</td>
                          <td className="px-2 py-2 text-right font-semibold text-green-500">{formatCurrency(order.net_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : !loading ? (
          <div className="bg-pos-bg-secondary rounded-lg border border-pos-border-primary p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-pos-text-primary">Recent Daily Reports</h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 text-blue-500 hover:text-blue-400 font-medium"
              >
                {showHistory ? 'Hide' : 'Show'} History
              </button>
            </div>
            
            {showHistory && reportHistory.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border border-pos-border-secondary">
                  <thead className="bg-pos-bg-tertiary">
                    <tr>
                      <th className="px-4 py-2 text-left text-pos-text-primary border-b border-pos-border-secondary">Date</th>
                      <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Orders</th>
                      <th className="px-4 py-2 text-right text-pos-text-primary border-b border-pos-border-secondary">Net Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportHistory.map((report, idx) => (
                      <tr key={idx} className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary">
                        <td className="px-4 py-2 text-pos-text-primary">{report.reportDate}</td>
                        <td className="px-4 py-2 text-right text-pos-text-muted">{report.summary.totalOrders}</td>
                        <td className="px-4 py-2 text-right font-semibold text-pos-text-primary">
                          {formatCurrency(report.summary.netTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {showHistory && reportHistory.length === 0 && (
              <p className="text-pos-text-muted text-center py-8">No reports found in history</p>
            )}
            
            {!showHistory && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{reportType === 'X' ? '📊' : '🔒'}</div>
                <h3 className="text-2xl font-bold text-pos-text-primary mb-2">
                  {reportType} Report
                </h3>
                <p className="text-pos-text-muted mb-4">
                  Select a date and click "Generate Report" to view sales data
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReportsPage;
