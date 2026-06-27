import { useState, useEffect, useRef } from 'react';
import {
  confirmAction,
  showSuccessToast,
  showLoading,
  closeLoading,
} from '../utils/swalHelper';
import { getDashboardLowStockAlerts, unwrap } from '../services/api';

const pageInfo = {
  dashboard:    { title: 'Dashboard',          desc: "Overview of today's operations" },
  alerts:       { title: 'Low Stock Alerts',   desc: 'Products that need to be restocked' },
  sales:        { title: 'Sales Reports',      desc: 'Daily, weekly & monthly sales data' },
  inventory:    { title: 'Inventory Report',   desc: 'Current stock levels & valuation' },
  bestsellers:  { title: 'Best Sellers',       desc: 'Top-performing products by revenue' },
  transactions: { title: 'Transactions',       desc: 'Recent POS transaction records' },
  categories:   { title: 'Category Breakdown', desc: 'Sales distribution by category' },
};

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function Topbar({ active, onToggleSidebar }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const notifRef = useRef(null);

  const info = pageInfo[active] || pageInfo.dashboard;
  const now = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const critical = alerts.filter(p => p.status === 'critical');
  const low = alerts.filter(p => p.status === 'low');

  useEffect(() => {
    if (!notifOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getDashboardLowStockAlerts();
        if (!cancelled) setAlerts(unwrap(data));
      } catch { /* silently fail */ }
    })();
    return () => { cancelled = true; };
  }, [notifOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExportClick = async () => {
    const confirm = await confirmAction({
      title: 'Export Report',
      text: `Do you want to export the "${info.title}" report?`,
      icon: 'question',
      confirmText: 'Export Now',
      cancelText: 'Cancel',
    });

    if (confirm) {
      showLoading('Generating report data...');
      setTimeout(() => {
        closeLoading();
        showSuccessToast(`${info.title} report exported successfully!`);
      }, 1500);
    }
  };

  return (
    <header className="topbar">
      {/* Hamburger button */}
      <button
        className="hamburger-btn"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
      >
        <span /><span /><span />
      </button>

      <div className="topbar-title">
        <h1>{info.title}</h1>
        <p>{info.desc}&nbsp;·&nbsp;{now}</p>
      </div>

      <div className="topbar-actions">
        {/* Live indicator */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="live-dot" />
          Live
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Notifications">
          <div
            onClick={() => setNotifOpen(o => !o)}
            className="icon-btn"
          >
            <IconBell />
            {critical.length + low.length > 0 && <span className="notif-dot" />}
          </div>

          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 340, background: '#fff', borderRadius: 12,
            border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            opacity: notifOpen ? 1 : 0, visibility: notifOpen ? 'visible' : 'hidden',
            transform: notifOpen ? 'scale(1)' : 'scale(0.95)',
            transformOrigin: 'top right',
            transition: 'opacity 0.2s, transform 0.2s, visibility 0.2s',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Stock Alerts</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {critical.length + low.length} items
              </span>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8 }}>
              {critical.length === 0 && low.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No stock alerts at this time.
                </div>
              )}

              {critical.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', marginBottom: 4,
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 8, fontSize: '0.8rem',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>[CRITICAL] {p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Stock: {p.stock} / Reorder at: {p.reorder}
                    </div>
                  </div>
                </div>
              ))}

              {low.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', marginBottom: 4,
                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                  borderRadius: 8, fontSize: '0.8rem',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>[LOW STOCK] {p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Stock: {p.stock} / Reorder at: {p.reorder}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="icon-btn" title="Export report" onClick={handleExportClick}>
          <IconDownload />
        </div>
      </div>
    </header>
  );
}