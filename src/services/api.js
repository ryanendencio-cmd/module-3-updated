const BASE_URL = 'http://localhost:8003/api';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    headers['X-CSRFToken'] = csrfToken;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers,
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errData.message || errData.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export function unwrap(data) {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

// Auth (proxied via Dashboard backend → Django)
export const loginUser = (email, password) =>
  request('/login/', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/me/');

export const logout = () => request('/logout/', { method: 'POST' });

// Inventory proxy (via Dashboard backend → Django)
export const getProducts = (queryString = '') =>
  request(`/products${queryString}`);

export const getCategories = () =>
  request('/categories');

export const getSuppliers = () =>
  request('/suppliers');

// POS proxy (via Dashboard backend → POS)
export const getSalesOrders = () =>
  request('/dashboard/pos-transactions');

// Dashboard aggregated endpoints
export const getDashboardBestSellers = () =>
  request('/dashboard/best-sellers');

export const getDashboardCategoryBreakdown = () =>
  request('/dashboard/category-breakdown');

export const getDashboardDailySalesChart = () =>
  request('/dashboard/daily-sales-chart');

export const getDashboardInventoryReport = () =>
  request('/dashboard/inventory-report');

export const getDashboardLowStockAlerts = () =>
  request('/dashboard/low-stock-alerts');

export const getDashboardSummary = () =>
  request('/dashboard/summary');

// POS data via Dashboard backend proxy
export const getPosTransactions = (params = '') =>
  request(`/dashboard/pos-transactions${params ? '?' + params : ''}`);

export const getPosSalesByDate = (days = 7) =>
  request(`/dashboard/pos-sales-by-date?days=${days}`);

export const getPosUsers = () =>
  request('/dashboard/pos-users');

// CRUD for saved reports (Dashboard's own database)
export const getSavedReports = () =>
  request('/reports');

export const createSavedReport = (data) =>
  request('/reports', { method: 'POST', body: JSON.stringify(data) });

export const updateSavedReport = (id, data) =>
  request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteSavedReport = (id) =>
  request(`/reports/${id}`, { method: 'DELETE' });

// CRUD for widgets
export const getWidgets = () =>
  request('/widgets');

export const updateWidget = (id, data) =>
  request(`/widgets/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Alerts
export const getAlerts = () =>
  request('/alerts');

export const createAlert = (data) =>
  request('/alerts', { method: 'POST', body: JSON.stringify(data) });

export const markAlertRead = (id) =>
  request(`/alerts/${id}/read`, { method: 'PUT' });
