// Transactions.jsx  –  Full transaction log from POS Module 2
// Fetches live data from:
//   GET /api/sales-orders/  →  sales_orders table

import { useState, useEffect } from 'react';
import { getSalesOrders, unwrap } from '../services/api';

function Skeleton({ height = 20, width = '100%' }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// Format created_at timestamp → "10:42 AM"
function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [orders, setOrders]   = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSalesOrders();
        if (!cancelled) setOrders(unwrap(data));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
    return () => { cancelled = true; };
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = orders.filter(t => {
    const matchSearch =
      (t.receipt_no ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.cashier_id  ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.reduce((s, t) => s + Number(t.total ?? 0), 0);
  const refundCount  = filtered.filter(t => t.status === 'Refunded').length;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            Failed to load transactions
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>{error}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Endpoint: <code>GET /api/sales-orders/</code> — make sure Module 2 backend is running.
          </div>
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
            <label>Total Transactions</label>
            <div className="stat-value">
              {loading ? <Skeleton height={28} width={60} /> : filtered.length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <label>Revenue (filtered)</label>
            <div className="stat-value">
              {loading
                ? <Skeleton height={28} width={100} />
                : `₱${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              }
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-body">
            <label>Refunds</label>
            <div className="stat-value">
              {loading ? <Skeleton height={28} width={40} /> : refundCount}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Transaction Log</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Search receipt / cashier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="select-input"
              style={{ width: 210 }}
              disabled={loading}
            />
            <select
              className="select-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              disabled={loading}
            >
              {['All', 'Completed', 'Refunded', 'Cancelled'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="panel-body no-pad">
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(8)].map((_, i) => <Skeleton key={i} height={48} />)}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Cashier</th>
                  <th>Payment</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.receipt_no}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600 }}>
                      {t.receipt_no}
                    </td>
                    <td>{t.cashier_id}</td>
                    <td>
                      <span className="badge badge-blue">{t.payment_method}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{t.items_count}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                      ₱{Number(t.total).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatTime(t.created_at)}</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'Completed' ? 'badge-green'
                        : t.status === 'Refunded' ? 'badge-amber'
                        : 'badge-red'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="icon">🔍</div>
                        No transactions found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
