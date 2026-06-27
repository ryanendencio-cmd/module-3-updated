import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const app = express();
const PORT = 8003;

app.use(cors({
  origin: function (origin, cb) {
    const allowed = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^http:\/\/100\.\d+\.\d+\.\d+(:\d+)?$/,
    ];
    if (!origin || allowed.some(p => p.test(origin))) return cb(null, true);
    return cb(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// ========= MySQL Connection =========
let db;
async function getDb() {
  if (!db) {
    const mysql = await import('mysql2/promise');
    db = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Jane2005',
      database: process.env.DB_NAME || 'dashboard_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return db;
}

async function initSchema() {
  const pool = await getDb();
  const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (e) {
      if (!e.message.includes('Duplicate')) console.error('Schema init error:', e.message);
    }
  }
  console.log('Dashboard Database schema initialized');
}

initSchema();

// ========= API Clients for other modules =========
const DJANGO_API = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000/api';
const POS_API = process.env.POS_API_URL || 'http://127.0.0.1:8002/api';

async function fetchFrom(url, opts = {}) {
  const headers = { 'ngrok-skip-browser-warning': 'true', ...opts.headers };
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), ...opts, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

// ========= Auth Proxy (Django backend handles auth) =========
app.post('/api/login', async (req, res) => {
  try {
    const djangoRes = await fetch(`${DJANGO_API}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify(req.body),
    });
    const data = await djangoRes.json();
    // Forward Set-Cookie headers for session/csrf
    if (djangoRes.headers.get('set-cookie')) {
      res.setHeader('set-cookie', djangoRes.headers.get('set-cookie'));
    }
    res.status(djangoRes.status).json(data);
  } catch (err) {
    console.error('Login proxy error:', err);
    res.status(500).json({ error: 'Auth service unavailable' });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const djangoRes = await fetch(`${DJANGO_API}/me/`, {
      headers: { cookie: req.headers.cookie || '', 'ngrok-skip-browser-warning': 'true' },
    });
    const data = await djangoRes.json();
    res.status(djangoRes.status).json(data);
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    const djangoRes = await fetch(`${DJANGO_API}/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', cookie: req.headers.cookie || '' },
    });
    const data = await djangoRes.json();
    if (djangoRes.headers.get('set-cookie')) {
      res.setHeader('set-cookie', djangoRes.headers.get('set-cookie'));
    }
    res.status(djangoRes.status).json(data);
  } catch (err) {
    res.json({ message: 'Logged out' });
  }
});

// ========= Dashboard Aggregated Endpoints =========

// GET /api/dashboard/summary — aggregate data from Inventory + POS
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const [inventorySummary, salesToday] = await Promise.allSettled([
      fetchFrom(`${DJANGO_API}/dashboard/inventory-report/`).catch(() => ({})),
      fetchFrom(`${POS_API}/sales/today/`).catch(() => ({ order_count: 0, total_sales: 0, total_items: 0 })),
    ]);

    const invData = inventorySummary.value || {};
    const posData = salesToday.value || {};

    res.json({
      total_products: Array.isArray(invData) ? invData.length : 0,
      low_stock_count: Array.isArray(invData) ? invData.filter(p => p.stock_quantity <= 10).length : 0,
      today_sales_count: posData.order_count || 0,
      today_sales_total: parseFloat(posData.total_sales || 0),
      today_items_sold: posData.total_items || 0,
      source_inventory: DJANGO_API,
      source_pos: POS_API,
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to aggregate dashboard data' });
  }
});

// ========= Inventory Proxy (for Dashboard frontend) =========
app.get('/api/products', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/products/${req.query.q ? `?q=${req.query.q}` : ''}`);
    res.json(data);
  } catch (err) {
    res.json({ count: 0, results: [] });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/categories/`);
    res.json(data);
  } catch (err) {
    res.json({ count: 0, results: [] });
  }
});

app.get('/api/suppliers', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/suppliers/`);
    res.json(data);
  } catch (err) {
    res.json({ count: 0, results: [] });
  }
});

// GET /api/dashboard/best-sellers — from Inventory
app.get('/api/dashboard/best-sellers', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/dashboard/best-sellers/`);
    res.json(data);
  } catch (err) {
    console.error('Best sellers error:', err);
    res.status(500).json({ error: 'Failed to fetch best sellers' });
  }
});

// GET /api/dashboard/daily-sales-chart — from Inventory
app.get('/api/dashboard/daily-sales-chart', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/dashboard/daily-sales-chart/`);
    res.json(data);
  } catch (err) {
    console.error('Daily sales chart error:', err);
    res.status(500).json({ error: 'Failed to fetch daily sales chart' });
  }
});

// GET /api/dashboard/inventory-report — from Inventory
app.get('/api/dashboard/inventory-report', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/dashboard/inventory-report/`);
    res.json(data);
  } catch (err) {
    console.error('Inventory report error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
});

// GET /api/dashboard/low-stock-alerts — from Inventory
app.get('/api/dashboard/low-stock-alerts', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/dashboard/low-stock-alerts/`);
    res.json(data);
  } catch (err) {
    console.error('Low stock alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// GET /api/dashboard/category-breakdown — from Inventory
app.get('/api/dashboard/category-breakdown', async (req, res) => {
  try {
    const data = await fetchFrom(`${DJANGO_API}/dashboard/category-breakdown/`);
    res.json(data);
  } catch (err) {
    console.error('Category breakdown error:', err);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

// GET /api/dashboard/pos-transactions — from POS module
app.get('/api/dashboard/pos-transactions', async (req, res) => {
  try {
    const data = await fetchFrom(`${POS_API}/sales-orders?${new URLSearchParams(req.query)}`);
    res.json(data);
  } catch (err) {
    console.error('POS transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch POS transactions' });
  }
});

// GET /api/dashboard/pos-sales-by-date — from POS module
app.get('/api/dashboard/pos-sales-by-date', async (req, res) => {
  try {
    const data = await fetchFrom(`${POS_API}/sales/by-date?${new URLSearchParams(req.query)}`);
    res.json(data);
  } catch (err) {
    console.error('POS sales by date error:', err);
    res.status(500).json({ error: 'Failed to fetch POS sales data' });
  }
});

// GET /api/dashboard/pos-users — from POS module
app.get('/api/dashboard/pos-users', async (req, res) => {
  try {
    const data = await fetchFrom(`${POS_API}/users`);
    res.json(data);
  } catch (err) {
    console.error('POS users error:', err);
    res.status(500).json({ error: 'Failed to fetch POS users' });
  }
});

// ========= CRUD for Saved Reports (own database) =========
app.get('/api/reports', async (req, res) => {
  try {
    const pool = await getDb();
    const [rows] = await pool.query('SELECT * FROM saved_reports ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { title, report_type, config } = req.body;
    if (!title || !report_type) return res.status(400).json({ error: 'Title and report_type required' });
    const pool = await getDb();
    const [result] = await pool.query(
      'INSERT INTO saved_reports (title, report_type, config) VALUES (?, ?, ?)',
      [title, report_type, config ? JSON.stringify(config) : null]
    );
    res.status(201).json({ id: result.insertId, title, report_type });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const { title, report_type, config } = req.body;
    const pool = await getDb();
    await pool.query(
      'UPDATE saved_reports SET title = ?, report_type = ?, config = ? WHERE id = ?',
      [title, report_type, config ? JSON.stringify(config) : null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const pool = await getDb();
    await pool.query('DELETE FROM saved_reports WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// ========= CRUD for Dashboard Widgets =========
app.get('/api/widgets', async (req, res) => {
  try {
    const pool = await getDb();
    const [rows] = await pool.query('SELECT * FROM dashboard_widgets ORDER BY position ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get widgets error:', err);
    res.status(500).json({ error: 'Failed to fetch widgets' });
  }
});

app.put('/api/widgets/:id', async (req, res) => {
  try {
    const { title, position, is_visible, config } = req.body;
    const pool = await getDb();
    await pool.query(
      'UPDATE dashboard_widgets SET title = ?, position = ?, is_visible = ?, config = ? WHERE id = ?',
      [title, position, is_visible, config ? JSON.stringify(config) : null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update widget error:', err);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// ========= CRUD for Alerts =========
app.get('/api/alerts', async (req, res) => {
  try {
    const pool = await getDb();
    const [rows] = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const { alert_type, message, source_module } = req.body;
    if (!alert_type || !message || !source_module) {
      return res.status(400).json({ error: 'alert_type, message, source_module required' });
    }
    const pool = await getDb();
    const [result] = await pool.query(
      'INSERT INTO alerts (alert_type, message, source_module) VALUES (?, ?, ?)',
      [alert_type, message, source_module]
    );
    res.status(201).json({ id: result.insertId, alert_type, message });
  } catch (err) {
    console.error('Create alert error:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    const pool = await getDb();
    await pool.query('UPDATE alerts SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark alert read error:', err);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'dashboard', port: PORT, timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard Backend Server running on port ${PORT}`);
});
