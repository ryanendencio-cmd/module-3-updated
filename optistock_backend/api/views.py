# =====================================================
# api/views.py — All API endpoints for OptiStock
# =====================================================
import hashlib
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Category, Supplier, User, Product,
    StockLedger, Notification,
    PurchaseOrder, PurchaseOrderItem,
    SalesOrder, OrderItem,
    VBestSeller, VCategoryBreakdown, VDailySalesChart,
    VInventoryReport, VLowStockAlert,
)
from .serializers import (
    CategorySerializer, SupplierSerializer, UserSerializer,
    ProductSerializer, ProductDropdownSerializer,
    StockLedgerSerializer, NotificationSerializer,
    PurchaseOrderSerializer, PurchaseOrderItemSerializer,
    SalesOrderSerializer, OrderItemSerializer,
    BestSellerSerializer, CategoryBreakdownSerializer,
    DailySalesChartSerializer, InventoryReportSerializer,
    LowStockAlertSerializer,
)


# ── AUTH ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def login_view(request):
    """
    POST /api/login/
    Body: { "username": "<name or email>", "password": "<plain text>" }
    Returns: { "token": "...", "user": { id, name, role, email } }

    NOTE: For demo purposes we use a simple bcrypt-free hash check.
    In production, replace with bcrypt or Django's built-in auth.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response({'detail': 'Username and password are required.'}, status=400)

    try:
        user = User.objects.get(name=username, status='Active')
    except User.DoesNotExist:
        try:
            user = User.objects.get(email=username, status='Active')
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=401)

    # Simple demo password check (accepts any password if hash is NULL in DB)
    # Replace with bcrypt.checkpw in production
    stored = user.password_hash or ''
    if stored and stored != hashlib.sha256(password.encode()).hexdigest():
        return Response({'detail': 'Invalid credentials.'}, status=401)

    # Generate a simple token (use djangorestframework-simplejwt in production)
    import hmac, base64
    token_raw = f"{user.id}:{user.email}:optistock-secret"
    token = base64.b64encode(token_raw.encode()).decode()

    return Response({
        'token': token,
        'user': {
            'id':    user.id,
            'name':  user.name,
            'role':  user.role,
            'email': user.email,
        }
    })


# ── MODULE 1 — INVENTORY ──────────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    queryset         = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer


class SupplierListView(generics.ListAPIView):
    queryset         = Supplier.objects.all().order_by('company_name')
    serializer_class = SupplierSerializer


class UserListView(generics.ListAPIView):
    queryset         = User.objects.filter(status='Active').order_by('name')
    serializer_class = UserSerializer


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = Product.objects.filter(status='active').select_related('category', 'supplier').order_by('name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        return qs


class ProductArchivedView(generics.ListAPIView):
    queryset         = Product.objects.filter(status='archived').select_related('category', 'supplier').order_by('name')
    serializer_class = ProductSerializer


class ProductDropdownView(generics.ListAPIView):
    queryset         = Product.objects.filter(status='active').order_by('name')
    serializer_class = ProductDropdownSerializer


class StockLedgerListCreateView(generics.ListCreateAPIView):
    queryset         = StockLedger.objects.all().order_by('-created_at')
    serializer_class = StockLedgerSerializer


class NotificationListView(generics.ListAPIView):
    queryset         = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer


class NotificationDetailView(generics.RetrieveUpdateAPIView):
    queryset         = Notification.objects.all()
    serializer_class = NotificationSerializer


# ── MODULE 2 — POS ────────────────────────────────────────────────────────────

class SalesOrderListView(generics.ListAPIView):
    queryset         = SalesOrder.objects.all().select_related('cashier').order_by('-created_at')
    serializer_class = SalesOrderSerializer


class OrderItemListView(generics.ListAPIView):
    queryset         = OrderItem.objects.all().select_related('product').order_by('-id')
    serializer_class = OrderItemSerializer


class PurchaseOrderListCreateView(generics.ListCreateAPIView):
    queryset         = PurchaseOrder.objects.all().select_related('supplier', 'created_by').order_by('-created_at')
    serializer_class = PurchaseOrderSerializer


class PurchaseOrderDetailView(generics.RetrieveUpdateAPIView):
    queryset         = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer


class PurchaseOrderItemListCreateView(generics.ListCreateAPIView):
    queryset         = PurchaseOrderItem.objects.all().select_related('product').order_by('id')
    serializer_class = PurchaseOrderItemSerializer


# ── MODULE 3 — DASHBOARD (read-only views) ────────────────────────────────────

class BestSellersView(generics.ListAPIView):
    queryset         = VBestSeller.objects.all().order_by('rank')
    serializer_class = BestSellerSerializer


class CategoryBreakdownView(generics.ListAPIView):
    queryset         = VCategoryBreakdown.objects.all().order_by('name')
    serializer_class = CategoryBreakdownSerializer


class DailySalesChartView(generics.ListAPIView):
    queryset         = VDailySalesChart.objects.all()
    serializer_class = DailySalesChartSerializer


class InventoryReportView(generics.ListAPIView):
    queryset         = VInventoryReport.objects.all().order_by('name')
    serializer_class = InventoryReportSerializer


class LowStockAlertsView(generics.ListAPIView):
    queryset         = VLowStockAlert.objects.all().order_by('status', 'name')
    serializer_class = LowStockAlertSerializer
