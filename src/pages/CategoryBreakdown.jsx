// CategoryBreakdown.jsx  –  Pie chart + category summary
// Fetches live data from:
//   GET /api/dashboard/category-breakdown/  →  v_category_breakdown view

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getDashboardCategoryBreakdown, unwrap } from '../services/api';

// Fallback color palette (backend should return colors per category)
const PALETTE = [
  '#4f8ef7', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16',
];

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 14px',
      fontSize: '0.8rem',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload.color, display: 'inline-block' }} />
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>Share: <strong>{d.value}%</strong></div>
    </div>
  );
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

export default function CategoryBreakdown() {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardCategoryBreakdown();
        if (!cancelled) {
          // Ensure each category has a color
          const withColors = unwrap(data).map((cat, i) => ({
            ...cat,
            color: cat.color && cat.color !== '#4f8ef7'
              ? cat.color
              : PALETTE[i % PALETTE.length],
            value: Number(cat.value ?? 0),
          }));
          setCategories(withColors);
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

  const total = categories.reduce((s, c) => s + c.value, 0);

  if (error) {
    return (
      <div className="page-content">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            Failed to load category breakdown
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Donut + Details side by side */}
      <div className="panels-row" style={{ marginBottom: 20 }}>

        {/* Pie Chart Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3>Sales by Category</h3>
            <span>This month</span>
          </div>
          <div className="panel-body" style={{
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0',
          }}>
            {loading ? (
              <Skeleton height={300} width={300} radius="50%" />
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🥧</div>No sales data this month
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="46%"
                    innerRadius="40%"
                    outerRadius="68%"
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                    isAnimationActive={true}
                  >
                    {categories.map(entry => (
                      <Cell key={entry.id ?? entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ fontSize: '0.76rem', paddingTop: 12 }}
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category detail cards */}
        <div className="panel">
          <div className="panel-header">
            <h3>Category Details</h3>
          </div>
          <div className="panel-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} height={44} />)}
              </div>
            ) : (
              <div className="progress-row">
                {categories.map(cat => (
                  <div key={cat.id ?? cat.name} className="progress-item">
                    <label>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
                        {cat.name}
                      </span>
                      <span>{cat.value}%</span>
                    </label>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${cat.value}%`, background: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Category Summary Table</h3>
        </div>
        <div className="panel-body no-pad">
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} />)}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Share</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">No category data available.</div>
                    </td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.id ?? cat.name}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, display: 'inline-block', flexShrink: 0 }} />
                          <strong>{cat.name}</strong>
                        </span>
                      </td>
                      <td>{cat.value}%</td>
                      <td>
                        <span className={`badge ${
                          cat.value > 20 ? 'badge-green'
                          : cat.value > 10 ? 'badge-blue'
                          : 'badge-amber'
                        }`}>
                          {cat.value > 20 ? '↑ High' : cat.value > 10 ? '→ Stable' : '↓ Low'}
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
