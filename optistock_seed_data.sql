-- =====================================================
-- OptiStock — Seed Data (Sample Users + Test Data)
-- I-run ito sa MySQL Workbench
-- =====================================================

USE optistock_db;

-- ── USERS ─────────────────────────────────────────────────────────────────────
-- Password is NULL = any password will be accepted (dev mode)
INSERT INTO users (id, email, name, password_hash, role, status) VALUES
('EMP-001', 'admin@optistock.com',   'Admin',           NULL, 'Store Admin',     'Active'),
('EMP-002', 'manager@optistock.com', 'Store Manager',   NULL, 'Store Manager',   'Active'),
('EMP-003', 'cashier@optistock.com', 'Cashier One',     NULL, 'POS Cashier',     'Active'),
('EMP-004', 'clerk@optistock.com',   'Inventory Clerk', NULL, 'Inventory Clerk', 'Active');

-- ── CATEGORIES ────────────────────────────────────────────────────────────────
INSERT INTO categories (id, name, description, product_count) VALUES
('C001', 'Beverages',    'Drinks and refreshments',        5),
('C002', 'Snacks',       'Chips, biscuits, and finger food',4),
('C003', 'Dairy',        'Milk, cheese, and dairy products',3),
('C004', 'Personal Care','Hygiene and grooming products',   4),
('C005', 'Household',   'Cleaning and home essentials',    3);

-- ── SUPPLIERS ─────────────────────────────────────────────────────────────────
INSERT INTO suppliers (id, company_name, contact_person, email, phone) VALUES
('S001', 'Universal Distributors',  'Juan Dela Cruz', 'juan@universal.com',  '09171234567'),
('S002', 'Metro Supply Co.',        'Maria Santos',   'maria@metro.com',     '09281234567'),
('S003', 'Luzon Trading Inc.',      'Pedro Reyes',    'pedro@luzon.com',     '09391234567');

-- ── PRODUCTS ──────────────────────────────────────────────────────────────────
INSERT INTO products (id, sku, name, category_id, supplier_id, cost_price, selling_price, stock, reorder_level, status) VALUES
('P001', 'BEV-001', 'Coca-Cola 1.5L',        'C001', 'S001',  42.00,  65.00,  3,  10, 'active'),
('P002', 'BEV-002', 'Royal TRU-ORANGE 1L',   'C001', 'S001',  30.00,  48.00,  5,  10, 'active'),
('P003', 'BEV-003', 'Mineral Water 500ml',   'C001', 'S002',   8.00,  15.00, 80,  20, 'active'),
('P004', 'BEV-004', 'Iced Tea 1L',           'C001', 'S002',  25.00,  40.00, 45,  15, 'active'),
('P005', 'SNK-001', 'Piattos Cheese 85g',    'C002', 'S002',  28.00,  42.00,  2,   8, 'active'),
('P006', 'SNK-002', 'Oishi Prawn Crackers',  'C002', 'S001',  20.00,  32.00, 35,  10, 'active'),
('P007', 'SNK-003', 'Rebisco Crackers',      'C002', 'S003',  15.00,  25.00, 60,  15, 'active'),
('P008', 'DAI-001', 'Bear Brand 300g',       'C003', 'S001',  85.00, 120.00,  0,  10, 'active'),
('P009', 'DAI-002', 'Eden Cheese 165g',      'C003', 'S002',  60.00,  88.00, 18,  10, 'active'),
('P010', 'PER-001', 'Safeguard Bar Soap',    'C004', 'S003',  30.00,  48.00, 55,  15, 'active'),
('P011', 'PER-002', 'Colgate Toothpaste 75g','C004', 'S001',  40.00,  62.00, 40,  10, 'active'),
('P012', 'HOU-001', 'Mr. Clean 500ml',       'C005', 'S002',  55.00,  82.00,  4,   8, 'active');

-- ── DAILY SALES SUMMARY (last 12 days) ───────────────────────────────────────
INSERT INTO daily_sales_summary (sale_date, total_revenue, total_transactions, total_items_sold) VALUES
(CURDATE() - INTERVAL 11 DAY, 4250.00, 12, 38),
(CURDATE() - INTERVAL 10 DAY, 5100.50, 15, 47),
(CURDATE() - INTERVAL  9 DAY, 3800.00, 10, 32),
(CURDATE() - INTERVAL  8 DAY, 6200.75, 18, 61),
(CURDATE() - INTERVAL  7 DAY, 7500.00, 22, 75),
(CURDATE() - INTERVAL  6 DAY, 4900.25, 14, 44),
(CURDATE() - INTERVAL  5 DAY, 5650.00, 16, 52),
(CURDATE() - INTERVAL  4 DAY, 8100.50, 24, 88),
(CURDATE() - INTERVAL  3 DAY, 6300.00, 19, 65),
(CURDATE() - INTERVAL  2 DAY, 7200.75, 21, 78),
(CURDATE() - INTERVAL  1 DAY, 5400.00, 15, 49),
(CURDATE(),                   3100.50,  9, 30);

-- ── PRODUCT SALES SUMMARY (this month) ───────────────────────────────────────
INSERT INTO product_sales_summary (product_id, sale_date, quantity_sold, revenue) VALUES
('P003', CURDATE() - INTERVAL 5 DAY, 20, 300.00),
('P007', CURDATE() - INTERVAL 5 DAY, 15, 375.00),
('P010', CURDATE() - INTERVAL 5 DAY, 12, 576.00),
('P006', CURDATE() - INTERVAL 4 DAY, 18, 576.00),
('P011', CURDATE() - INTERVAL 4 DAY, 10, 620.00),
('P003', CURDATE() - INTERVAL 3 DAY, 25, 375.00),
('P007', CURDATE() - INTERVAL 3 DAY, 20, 500.00),
('P009', CURDATE() - INTERVAL 2 DAY,  8, 704.00),
('P004', CURDATE() - INTERVAL 2 DAY, 14, 560.00),
('P003', CURDATE() - INTERVAL 1 DAY, 30, 450.00),
('P010', CURDATE() - INTERVAL 1 DAY, 16, 768.00),
('P006', CURDATE(),                  10, 320.00),
('P011', CURDATE(),                   8, 496.00);
