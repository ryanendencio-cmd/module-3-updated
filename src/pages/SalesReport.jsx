// SalesReport.jsx  –  Daily / Weekly / Monthly sales breakdown
// Fetches live data from:
//   GET /api/dashboard/daily-sales-chart/  →  v_daily_sales_chart (last 12 days)
//   GET /api/sales-orders/                 →  sales_orders (for weekly/monthly agg.)

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { getDashboardDailySalesChart, getSalesOrders, unwrap } from '../services/api';

function Skeleton({ height = 20, width = '100%' }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: 'var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Aggregate sales_orders into monthly buckets ───────────────────────────────
function buildMonthly(orders) {
  const map = {};
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const key = MONTHS[d.getMonth()];
    if (!map[key]) map[key] = { month: key, sales: 0 };
    if (o.status === 'Completed') map[key].sales += Number(o.total);
  });
  return MONTHS.filter(m => map[m]).map(m => map[m]);
}

export default function SalesReport() {
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [dailyData, setDailyData]     = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary]         = useState({
    daily:   { total: 0, txn: 0, avg: 0 },
    weekly:  { total: 0, txn: 0, avg: 0 },
    monthly: { total: 0, txn: 0, avg: 0 },
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [chartRes, ordersRes] = await Promise.all([
          getDashboardDailySalesChart(),
          getSalesOrders().catch(() => []),  // graceful: POS endpoint may not exist yet
        ]);

        if (cancelled) return;

        const chartData  = unwrap(chartRes);
        const orders     = unwrap(ordersRes);

        // Reverse for chronological display (oldest first)
        const chronological = [...chartData].reverse();

        // ── Today (latest row in chart) ──
        const todayRow = chartData[0] ?? {};
        const dailyTotal = Number(todayRow.sales ?? 0);
        const dailyTxn   = Number(todayRow.txn   ?? 0);

        // ── Weekly: sum last 7 rows of chart ──
        const last7 = chartData.slice(0, 7);
        const weekTotal = last7.reduce((s, r) => s + Number(r.sales), 0);
        const weekTxn   = last7.reduce((s, r) => s + Number(r.txn),   0);

        // ── Monthly: sum all chart rows (up to 12 days) OR from orders ──
        const monthly = buildMonthly(orders);
        const allMonthTotal = monthly.reduce((s, m) => s + m.sales, 0);

        // Fallback: if no orders yet, use chart total
        const monthTotal = allMonthTotal || chartData.reduce((s, r) => s + Number(r.sales), 0);
        const monthTxn   = orders.filter(o => o.status === 'Completed').length
                        || chartData.reduce((s, r) => s + Number(r.txn), 0);

        setSummary({
          daily:   { total: dailyTotal, txn: dailyTxn,   avg: dailyTxn  ? dailyTotal  / dailyTxn  : 0 },
          weekly:  { total: weekTotal,  txn: weekTxn,    avg: weekTxn   ? weekTotal   / weekTxn   : 0 },
          monthly: { total: monthTotal, txn: monthTxn,   avg: monthTxn  ? monthTotal  / monthTxn  : 0 },
        });

        setDailyData(chronological);
        setMonthlyData(monthly.length ? monthly : chronological.map(r => ({
          month: r.date, sales: r.sales,
        })));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const s = summary[tab];

  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>Failed to load sales data</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Revenue',  value: loading ? null : `₱${Number(s.total).toLocaleString()}` },
          { label: 'Transactions',   value: loading ? null : s.txn },
          { label: 'Avg per TXN',    value: loading ? null : `₱${Number(s.avg).toFixed(2)}` },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-body">
              <label>{c.label}</label>
              <div className="stat-value">
                {loading ? <Skeleton height={28} width={80} /> : c.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab + Chart Panel */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <h3>Revenue Chart</h3>
        </div>
        <div className="tabs">
          {['daily', 'weekly', 'monthly'].map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="panel-body" style={{ height: 260 }}>
          {loading ? (
            <Skeleton height={240} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {tab === 'monthly' ? (
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [`₱${Number(v).toLocaleString()}`, 'Sales']} />
                  <Bar dataKey="sales" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(v, name) => [
                      name === 'sales' ? `₱${Number(v).toLocaleString()}` : v,
                      name === 'sales' ? 'Revenue' : 'Transactions',
                    ]}
                  />
                  <Legend />
                  <Line yAxisId="left"  type="monotone" dataKey="sales" stroke="#4f8ef7" strokeWidth={2.5} dot={false} name="sales" />
                  <Line yAxisId="right" type="monotone" dataKey="txn"   stroke="#10b981" strokeWidth={2}   dot={false} name="txn" />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Raw daily table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Daily Sales Table</h3>
          <span>Last 12 days</span>
        </div>
        <div className="panel-body no-pad">
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} height={36} />)}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Transactions</th>
                  <th>Avg per TXN</th>
                </tr>
              </thead>
              <tbody>
                {[...dailyData].reverse().map(row => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                      ₱{Number(row.sales).toLocaleString()}
                    </td>
                    <td>{row.txn}</td>
                    <td>₱{row.txn ? (Number(row.sales) / Number(row.txn)).toFixed(2) : '—'}</td>
                  </tr>
                ))}
                {dailyData.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">No sales data available.</div>
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
