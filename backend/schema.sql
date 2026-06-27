CREATE TABLE IF NOT EXISTS saved_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  report_type VARCHAR(50) NOT NULL COMMENT 'best_sellers, sales_report, inventory_report, low_stock, transactions, category_breakdown',
  config JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  widget_type VARCHAR(50) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  config JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  source_module VARCHAR(50) NOT NULL COMMENT 'inventory, pos',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- seed default widgets
INSERT IGNORE INTO dashboard_widgets (title, widget_type, position, is_visible) VALUES
('Best Sellers', 'best_sellers', 1, 1),
('Daily Sales Chart', 'daily_sales', 2, 1),
('Low Stock Alerts', 'low_stock', 3, 1),
('Inventory Summary', 'inventory_summary', 4, 1),
('Category Breakdown', 'category_breakdown', 5, 1),
('Recent Transactions', 'recent_transactions', 6, 1);
