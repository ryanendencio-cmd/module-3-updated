// Dashboard.jsx – Main overview page (Module 3 entry point)
// Fetches live data from:
//   GET /api/products/              → totalProducts, lowStockItems
//   GET /api/categories/            → totalCategories
//   GET /api/suppliers/             → totalSuppliers
//   GET /api/dashboard/daily-sales-chart/ → sales chart + today's stats
//   GET /api/dashboard/low-stock-alerts/  → alert panel
//   GET /api/dashboard/best-sellers/      → best sellers panel

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getProducts,
  getCategories,
  getSuppliers,
  getDashboardDailySalesChart,
  getDashboardLowStockAlerts,
  getDashboardBestSellers,
  unwrap,
} from '../services/api';

// ── Loading skeleton ───────────────────────────────────────────────────────────
function Skeleton({ height = 20, width = '100%', radius = 6 }) {
  return (
    <div style={{
      height, width, borderRadius: radius,
      background: 'var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, loading }) {
  return (
    <div className="stat-card fade-in-up">
      <div className="stat-body">
        <label>{label}</label>
        <div className="stat-value">
          {loading ? <Skeleton height={28} width={80} /> : value}
        </div>
        {sub && <div className="stat-sub">{loading ? <Skeleton height={14} width={100} /> : sub}</div>}
      </div>
    </div>
  );
}

// ── Custom Chart Tooltip ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card-alt)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      fontSize: '0.78rem',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
        ₱{Number(payload[0].value).toLocaleString()}
      </p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const rankClass = (r) => ['r1', 'r2', 'r3'][r - 1] ?? 'rn';

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [stats, setStats]         = useState({});
  const [dailySales, setDailySales] = useState([]);
  const [lowStock, setLowStock]   = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  // ── Fetch all dashboard data ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [products, categories, suppliers, salesChart, alerts, sellers] =
          await Promise.all([
            getProducts(),
            getCategories(),
            getSuppliers(),
            getDashboardDailySalesChart(),
            getDashboardLowStockAlerts(),
            getDashboardBestSellers(),
          ]);

        if (cancelled) return;

        const productList = unwrap(products);
        const catList     = unwrap(categories);
        const supList     = unwrap(suppliers);
        const chartData   = unwrap(salesChart);
        const alertData   = unwrap(alerts);
        const sellerData  = unwrap(sellers);

        // Today's sales = first row of daily-sales-chart (most recent day)
        const todayRow = chartData[0] ?? {};

        // Low stock = products where stock <= reorder_level
        const lowStockItems = productList.filter(
          p => p.stock <= p.reorder_level && p.status === 'active'
        ).length;

        setStats({
          totalProducts:    productList.length,
          lowStockItems:    alertData.length || lowStockItems,
          todaysSales:      Number(todayRow.sales ?? 0),
          transactionsToday: Number(todayRow.txn ?? 0),
          totalCategories:  catList.length,
          totalSuppliers:   supList.length,
        });

        // Chart expects chronological order (oldest first for left→right display)
        setDailySales([...chartData].reverse());
        setLowStock(alertData.slice(0, 5));
        setBestSellers(sellerData.slice(0, 5));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            Failed to load dashboard data
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            {error}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Make sure the backend is running at <code>http://localhost:8000</code> and CORS is configured.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          sub={<><span className="up">↑ Active</span> products</>}
          loading={loading}
        />
        <StatCard
          label="Low Stock Items"
          value={stats.lowStockItems}
          sub={<><span className="down">↓ Restock needed</span></>}
          loading={loading}
        />
        <StatCard
          label="Today's Sales"
          value={`₱${Number(stats.todaysSales ?? 0).toLocaleString()}`}
          sub={<><span className="up">Live</span> from POS</>}
          loading={loading}
        />
        <StatCard
          label="Transactions Today"
          value={stats.transactionsToday}
          sub="From daily_sales_summary"
          loading={loading}
        />
        <StatCard
          label="Total Categories"
          value={stats.totalCategories}
          loading={loading}
        />
        <StatCard
          label="Suppliers"
          value={stats.totalSuppliers}
          loading={loading}
        />
      </div>

      {/* Sales Chart + Alerts */}
      <div className="panels-row">
        {/* Area Chart */}
        <div className="panel">
          <div className="panel-header">
            <h3>Daily Sales — Last 12 Days</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Live from backend
            </span>
          </div>
          <div className="panel-body" style={{ height: 220 }}>
            {loading ? (
              <Skeleton height={200} radius={8} />
            ) : dailySales.length === 0 ? (
              <div className="empty-state"><div className="icon">📊</div>No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#gradOrange)"
                    dot={{ r: 3, fill: '#f97316' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="panel">
          <div className="panel-header">
            <h3>Low Stock Alerts</h3>
            {!loading && (
              <span className="badge badge-red">{stats.lowStockItems} items</span>
            )}
          </div>
          <div className="panel-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius={8} />)}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="empty-state">
                <div className="icon">✅</div>All stock levels OK
              </div>
            ) : (
              <div className="alert-list">
                {lowStock.map(p => (
                  <div key={p.id} className={`alert-item ${p.status === 'critical' ? 'danger' : 'warn'}`}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: p.status === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)',
                      flexShrink: 0, display: 'inline-block',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                        Stock: {p.stock} / Reorder at: {p.reorder}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best Sellers + Quick Stats */}
      <div className="panels-row">
        {/* Best Sellers */}
        <div className="panel">
          <div className="panel-header">
            <h3>Best Selling Products</h3>
            <span>This month</span>
          </div>
          <div className="panel-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={44} radius={8} />)}
              </div>
            ) : bestSellers.length === 0 ? (
              <div className="empty-state"><div className="icon">📦</div>No sales recorded yet</div>
            ) : (
              <div className="product-list">
                {bestSellers.map(p => (
                  <div key={p.id ?? p.rank} className="product-list-item">
                    <div className={`product-rank ${rankClass(p.rank)}`}>{p.rank}</div>
                    <div className="product-info">
                      <p>{p.name}</p>
                      <span>{p.category} · {Number(p.sold).toLocaleString()} sold</span>
                    </div>
                    <div className="product-amount">₱{Number(p.revenue).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3>System Info</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>optistock_db</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'API Base URL',   value: 'http://localhost:8000/api/' },
                { label: 'Database',       value: 'optistock_db' },
                { label: 'Module 1',       value: 'Inventory Management' },
                { label: 'Module 2',       value: 'POS / Sales' },
                { label: 'Module 3',       value: 'Reports & Dashboard' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.8rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <code style={{
                    background: 'var(--bg-card-alt)', padding: '2px 8px',
                    borderRadius: 4, fontSize: '0.75rem',
                    color: 'var(--accent-blue)',
                  }}>{row.value}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
