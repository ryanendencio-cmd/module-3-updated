// BestSellers.jsx  –  Top products by revenue with progress bars
// Fetches live data from:
//   GET /api/dashboard/best-sellers/  →  v_best_sellers view

import { useState, useEffect } from 'react';
import { getDashboardBestSellers, unwrap } from '../services/api';

const RANK_COLORS = ['#f59e0b', '#06b6d4', '#8b5cf6', '#4f8ef7', '#10b981', '#ef4444', '#94a3b8'];
const GRADIENT_COLORS = [
  'var(--gradient-amber)', 'var(--gradient-cyan)', 'var(--gradient-purple)',
  'var(--gradient-blue)', 'var(--gradient-green)', 'var(--gradient-red)',
];

function Skeleton({ height = 20, width = '100%' }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

export default function BestSellers() {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sellers, setSellers]   = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardBestSellers();
        if (!cancelled) {
          const list = unwrap(data).map(p => ({
            ...p,
            rank:          Number(p.rank),
            quantity_sold: Number(p.quantity_sold),
            revenue:       Number(p.revenue),
          }));
          setSellers(list);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const maxRevenue   = sellers.length ? Math.max(...sellers.map(p => p.revenue)) : 1;
  const topProduct   = sellers[0];
  const totalUnitsSold = sellers.reduce((s, p) => s + p.quantity_sold, 0);

  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            Failed to load best sellers
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-body">
            <label>Top Product</label>
            <div className="stat-value" style={{ fontSize: '1rem' }}>
              {loading ? <Skeleton height={20} width={130} /> : (topProduct?.name ?? '—')}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <label>Top Revenue</label>
            <div className="stat-value">
              {loading
                ? <Skeleton height={28} width={90} />
                : `₱${(topProduct?.revenue ?? 0).toLocaleString()}`
              }
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <label>Total Units Sold</label>
            <div className="stat-value">
              {loading ? <Skeleton height={28} width={70} /> : totalUnitsSold.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <h3>Revenue Share by Product</h3>
          <span>This month</span>
        </div>
        <div className="panel-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...Array(7)].map((_, i) => <Skeleton key={i} height={44} />)}
            </div>
          ) : sellers.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>No sales recorded yet.
            </div>
          ) : (
            <div className="progress-row">
              {sellers.map((p, i) => (
                <div key={p.id ?? p.rank} className="progress-item">
                  <label>
                    <span style={{ fontWeight: 600 }}>#{p.rank} {p.name}</span>
                    <span>₱{p.revenue.toLocaleString()}</span>
                  </label>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${(p.revenue / maxRevenue) * 100}%`,
                        background: GRADIENT_COLORS[i] || 'var(--gradient-blue)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Best Sellers Table</h3>
          <span>Sorted by revenue</span>
        </div>
        <div className="panel-body no-pad">
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(7)].map((_, i) => <Skeleton key={i} height={44} />)}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">No sales data available.</div>
                    </td>
                  </tr>
                ) : (
                  sellers.map((p, i) => (
                    <tr key={p.id ?? p.rank}>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 26, height: 26, borderRadius: 6,
                          background: `${RANK_COLORS[i] ?? '#94a3b8'}22`,
                          color: RANK_COLORS[i] ?? '#94a3b8',
                          fontWeight: 800, fontSize: '0.78rem',
                        }}>
                          {p.rank}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-blue">{p.category}</span></td>
                      <td style={{ fontWeight: 700 }}>{p.quantity_sold.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                        ₱{p.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
