CREATE DATABASE IF NOT EXISTS optistock_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE optistock_db;

-- ── categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            VARCHAR(20)   NOT NULL PRIMARY KEY,   -- C001, C002…
  name          VARCHAR(50)  NOT NULL UNIQUE,
  description   TEXT,
  product_count INT           NOT NULL DEFAULT 0,     -- auto-updated via trigger
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP
);

-- ── suppliers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id                 VARCHAR(20)  NOT NULL PRIMARY KEY,   -- S001, S002…
  company_name       VARCHAR(50) NOT NULL UNIQUE,
  contact_person     VARCHAR(50),
  email              VARCHAR(50),
  phone              VARCHAR(30),
  address            TEXT,
  products_supplied  INT          NOT NULL DEFAULT 0,     -- auto-updated
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP
);

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(20)  NOT NULL PRIMARY KEY,   -- EMP-001, POS-T01…
  email         VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255),                        -- bcrypt
  role          ENUM('Store Admin','Store Manager','POS Cashier','Inventory Clerk') NOT NULL,
  status        ENUM('Active','Locked','Pending')    NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP
);

-- ── products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(20)    NOT NULL PRIMARY KEY,   -- P001, P002…
  sku           VARCHAR(50)    NOT NULL UNIQUE,         -- Barcode / SKU
  name          VARCHAR(50)   NOT NULL,
  category_id   VARCHAR(20),
  supplier_id   VARCHAR(20),
  cost_price    DECIMAL(12,2)  NOT NULL,                -- Purchase cost
  selling_price DECIMAL(12,2)  NOT NULL,                -- Retail price
  stock         INT            NOT NULL DEFAULT 0,      -- Current quantity
  reorder_level INT            NOT NULL DEFAULT 0,      -- Low-stock threshold
  status        ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ── stock_ledger ─────────────────────────────────────────────────────────────
-- Every stock movement (in / out / adjustment)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tx_id           VARCHAR(40)   NOT NULL UNIQUE,   -- TXN-20260626-…
  product_id      VARCHAR(20)   NOT NULL,
  type            ENUM('Stock In','Stock Out','Adjustment') NOT NULL,
  qty             INT           NOT NULL,
  balance_after   INT           NOT NULL,           -- Running balance
  user_id         VARCHAR(20),                      -- Who did it
  reference_type  VARCHAR(20),                      -- e.g. POS, TO, Manual
  reference_id    VARCHAR(40),                      -- e.g. receipt_no
  notes           TEXT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ledger_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_ledger_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

-- ── notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(20),
  title        VARCHAR(50)  NOT NULL,
  description  TEXT,
  type         VARCHAR(40),                         -- stock_alert, sale, system…
  is_read      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── stock_adjustments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id                 BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  adjustment_number  VARCHAR(40)   NOT NULL UNIQUE,
  product_id         VARCHAR(20)   NOT NULL,
  adjustment_type    ENUM('Increase','Decrease','Correction') NOT NULL,
  qty                INT           NOT NULL,
  reason             VARCHAR(255),
  adjusted_by        VARCHAR(20),
  status             ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_adj_product FOREIGN KEY (product_id)    REFERENCES products(id),
  CONSTRAINT fk_adj_user    FOREIGN KEY (adjusted_by)   REFERENCES users(id)
);

-- ── purchase_orders ──────────────────────────────────────────────────────────
-- Purchase Orders from supplier (Module 1 - Inventory)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  po_number    VARCHAR(40)   NOT NULL UNIQUE,              -- PO-20260626-001
  supplier_id  VARCHAR(20)   NOT NULL,
  created_by   VARCHAR(20),                                -- User who created
  status       ENUM('Pending','Received','Cancelled') NOT NULL DEFAULT 'Pending',
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_po_supplier  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_po_created   FOREIGN KEY (created_by)  REFERENCES users(id)
                             ON DELETE SET NULL
);

-- ── purchase_order_items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id          BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  po_id       BIGINT         NOT NULL,
  product_id  VARCHAR(20)    NOT NULL,
  qty         INT            NOT NULL,
  unit_cost   DECIMAL(12,2)  NOT NULL,
  subtotal    DECIMAL(14,2)  GENERATED ALWAYS AS (qty * unit_cost) STORED,

  CONSTRAINT fk_poi_po      FOREIGN KEY (po_id)       REFERENCES purchase_orders(id)
                            ON DELETE CASCADE,
  CONSTRAINT fk_poi_product FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 2 — POS / SALES
-- Responsibility: Sales transactions, order items, payment processing
-- ─────────────────────────────────────────────────────────────────────────────

-- ── sales_orders ─────────────────────────────────────────────────────────────
-- Every sale transaction
CREATE TABLE IF NOT EXISTS sales_orders (
  receipt_no      VARCHAR(30)    NOT NULL PRIMARY KEY,   -- Receipt number
  cashier_id      VARCHAR(20)    NOT NULL,               -- Who processed
  total           DECIMAL(12,2)  NOT NULL,               -- Total amount
  paid            DECIMAL(12,2)  NOT NULL,               -- Amount paid
  change_given    DECIMAL(12,2)  NOT NULL,               -- Change
  payment_method  ENUM('Cash','GCash','Card') NOT NULL,
  status          ENUM('Completed','Refunded','Cancelled') NOT NULL DEFAULT 'Completed',
  items_count     INT            NOT NULL,               -- Number of items
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_cashier FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- ── order_items ──────────────────────────────────────────────────────────────
-- Items in each sale
CREATE TABLE IF NOT EXISTS order_items (
  id          BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  receipt_no  VARCHAR(30)    NOT NULL,
  product_id  VARCHAR(20)    NOT NULL,
  qty         INT            NOT NULL,
  price       DECIMAL(12,2)  NOT NULL,   -- Snapshot of selling_price at time of sale
  subtotal    DECIMAL(12,2)  GENERATED ALWAYS AS (qty * price) STORED,

  CONSTRAINT fk_item_receipt  FOREIGN KEY (receipt_no)  REFERENCES sales_orders(receipt_no) ON DELETE CASCADE,
  CONSTRAINT fk_item_product  FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ── product_sales_summary ────────────────────────────────────────────────────
-- Daily per-product sales (auto-materialized by backend)
CREATE TABLE IF NOT EXISTS product_sales_summary (
  id            BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id    VARCHAR(20)    NOT NULL,
  sale_date     DATE           NOT NULL,
  quantity_sold INT            NOT NULL DEFAULT 0,
  revenue       DECIMAL(14,2)  NOT NULL DEFAULT 0,

  CONSTRAINT fk_pss_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── daily_sales_summary ──────────────────────────────────────────────────────
-- Daily aggregated sales totals
CREATE TABLE IF NOT EXISTS daily_sales_summary (
  id                  BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_date           DATE           NOT NULL UNIQUE,
  total_revenue       DECIMAL(14,2)  NOT NULL DEFAULT 0,
  total_transactions  INT            NOT NULL DEFAULT 0,
  total_items_sold    INT            NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 3 — DASHBOARD VIEWS (Read-Only)
-- Responsibility: Analytics, reports, visualization
-- ─────────────────────────────────────────────────────────────────────────────

-- ── v_best_sellers ───────────────────────────────────────────────────────────
-- Top products this month (used by /api/dashboard/best-sellers/)
CREATE OR REPLACE VIEW v_best_sellers AS
SELECT
  RANK() OVER (ORDER BY SUM(pss.quantity_sold) DESC) AS `rank`,
  p.id,
  p.name,
  c.name            AS category,
  SUM(pss.quantity_sold) AS quantity_sold,
  SUM(pss.revenue)  AS revenue
FROM product_sales_summary pss
JOIN products    p ON pss.product_id  = p.id
JOIN categories  c ON p.category_id   = c.id
WHERE pss.sale_date >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY p.id, p.name, c.name;

-- ── v_category_breakdown ─────────────────────────────────────────────────────
-- Sales % per category (used by /api/dashboard/category-breakdown/)
CREATE OR REPLACE VIEW v_category_breakdown AS
SELECT
  c.id,
  c.name,
  ROUND(
    SUM(pss.revenue) * 100.0
    / NULLIF((SELECT SUM(revenue) FROM product_sales_summary
              WHERE sale_date >= DATE_FORMAT(NOW(), '%Y-%m-01')), 0),
    1
  )                 AS value,
  '#4f8ef7'         AS color    -- backend or seed data should set per-category colors
FROM product_sales_summary pss
JOIN products    p ON pss.product_id = p.id
JOIN categories  c ON p.category_id  = c.id
WHERE pss.sale_date >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY c.id, c.name;

-- ── v_daily_sales_chart ──────────────────────────────────────────────────────
-- Last 12 days of sales (used by /api/dashboard/daily-sales-chart/)
CREATE OR REPLACE VIEW v_daily_sales_chart AS
SELECT
  DATE_FORMAT(sale_date, '%b %d')  AS `date`,
  total_revenue                     AS sales,
  total_transactions                AS txn
FROM daily_sales_summary
ORDER BY sale_date DESC
LIMIT 12;

-- ── v_inventory_report ───────────────────────────────────────────────────────
-- Full inventory status (used by /api/dashboard/inventory-report/)
-- Shows ALL active products with stock status
CREATE OR REPLACE VIEW v_inventory_report AS
SELECT
  p.id,
  p.sku,
  p.name,
  c.name                       AS category,
  p.stock,
  ROUND(p.stock * p.cost_price, 2) AS value,
  CASE
    WHEN p.stock = 0               THEN 'Out of Stock'
    WHEN p.stock <= p.reorder_level THEN 'Critical'
    WHEN p.stock <= p.reorder_level * 1.5 THEN 'Low Stock'
    ELSE 'In Stock'
  END                          AS status
FROM products   p
JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active';

-- ── v_low_stock_alerts ───────────────────────────────────────────────────────
-- Items needing restock (used by /api/dashboard/low-stock-alerts/)
-- Shows ONLY products below/at reorder level
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT
  p.id,
  p.sku,
  p.name,
  c.name              AS category,
  p.stock,
  p.reorder_level     AS reorder,
  CASE
    WHEN p.stock = 0                          THEN 'critical'
    WHEN p.stock <= p.reorder_level * 0.5     THEN 'critical'
    ELSE 'low'
  END                 AS status
FROM products   p
JOIN categories c ON p.category_id = c.id
WHERE p.status  = 'active'
  AND p.stock  <= p.reorder_level;

-- ─────────────────────────────────────────────────────────────────────────────
-- FOREIGN KEY CROSS-REFERENCE (summary)
-- ─────────────────────────────────────────────────────────────────────────────
--  Table                  FK Column       References
--  products               category_id     categories.id
--  products               supplier_id     suppliers.id
--  stock_ledger           product_id      products.id
--  stock_ledger           user_id         users.id
--  stock_adjustments      product_id      products.id
--  stock_adjustments      adjusted_by     users.id
--  order_items            product_id      products.id
--  order_items            receipt_no      sales_orders.receipt_no  ON DELETE CASCADE
--  sales_orders           cashier_id      users.id
--  product_sales_summary  product_id      products.id
--  notifications          user_id         users.id
-- ─────────────────────────────────────────────────────────────────────────────
