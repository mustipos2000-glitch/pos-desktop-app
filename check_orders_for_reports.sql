-- ============================================
-- SQL Script to Check Orders for X/Z Reports
-- ============================================

-- 1. Check if orders table has created_at column
PRAGMA table_info(orders);

-- 2. Count total orders in database
SELECT 'Total Orders in Database:' as info, COUNT(*) as count FROM orders;

-- 3. Count orders by status
SELECT 'Orders by Status:' as info;
SELECT status, COUNT(*) as count, SUM(net_total) as total_amount
FROM orders 
GROUP BY status;

-- 4. Check orders for TODAY
SELECT 'Orders for TODAY:' as info;
SELECT id, order_no, status, created_at, net_total 
FROM orders 
WHERE DATE(created_at) = DATE('now')
ORDER BY created_at DESC;

-- 5. Check COMPLETED orders for TODAY
SELECT 'COMPLETED Orders for TODAY (will appear in reports):' as info;
SELECT id, order_no, status, created_at, net_total 
FROM orders 
WHERE DATE(created_at) = DATE('now')
AND status IN ('completed', 'paid')
ORDER BY created_at DESC;

-- 6. Check orders for YESTERDAY
SELECT 'Orders for YESTERDAY:' as info;
SELECT id, order_no, status, created_at, net_total 
FROM orders 
WHERE DATE(created_at) = DATE('now', '-1 day')
ORDER BY created_at DESC;

-- 7. Check recent orders (last 10)
SELECT 'Recent 10 Orders:' as info;
SELECT id, order_no, status, DATE(created_at) as date, created_at, net_total 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Check if any Z Reports exist
SELECT 'Saved Z Reports:' as info;
SELECT id, report_date, generated_at 
FROM z_reports 
ORDER BY report_date DESC;

-- ============================================
-- QUICK FIX: If you have orders but they're not 'completed'
-- ============================================

-- Uncomment and run this to mark recent orders as completed:
-- UPDATE orders 
-- SET status = 'completed' 
-- WHERE status = 'pending' 
-- AND DATE(created_at) = DATE('now');

-- ============================================
-- CREATE TEST DATA: If you have NO orders
-- ============================================

-- Uncomment and run this to create test orders for TODAY:
/*
-- Test Order 1
INSERT INTO orders (tax, status, note, gross_total, net_total, discount, order_no, created_at)
VALUES (5.0, 'completed', 'Test order 1', 50.00, 55.00, 0, 'TEST-001', datetime('now'));

-- Test Order 2
INSERT INTO orders (tax, status, note, gross_total, net_total, discount, order_no, created_at)
VALUES (3.0, 'completed', 'Test order 2', 30.00, 33.00, 5.00, 'TEST-002', datetime('now'));

-- Test Order 3
INSERT INTO orders (tax, status, note, gross_total, net_total, discount, order_no, created_at)
VALUES (4.0, 'completed', 'Test order 3', 40.00, 44.00, 0, 'TEST-003', datetime('now'));

-- Verify test orders were created
SELECT 'Test Orders Created:' as info;
SELECT id, order_no, status, created_at, net_total 
FROM orders 
WHERE order_no LIKE 'TEST-%';
*/

-- ============================================
-- EXPECTED RESULTS FOR REPORTS
-- ============================================

-- This query shows what X/Z Report will display:
SELECT 
  'Report Preview for TODAY:' as info,
  COUNT(*) as total_orders,
  SUM(gross_total) as gross_total,
  SUM(discount) as total_discount,
  SUM(tax) as total_tax,
  SUM(net_total) as net_total,
  ROUND(AVG(net_total), 2) as avg_order_value
FROM orders 
WHERE DATE(created_at) = DATE('now')
AND status IN ('completed', 'paid');
