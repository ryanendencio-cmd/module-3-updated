// App.jsx  –  Root component with login guard
// If user is not logged in → show Login page
// If user is logged in    → show Dashboard shell

import { useState } from 'react';
import { useAuth }   from './context/AuthContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Sidebar       from './components/Sidebar';
import Topbar        from './components/Topbar';
import Login         from './pages/Login';
import Dashboard         from './pages/Dashboard';
import SalesReport       from './pages/SalesReport';
import InventoryReport   from './pages/InventoryReport';
import BestSellers       from './pages/BestSellers';
import LowStockAlerts    from './pages/LowStockAlerts';
import Transactions      from './pages/Transactions';
import CategoryBreakdown from './pages/CategoryBreakdown';

// PAGE MAP – maps a page id (string) → component
const PAGES = {
  dashboard:    <Dashboard />,
  sales:        <SalesReport />,
  inventory:    <InventoryReport />,
  bestsellers:  <BestSellers />,
  alerts:       <LowStockAlerts />,
  transactions: <Transactions />,
  categories:   <CategoryBreakdown />,
};

// Inner shell – only mounts (and starts timers) when user is logged in
function AppShell({ active, setActive }) {
  const { logout } = useAuth();
  useSessionTimeout(logout);
  // Sidebar starts OPEN; hamburger toggles it — nav clicks do NOT close it
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      {/* LEFT: Sidebar — always in DOM, width collapses via CSS */}
      <Sidebar
        active={active}
        setActive={setActive}
        isOpen={sidebarOpen}
      />

      {/* RIGHT: Content area — flexes to fill remaining space */}
      <div className="main-content">
        <Topbar active={active} onToggleSidebar={() => setSidebarOpen(o => !o)} />
        {PAGES[active]}
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const [active, setActive] = useState('dashboard');

  // ── Not logged in → show login page ──────────────────────────────────────
  if (!user) return <Login />;

  // ── Logged in → show dashboard shell (with session timeout active) ────────
  return <AppShell active={active} setActive={setActive} />;
}
