const db = require('../config/database');

const ReportController = {
  /**
   * X Report - Non-resetting daily sales report
   * Shows current sales data without closing the register
   * Can be run multiple times during the day
   * 
   * FILTERING LOGIC:
   * - Can use either created_at OR completed_at field
   * - dateType parameter: 'created' or 'completed' (default)
   * - Filters by DATE(field) = selected date
   * - Only includes orders with status = 'completed' OR 'paid'
   * 
   * IMPORTANT: completed_at is set when order status changes to completed/paid
   * - Order created yesterday but completed today will appear in TODAY's report (if using completed_at)
   * - This is better for daily cash reconciliation
   */
  getXReport: (req, res) => {
    try {
      const { date, dateType = 'completed' } = req.query;
      const reportDate = date || new Date().toISOString().split('T')[0];
      
      // Choose which date field to use
      const dateField = dateType === 'created' ? 'created_at' : 'completed_at';
      
      // Get all completed orders for the specified date
      const orders = db.prepare(`
        SELECT * FROM orders 
        WHERE DATE(${dateField}) = ? 
        AND status IN ('completed', 'paid')
        ORDER BY ${dateField} DESC
      `).all(reportDate);

      // Calculate totals
      let totalSales = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      let totalOrders = orders.length;
      let grossTotal = 0;

      orders.forEach(order => {
        totalSales += order.net_total || 0;
        totalTax += order.tax || 0;
        totalDiscount += order.discount || 0;
        grossTotal += order.gross_total || 0;
      });

      // Get payment method breakdown (from order details/notes if tracked)
      const paymentMethods = {
        cash: 0,
        card: 0,
        other: 0
      };

      // Get category-wise sales
      const categorySales = db.prepare(`
        SELECT 
          c.name as category_name,
          COUNT(DISTINCT o.id) as order_count,
          SUM(od.qty) as total_quantity,
          SUM(od.total) as total_sales
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE DATE(o.${dateField}) = ?
        AND o.status IN ('completed', 'paid')
        GROUP BY c.id, c.name
        ORDER BY total_sales DESC
      `).all(reportDate);

      // Get top selling products
      const topProducts = db.prepare(`
        SELECT 
          p.name as product_name,
          SUM(od.qty) as quantity_sold,
          SUM(od.total) as total_revenue
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        WHERE DATE(o.${dateField}) = ?
        AND o.status IN ('completed', 'paid')
        GROUP BY p.id, p.name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `).all(reportDate);

      // Get hourly sales breakdown
      const hourlySales = db.prepare(`
        SELECT 
          strftime('%H:00', ${dateField}) as hour,
          COUNT(*) as order_count,
          SUM(net_total) as total_sales
        FROM orders
        WHERE DATE(${dateField}) = ?
        AND status IN ('completed', 'paid')
        GROUP BY strftime('%H', ${dateField})
        ORDER BY hour
      `).all(reportDate);

      const report = {
        reportType: 'X',
        reportDate,
        dateType,
        generatedAt: new Date().toISOString(),
        summary: {
          totalOrders,
          grossTotal: grossTotal.toFixed(2),
          totalDiscount: totalDiscount.toFixed(2),
          totalTax: totalTax.toFixed(2),
          netTotal: totalSales.toFixed(2),
          averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00'
        },
        paymentMethods,
        categorySales,
        topProducts,
        hourlySales,
        orders: orders.map(o => ({
          id: o.id,
          order_no: o.order_no,
          created_at: o.created_at,
          completed_at: o.completed_at,
          gross_total: o.gross_total,
          discount: o.discount,
          tax: o.tax,
          net_total: o.net_total
        }))
      };

      res.json({ success: true, data: report });
    } catch (error) {
      console.error('X Report error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate X Report' });
    }
  },

  /**
   * Z Report - End-of-day report with reset capability
   * Shows final sales totals and can mark the day as closed
   * Should only be run once at end of business day
   * 
   * FILTERING LOGIC:
   * - Can use either created_at OR completed_at field
   * - dateType parameter: 'created' or 'completed' (default)
   * - Filters by DATE(field) = selected date
   * - Only includes orders with status = 'completed' OR 'paid'
   * - Saves to z_reports table when markAsClosed=true
   */
  getZReport: (req, res) => {
    try {
      const { date, markAsClosed, dateType = 'completed' } = req.query;
      const reportDate = date || new Date().toISOString().split('T')[0];
      
      // Check if Z report already exists for this date
      const existingReport = db.prepare(`
        SELECT * FROM z_reports WHERE report_date = ?
      `).get(reportDate);

      if (existingReport && !req.query.force) {
        return res.json({ 
          success: true, 
          data: JSON.parse(existingReport.report_data),
          message: 'Z Report already generated for this date. Use force=true to regenerate.'
        });
      }

      // Choose which date field to use
      const dateField = dateType === 'created' ? 'created_at' : 'completed_at';

      // Get all completed orders for the specified date based on completed_at
      const orders = db.prepare(`
        SELECT * FROM orders 
        WHERE DATE(${dateField}) = ? 
        AND status IN ('completed', 'paid')
        ORDER BY ${dateField} DESC
      `).all(reportDate);

      // Calculate totals
      let totalSales = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      let totalOrders = orders.length;
      let grossTotal = 0;

      orders.forEach(order => {
        totalSales += order.net_total || 0;
        totalTax += order.tax || 0;
        totalDiscount += order.discount || 0;
        grossTotal += order.gross_total || 0;
      });

      // Get payment method breakdown
      const paymentMethods = {
        cash: 0,
        card: 0,
        other: 0
      };

      // Get category-wise sales
      const categorySales = db.prepare(`
        SELECT 
          c.name as category_name,
          COUNT(DISTINCT o.id) as order_count,
          SUM(od.qty) as total_quantity,
          SUM(od.total) as total_sales
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE DATE(o.${dateField}) = ?
        AND o.status IN ('completed', 'paid')
        GROUP BY c.id, c.name
        ORDER BY total_sales DESC
      `).all(reportDate);

      // Get top selling products
      const topProducts = db.prepare(`
        SELECT 
          p.name as product_name,
          SUM(od.qty) as quantity_sold,
          SUM(od.total) as total_revenue
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        WHERE DATE(o.${dateField}) = ?
        AND o.status IN ('completed', 'paid')
        GROUP BY p.id, p.name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `).all(reportDate);

      // Get hourly sales breakdown
      const hourlySales = db.prepare(`
        SELECT 
          strftime('%H:00', ${dateField}) as hour,
          COUNT(*) as order_count,
          SUM(net_total) as total_sales
        FROM orders
        WHERE DATE(${dateField}) = ?
        AND status IN ('completed', 'paid')
        GROUP BY strftime('%H', ${dateField})
        ORDER BY hour
      `).all(reportDate);

      const report = {
        reportType: 'Z',
        reportDate,
        dateType,
        generatedAt: new Date().toISOString(),
        isClosed: markAsClosed === 'true',
        summary: {
          totalOrders,
          grossTotal: grossTotal.toFixed(2),
          totalDiscount: totalDiscount.toFixed(2),
          totalTax: totalTax.toFixed(2),
          netTotal: totalSales.toFixed(2),
          averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00'
        },
        paymentMethods,
        categorySales,
        topProducts,
        hourlySales,
        orders: orders.map(o => ({
          id: o.id,
          order_no: o.order_no,
          created_at: o.created_at,
          completed_at: o.completed_at,
          gross_total: o.gross_total,
          discount: o.discount,
          tax: o.tax,
          net_total: o.net_total
        }))
      };

      // Save Z report to database if marking as closed
      if (markAsClosed === 'true') {
        if (existingReport) {
          db.prepare(`
            UPDATE z_reports 
            SET report_data = ?, generated_at = CURRENT_TIMESTAMP
            WHERE report_date = ?
          `).run(JSON.stringify(report), reportDate);
        } else {
          db.prepare(`
            INSERT INTO z_reports (report_date, report_data)
            VALUES (?, ?)
          `).run(reportDate, JSON.stringify(report));
        }
      }

      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Z Report error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate Z Report' });
    }
  },

  /**
   * Get all historical Z reports
   */
  getZReportHistory: (req, res) => {
    try {
      const { startDate, endDate, limit = 30 } = req.query;
      
      let query = 'SELECT * FROM z_reports';
      const params = [];
      
      if (startDate && endDate) {
        query += ' WHERE report_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' WHERE report_date >= ?';
        params.push(startDate);
      } else if (endDate) {
        query += ' WHERE report_date <= ?';
        params.push(endDate);
      }
      
      query += ' ORDER BY report_date DESC LIMIT ?';
      params.push(parseInt(limit));
      
      const reports = db.prepare(query).all(...params);
      
      const formattedReports = reports.map(r => ({
        id: r.id,
        reportDate: r.report_date,
        generatedAt: r.generated_at,
        summary: JSON.parse(r.report_data).summary
      }));

      res.json({ success: true, data: formattedReports });
    } catch (error) {
      console.error('Z Report history error:', error);
      res.status(500).json({ success: false, error: 'Failed to get Z Report history' });
    }
  },

  /**
   * Get a specific historical Z report
   */
  getZReportById: (req, res) => {
    try {
      const { id } = req.params;
      
      const report = db.prepare('SELECT * FROM z_reports WHERE id = ?').get(id);
      
      if (!report) {
        return res.status(404).json({ success: false, error: 'Z Report not found' });
      }

      res.json({ 
        success: true, 
        data: {
          id: report.id,
          reportDate: report.report_date,
          generatedAt: report.generated_at,
          ...JSON.parse(report.report_data)
        }
      });
    } catch (error) {
      console.error('Get Z Report error:', error);
      res.status(500).json({ success: false, error: 'Failed to get Z Report' });
    }
  }
};

module.exports = ReportController;
