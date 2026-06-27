// Sidebar.jsx – Navigation sidebar with SVG icons (no emojis)

import { useAuth } from '../context/AuthContext';
import { logout as apiLogout } from '../services/api';
import { confirmAction, showSuccessToast } from '../utils/swalHelper';
import { MODULE_URLS } from '../config';

// ── SVG icon map ──────────────────────────────────────────────────────────────
const NavIcons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  alerts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  sales: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  inventory: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  bestsellers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  transactions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  categories: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  ),
};

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const IconCart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

function ModuleLink({ href, icon: Icon, label }) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 500,
          textDecoration: 'none', cursor: 'pointer',
          transition: 'background 0.18s, color 0.18s',
          marginBottom: 2,
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <Icon />
        <span style={{ flex: 1 }}>{label}</span>
        <ExternalLinkIcon />
      </a>
    );
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 'var(--radius-sm)',
      color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500,
      opacity: 0.5, cursor: 'not-allowed', marginBottom: 2,
    }}>
      <Icon />
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );
}

export default function Sidebar({ active, setActive, isOpen }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard',  label: 'Dashboard',        badge: null },
        { id: 'alerts',     label: 'Low Stock Alerts',  badge: 12 },
      ],
    },
    {
      label: 'Reports',
      items: [
        { id: 'sales',       label: 'Sales Reports' },
        { id: 'inventory',   label: 'Inventory Report' },
        { id: 'bestsellers', label: 'Best Sellers' },
      ],
    },
    {
      label: 'Monitoring',
      items: [
        { id: 'transactions', label: 'Transactions' },
        { id: 'categories',   label: 'Category Breakdown' },
      ],
    },
  ];

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
            <line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <h2>InvenTrack</h2>
          <span>Module 3 – Reports</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => setActive(item.id)}
              >
                <span className="nav-icon">{NavIcons[item.id]}</span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Integrated Modules */}
      <div style={{ padding: '0 12px', marginTop: 4 }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '8px 8px 4px', borderTop: '1px solid var(--border)', marginBottom: 4,
        }}>
          Integrated
        </div>
        <ModuleLink href={MODULE_URLS.INVENTORY} icon={IconBox} label="Inventory Hub" />
        <ModuleLink href={MODULE_URLS.POS} icon={IconCart} label="POS Terminal" />
      </div>

      {/* User pill + logout */}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p>{user?.name ?? 'Admin'}</p>
            <span>{user?.role ?? 'Administrator'}</span>
          </div>
        </div>

        {/* Logout button – full width below user pill */}
        <button
          id="sidebar-logout-btn"
          onClick={async () => {
            const confirmed = await confirmAction({
              title: 'Sign Out',
              text: 'Are you sure you want to sign out of InvenTrack?',
              icon: 'question',
              confirmText: 'Sign Out',
              cancelText: 'Cancel'
            });
            if (confirmed) {
              await apiLogout();
              logout();
              showSuccessToast('Successfully signed out');
            }
          }}
          style={{
            width: '100%',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '9px 12px',
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'background 0.18s, border-color 0.18s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.14)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
          }}
        >
          <IconLogout />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
