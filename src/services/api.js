// =====================================================
// src/services/api.js
// Centralized REST API service for OptiStock Module 3
// Base URL: http://localhost:8000/api/
// =====================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Token helper ──────────────────────────────────────────────────────────────
function getToken() {
  try {
    const saved = localStorage.getItem('inventrack_user');
    return saved ? JSON.parse(saved)?.token : null;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Core fetch helper ─────────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errData.message || errData.error || errMsg;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMsg);
  }

  return res.json();
}

// ── Helper: unwrap Django REST paginated results ──────────────────────────────
// DRF returns { count, next, previous, results: [...] } OR just [...]
export function unwrap(data) {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

// =============================================================================
// AUTH
// =============================================================================

/** POST /api/login/  →  { token, user: { id, name, role, email } } */
export const loginUser = (username, password) =>
  request('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

// =============================================================================
// MODULE 1 — INVENTORY endpoints
// =============================================================================

/** GET /api/products/  →  [ { id, sku, name, category_id, supplier_id,
 *                              cost_price, selling_price, stock,
 *                              reorder_level, status } ] */
export const getProducts = (queryString = '') =>
  request(`/products/${queryString}`);

/** GET /api/products/archived/ */
export const getArchivedProducts = () =>
  request('/products/archived/');

/** GET /api/products/dropdown/ */
export const getProductsDropdown = () =>
  request('/products/dropdown/');

/** GET /api/categories/ */
export const getCategories = () =>
  request('/categories/');

/** GET /api/suppliers/ */
export const getSuppliers = () =>
  request('/suppliers/');

/** GET /api/users/ */
export const getUsers = () =>
  request('/users/');

/** GET /api/stock-ledger/ */
export const getStockLedger = () =>
  request('/stock-ledger/');

/** POST /api/stock-ledger/  →  record a stock movement */
export const postStockLedger = (data) =>
  request('/stock-ledger/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** GET  /api/notifications/ */
export const getNotifications = () =>
  request('/notifications/');

/** PUT /api/notifications/{id}/  →  mark as read */
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/`, {
    method: 'PUT',
    body: JSON.stringify({ is_read: true }),
  });

// =============================================================================
// MODULE 2 — POS endpoints (consumed by Module 3 for transaction data)
// =============================================================================

/** GET /api/sales-orders/  →  [ { receipt_no, cashier_id, total, paid,
 *                                  change_given, payment_method, status,
 *                                  items_count, created_at } ] */
export const getSalesOrders = () =>
  request('/sales-orders/');

/** GET /api/order-items/  →  [ { id, receipt_no, product_id, qty, price, subtotal } ] */
export const getOrderItems = () =>
  request('/order-items/');

// =============================================================================
// MODULE 3 — DASHBOARD endpoints (read-only views)
// =============================================================================

/** GET /api/dashboard/best-sellers/
 *  Returns v_best_sellers:
 *  [ { rank, id, name, category, quantity_sold, revenue } ] */
export const getDashboardBestSellers = () =>
  request('/dashboard/best-sellers/');

/** GET /api/dashboard/category-breakdown/
 *  Returns v_category_breakdown:
 *  [ { id, name, value, color } ] */
export const getDashboardCategoryBreakdown = () =>
  request('/dashboard/category-breakdown/');

/** GET /api/dashboard/daily-sales-chart/
 *  Returns v_daily_sales_chart (last 12 days):
 *  [ { date, sales, txn } ] */
export const getDashboardDailySalesChart = () =>
  request('/dashboard/daily-sales-chart/');

/** GET /api/dashboard/inventory-report/
 *  Returns v_inventory_report:
 *  [ { id, sku, name, category, stock, value, status } ] */
export const getDashboardInventoryReport = () =>
  request('/dashboard/inventory-report/');

/** GET /api/dashboard/low-stock-alerts/
 *  Returns v_low_stock_alerts:
 *  [ { id, sku, name, category, stock, reorder, status } ] */
export const getDashboardLowStockAlerts = () =>
  request('/dashboard/low-stock-alerts/');
