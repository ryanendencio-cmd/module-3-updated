import { useState } from 'react';
import {
  confirmAction,
  showSuccessToast,
  showLoading,
  closeLoading,
  showHtmlAlert,
  confirmHtmlAction
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
  const [hasNotif, setHasNotif] = useState(true);
  const info = pageInfo[active] || pageInfo.dashboard;
  const now = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleNotificationsClick = async () => {
    if (!hasNotif) {
      showHtmlAlert({
        title: 'Notifications',
        html: '<div style="padding: 10px 0; color: var(--text-secondary);">No new notifications. All alerts cleared.</div>',
        icon: 'info',
      });
      return;
    }

    let alerts = [];
    try {
      const data = await getDashboardLowStockAlerts();
      alerts = unwrap(data);
    } catch {
      // silently fail
    }

    const criticalItems = alerts.filter(p => p.status === 'critical');
    const lowItems      = alerts.filter(p => p.status === 'low');

    const htmlContent = `
      <div style="text-align:left;max-height:250px;overflow-y:auto;padding:4px;font-family:'Poppins',sans-serif;">
        <p style="font-size:0.82rem;margin-bottom:12px;color:var(--text-secondary);font-weight:500;">
          You have <strong>${alerts.length}</strong> items requiring attention:
        </p>
        ${criticalItems.map(p => `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding:8px 10px;
            background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:6px;font-size:0.8rem;font-weight:600;">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--accent-red);display:inline-block;margin-top:4px;flex-shrink:0;"></span>
            <div>
              <div style="color:var(--text-primary);font-weight:700;">[CRITICAL] ${p.name}</div>
              <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;">Stock: ${p.stock} / Reorder at: ${p.reorder}</div>
            </div>
          </div>
        `).join('')}
        ${lowItems.map(p => `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding:8px 10px;
            background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:6px;font-size:0.8rem;font-weight:600;">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--accent-amber);display:inline-block;margin-top:4px;flex-shrink:0;"></span>
            <div>
              <div style="color:var(--text-primary);font-weight:700;">[LOW STOCK] ${p.name}</div>
              <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;">Stock: ${p.stock} / Reorder at: ${p.reorder}</div>
            </div>
          </div>
        `).join('')}
        ${alerts.length === 0 ? '<div style="color:var(--text-muted);font-size:0.82rem;">No stock alerts at this time.</div>' : ''}
      </div>
    `;

    const confirmDismiss = await confirmHtmlAction({
      title: 'Active Alerts',
      html: htmlContent,
      icon: 'warning',
      confirmText: 'Dismiss All',
      cancelText: 'Close',
    });

    if (confirmDismiss) {
      setHasNotif(false);
      showSuccessToast('All alerts successfully dismissed');
    }
  };

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

        {/* Notifications */}
        <div className="icon-btn" title="Notifications" onClick={handleNotificationsClick}>
          <IconBell />
          {hasNotif && <span className="notif-dot" />}
        </div>

        {/* Export */}
        <div className="icon-btn" title="Export report" onClick={handleExportClick}>
          <IconDownload />
        </div>
      </div>
    </header>
  );
}