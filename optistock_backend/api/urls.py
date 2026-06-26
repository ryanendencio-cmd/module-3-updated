# =====================================================
# api/urls.py — All API URL routes
# =====================================================
from django.urls import path
from . import views

urlpatterns = [
    # ── AUTH ───────────────────────────────────────────────────────────────────
    path('login/', views.login_view, name='login'),

    # ── MODULE 1 — INVENTORY ───────────────────────────────────────────────────
    path('categories/',              views.CategoryListView.as_view(),         name='categories'),
    path('suppliers/',               views.SupplierListView.as_view(),         name='suppliers'),
    path('users/',                   views.UserListView.as_view(),             name='users'),
    path('products/',                views.ProductListView.as_view(),          name='products'),
    path('products/archived/',       views.ProductArchivedView.as_view(),      name='products-archived'),
    path('products/dropdown/',       views.ProductDropdownView.as_view(),      name='products-dropdown'),
    path('stock-ledger/',            views.StockLedgerListCreateView.as_view(),name='stock-ledger'),
    path('notifications/',           views.NotificationListView.as_view(),     name='notifications'),
    path('notifications/<int:pk>/',  views.NotificationDetailView.as_view(),   name='notification-detail'),

    # ── MODULE 2 — POS ─────────────────────────────────────────────────────────
    path('sales-orders/',            views.SalesOrderListView.as_view(),               name='sales-orders'),
    path('order-items/',             views.OrderItemListView.as_view(),                name='order-items'),

    # ── MODULE 1 (cont.) — PURCHASE ORDERS ────────────────────────────────────
    path('purchase-orders/',              views.PurchaseOrderListCreateView.as_view(),    name='purchase-orders'),
    path('purchase-orders/<int:pk>/',     views.PurchaseOrderDetailView.as_view(),        name='purchase-order-detail'),
    path('purchase-order-items/',         views.PurchaseOrderItemListCreateView.as_view(),name='purchase-order-items'),

    # ── MODULE 3 — DASHBOARD (read-only) ───────────────────────────────────────
    path('dashboard/best-sellers/',       views.BestSellersView.as_view(),         name='best-sellers'),
    path('dashboard/category-breakdown/', views.CategoryBreakdownView.as_view(),   name='category-breakdown'),
    path('dashboard/daily-sales-chart/',  views.DailySalesChartView.as_view(),     name='daily-sales-chart'),
    path('dashboard/inventory-report/',   views.InventoryReportView.as_view(),     name='inventory-report'),
    path('dashboard/low-stock-alerts/',   views.LowStockAlertsView.as_view(),      name='low-stock-alerts'),
]
