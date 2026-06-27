# Module 3 — Dashboard

**Group 3 — Management Dashboard**

## ⚠️ SETUP - GAWIN MUNA BAGO I-RUN

**Palitan ang IP sa `backend/.env`**

Buksan ang file `backend/.env`, hanapin ang:
```env
DJANGO_API_URL=http://127.0.0.1:8000/api
POS_API_URL=http://127.0.0.1:8002/api
```

Palitan ang `127.0.0.1` ng actual IP ng:
- `DJANGO_API_URL` → IP ng **Module 1 (Inventory)** laptop
- `POS_API_URL` → IP ng **Module 2 (POS)** laptop

**Paano malaman IP:** Open CMD, i-type `ipconfig`, hanapin "IPv4 Address".

## Overview

A unified dashboard that aggregates data from the Inventory (Module 1) and POS (Module 2) modules. Displays best sellers, sales reports, inventory reports, low stock alerts, transactions, and category breakdown. Has its own database for saved reports, widgets, and alerts.

**Tech Stack:** Express 5 + MySQL 8 + React 19 + Recharts + Vite

## Location

```
/Users/janeventura/Downloads/Dashboard-Module/
```

## Ports

| Service | Port |
|---------|------|
| Express Backend | 8003 |
| Vite Frontend | 5175 |

## Database

- **Name:** `dashboard_db` (auto-created on startup via `schema.sql`)
- **Host:** localhost
- **User:** root
- **Password:** `jane2005`

## Running

### Backend
```bash
cd /Users/janeventura/Downloads/Dashboard-Module
npm install
npm run dev:server
```

### Frontend (separate terminal)
```bash
cd /Users/janeventura/Downloads/Dashboard-Module
npm run dev
```

## API Endpoints

### Auth (proxied to Module 1 — Django)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login/` | Login (proxied to Inventory) |
| GET | `/api/me/` | Get current user |
| POST | `/api/logout/` | Logout |

### Inventory Data (proxied to Module 1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Product list |
| GET | `/api/categories` | Category list |
| GET | `/api/suppliers` | Supplier list |
| GET | `/api/dashboard/best-sellers` | Top-selling products |
| GET | `/api/dashboard/inventory-report` | Full inventory report |
| GET | `/api/dashboard/low-stock-alerts` | Low stock products |
| GET | `/api/dashboard/category-breakdown` | Sales by category |
| GET | `/api/dashboard/daily-sales-chart` | Daily sales chart |

### POS Data (proxied to Module 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/pos-transactions` | POS transaction list |
| GET | `/api/dashboard/pos-sales-by-date` | POS sales by date |
| GET | `/api/dashboard/pos-users` | POS user list |

### Aggregated
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Aggregated summary from M1 + M2 |

### Own Database (dashboard_db)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/reports` | List / Create saved reports |
| PUT/DELETE | `/api/reports/:id` | Update / Delete saved report |
| GET | `/api/widgets` | List dashboard widgets |
| PUT | `/api/widgets/:id` | Update widget settings |
| GET/POST | `/api/alerts` | List / Create alerts |
| PUT | `/api/alerts/:id/read` | Mark alert as read |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Cross-Module Integration

### What we consume:

**From Module 1 — Inventory (Django):**
Configure in `backend/.env`:
```
DJANGO_API_URL=http://<MODULE_1_IP>:8000/api
```

**From Module 2 — POS (Express):**
Configure in `backend/.env`:
```
POS_API_URL=http://<MODULE_2_IP>:8002/api
```

### Startup Order

1. Start Module 1 backend first (Inventory/Django on port 8000)
2. Start Module 2 backend (POS/Express on port 8002)
3. Start this module's backend (Dashboard/Express on port 8003)
4. Start all frontends (any order)

## Files

| File | Purpose |
|------|---------|
| `backend/server.js` | Express backend (proxies + own CRUD) |
| `backend/schema.sql` | Dashboard database schema (auto-runs) |
| `backend/.env` | Backend environment config |
| `src/services/api.js` | Frontend API client |
| `src/pages/` | Dashboard pages |
| `src/components/` | Sidebar, Topbar |
| `src/context/` | AuthContext, WebSocketProvider |
| `src/config.js` | Module URL config |
| `.env` | Frontend environment variables |
