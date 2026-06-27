from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('dashboard-stats/', views.dashboard_stats_view, name='dashboard-stats'),

    path('categories/',              views.CategoryListView.as_view(),         name='categories'),
    path('categories/<str:pk>/',     views.CategoryDetailView.as_view(),       name='category-detail'),
    path('suppliers/',               views.SupplierListView.as_view(),         name='suppliers'),
    path('suppliers/<str:pk>/',      views.SupplierDetailView.as_view(),       name='supplier-detail'),
    path('users/',                   views.UserListView.as_view(),             name='users'),
    path('products/',                views.ProductListView.as_view(),          name='products'),

    path('products/dropdown/',       views.ProductDropdownView.as_view(),      name='products-dropdown'),
    path('products/archived/',       views.ProductArchivedView.as_view(),      name='products-archived'),
    path('products/<str:pk>/',       views.ProductDetailView.as_view(),        name='product-detail'),
    path('products/<str:pk>/unarchive/', views.ProductUnarchiveView.as_view(), name='product-unarchive'),
    path('products/<str:pk>/permanent_delete/', views.ProductPermanentDeleteView.as_view(), name='product-permanent-delete'),
    path('stock-ledger/',            views.StockLedgerListCreateView.as_view(),name='stock-ledger'),
    path('notifications/',               views.NotificationListView.as_view(),       name='notifications'),
    path('notifications/mark_all_read/',  views.NotificationMarkAllReadView.as_view(),name='notification-mark-all-read'),
    path('notifications/clear_all/',      views.NotificationClearAllView.as_view(),   name='notification-clear-all'),
    path('notifications/<int:pk>/',       views.NotificationDetailView.as_view(),     name='notification-detail'),
    path('notifications/<int:pk>/mark_read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),

    path('sales-orders/',            views.SalesOrderListView.as_view(),               name='sales-orders'),
    path('order-items/',             views.OrderItemListView.as_view(),                name='order-items'),

    path('purchase-orders/',              views.PurchaseOrderListCreateView.as_view(),    name='purchase-orders'),
    path('purchase-orders/<int:pk>/',     views.PurchaseOrderDetailView.as_view(),        name='purchase-order-detail'),
    path('purchase-order-items/',         views.PurchaseOrderItemListCreateView.as_view(),name='purchase-order-items'),

    path('dashboard/best-sellers/',       views.BestSellersView.as_view(),         name='best-sellers'),
    path('dashboard/category-breakdown/', views.CategoryBreakdownView.as_view(),   name='category-breakdown'),
    path('dashboard/daily-sales-chart/',  views.DailySalesChartView.as_view(),     name='daily-sales-chart'),
    path('dashboard/inventory-report/',   views.InventoryReportView.as_view(),     name='inventory-report'),
    path('dashboard/low-stock-alerts/',   views.LowStockAlertsView.as_view(),      name='low-stock-alerts'),
]
