// InventoryReport.jsx  –  Current stock & valuation report
// Fetches live data from:
//   GET /api/dashboard/inventory-report/  →  v_inventory_report view

import { useState, useEffect } from 'react';
import { getDashboardInventoryReport, unwrap } from '../services/api';

const STATUS_BADGE = {
  'In Stock':    'badge-green',
  'Low Stock':   'badge-amber',
  'Critical':    'badge-red',
  'Out of Stock':'badge-red',
};

function Skeleton({ height = 20, width = '100%' }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

export default function InventoryReport() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardInventoryReport();
        if (!cancelled) setProducts(unwrap(data));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalValue = products.reduce((s, p) => s + Number(p.value ?? 0), 0);
  const inStock    = products.filter(p => p.status === 'In Stock').length;
  const lowStock   = products.filter(p => p.status === 'Low Stock').length;
  const critical   = products.filter(p => p.status === 'Critical' || p.status === 'Out of Stock').length;

  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            Failed to load inventory report
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Inventory Value', value: loading ? null : `₱${totalValue.toLocaleString()}` },
          { label: 'In Stock Products',     value: loading ? null : inStock  },
          { label: 'Low Stock Products',    value: loading ? null : lowStock },
          { label: 'Critical / Out',        value: loading ? null : critical },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-body">
              <label>{c.label}</label>
              <div className="stat-value">
                {loading ? <Skeleton height={28} width={70} /> : c.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <h3>Product Inventory Report</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Search name / SKU / category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="select-input"
              style={{ width: 220 }}
              disabled={loading}
            />
            <select
              className="select-input"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              disabled={loading}
            >
              {['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'].map(f => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="panel-body no-pad">
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(8)].map((_, i) => <Skeleton key={i} height={44} />)}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock Qty</th>
                  <th>Est. Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">No products match your search.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.id}</td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 700 }}>{p.stock}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                        ₱{Number(p.value).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-blue'}`}>
                          {p.status}
                        </span>
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
