// LowStockAlerts.jsx  –  Detailed low-stock monitoring page
// Fetches live data from:
//   GET /api/dashboard/low-stock-alerts/  →  v_low_stock_alerts view

import { useState, useEffect } from 'react';
import { getDashboardLowStockAlerts, unwrap } from '../services/api';

function Skeleton({ height = 20, width = '100%' }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

export default function LowStockAlerts() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [alerts, setAlerts]   = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardLowStockAlerts();
        if (!cancelled) setAlerts(unwrap(data));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const critical = alerts.filter(p => p.status === 'critical');
  const low      = alerts.filter(p => p.status === 'low');

  const StockBar = ({ stock, reorder }) => {
    const pct   = Math.min((Number(stock) / Number(reorder)) * 100, 100);
    const color = pct < 30 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#10b981';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="progress-bar-bg" style={{ flex: 1 }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {stock}/{reorder}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            Failed to load stock alerts
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  const AlertTable = ({ items, emptyMsg }) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>SKU</th>
          <th>Product</th>
          <th>Category</th>
          <th>Stock Level</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <tr key={i}>
              <td colSpan={6} style={{ padding: 8 }}>
                <Skeleton height={36} />
              </td>
            </tr>
          ))
        ) : items.length === 0 ? (
          <tr>
            <td colSpan={6}>
              <div className="empty-state">
                <div className="icon">✅</div>{emptyMsg}
              </div>
            </td>
          </tr>
        ) : (
          items.map(p => (
            <tr key={p.id}>
              <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.id}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{p.sku}</td>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td>{p.category}</td>
              <td style={{ width: 180 }}>
                <StockBar stock={p.stock} reorder={p.reorder} />
              </td>
              <td>
                <button style={{
                  background: p.status === 'critical'
                    ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
                  color: p.status === 'critical'
                    ? 'var(--accent-red)' : 'var(--accent-amber)',
                  border: `1px solid ${p.status === 'critical'
                    ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius: 6,
                  padding: '4px 10px', fontSize: '0.72rem',
                  cursor: 'pointer', fontWeight: 600,
                }}>
                  {p.status === 'critical' ? 'Order Now' : 'Restock'}
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="page-content">
      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-body">
            <label>Critical Items</label>
            <div className="stat-value">
              {loading ? <Skeleton height={28} width={50} /> : critical.length}
            </div>
            <div className="stat-sub">
              <span className="down">Immediate restock needed</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <label>Low Stock Items</label>
            <div className="stat-value">
              {loading ? <Skeleton height={28} width={50} /> : low.length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <label>Total Alerts</label>
            <div className="stat-value">
              {loading ? <Skeleton height={28} width={50} /> : alerts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Section */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <h3>Critical Stock</h3>
          {!loading && <span className="badge badge-red">{critical.length}</span>}
        </div>
        <div className="panel-body no-pad">
          <AlertTable items={critical} emptyMsg="No critical stock items 🎉" />
        </div>
      </div>

      {/* Low Stock Section */}
      <div className="panel">
        <div className="panel-header">
          <h3>Low Stock Items</h3>
          {!loading && <span className="badge badge-amber">{low.length}</span>}
        </div>
        <div className="panel-body no-pad">
          <AlertTable items={low} emptyMsg="All low-stock items cleared 👍" />
        </div>
      </div>
    </div>
  );
}
