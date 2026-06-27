# =====================================================
# api/views.py — All API endpoints for OptiStock
# =====================================================
from django.contrib.auth.hashers import check_password
from django.db import models, transaction
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    if request.method == 'GET':
        if 'user_id' in request.session:
            try:
                user = User.objects.get(id=request.session['user_id'])
                return Response(user_data(user))
            except User.DoesNotExist:
                request.session.flush()
        return Response({'error': 'Not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)

    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    try:
        user = User.objects.get(email__iexact=email)
        if not check_password(password, user.password_hash):
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        request.session['user_id'] = user.id
        request.session.save()
        return Response(user_data(user))
    except User.DoesNotExist:
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout_view(request):
    request.session.flush()
    return Response({'status': 'logged out'})


@api_view(['GET'])
@ensure_csrf_cookie
@permission_classes([AllowAny])
def me_view(request):
    if 'user_id' not in request.session:
        return Response({'error': 'Not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        user = User.objects.get(id=request.session['user_id'])
        return Response(user_data(user))
    except User.DoesNotExist:
        request.session.flush()
        return Response({'error': 'Session invalid.'}, status=status.HTTP_401_UNAUTHORIZED)


def user_data(user):
    return UserSerializer(user).data


# ── MODULE 1 — INVENTORY ──────────────────────────────────────────────────────

class CategoryListView(generics.ListCreateAPIView):
    queryset         = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def perform_create(self, serializer):
        last_id = Category.objects.order_by('id').last()
        next_num = int(last_id.id[1:]) + 1 if last_id else 1
        serializer.save(id=f'C{next_num:03d}')


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Category.objects.all()
    serializer_class = CategorySerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.product_count > 0:
            return Response(
                {'error': f'Cannot delete "{instance.name}". There are {instance.product_count} products assigned to this category.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class SupplierListView(generics.ListCreateAPIView):
    queryset         = Supplier.objects.all().order_by('company_name')
    serializer_class = SupplierSerializer

    def perform_create(self, serializer):
        last_id = Supplier.objects.order_by('id').last()
        next_num = int(last_id.id[1:]) + 1 if last_id else 1
        serializer.save(id=f'S{next_num:03d}')


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Supplier.objects.all()
    serializer_class = SupplierSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.products_supplied > 0:
            return Response(
                {'error': f'Cannot delete "{instance.company_name}". There are {instance.products_supplied} products linked to this supplier.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class UserListView(generics.ListAPIView):
    queryset         = User.objects.filter(status='Active').order_by('name')
    serializer_class = UserSerializer


class ProductListView(generics.ListCreateAPIView):
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

    def perform_create(self, serializer):
        last_id = Product.objects.order_by('id').last()
        next_num = int(last_id.id[1:]) + 1 if last_id else 1
        serializer.save(id=f'P{next_num:04d}')


class ProductArchivedView(generics.ListAPIView):
    queryset         = Product.objects.filter(status='archived').select_related('category', 'supplier').order_by('name')
    serializer_class = ProductSerializer


class ProductDropdownView(generics.ListAPIView):
    queryset         = Product.objects.filter(status='active').order_by('name')
    serializer_class = ProductDropdownSerializer
    pagination_class = None


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer


class ProductUnarchiveView(generics.GenericAPIView):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != 'archived':
            return Response({'error': 'Product is not archived.'}, status=400)
        instance.status = 'active'
        instance.save()
        return Response(ProductSerializer(instance).data)


class ProductPermanentDeleteView(generics.DestroyAPIView):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        StockLedger.objects.filter(product=instance).delete()
        return super().destroy(request, *args, **kwargs)


class NotificationMarkReadView(generics.UpdateAPIView):
    queryset         = Notification.objects.all()
    serializer_class = NotificationSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_read = True
        instance.save()
        return Response(NotificationSerializer(instance).data)


class NotificationMarkAllReadView(generics.GenericAPIView):
    queryset         = Notification.objects.all()

    def put(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked read'})


class NotificationClearAllView(generics.GenericAPIView):
    queryset         = Notification.objects.all()

    def delete(self, request):
        self.get_queryset().delete()
        return Response({'status': 'all cleared'}, status=204)


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats_view(request):
    total_active_items = Product.objects.filter(status='active').count()
    low_stock_count = Product.objects.filter(
        status='active', stock__lte=models.F('reorder_level')
    ).count()
    total_value = Product.objects.filter(status='active').aggregate(
        total=models.Sum(models.F('stock') * models.F('cost_price'))
    )['total'] or 0
    return Response({
        'total_active_items': total_active_items,
        'low_stock_count': low_stock_count,
        'total_inventory_value': float(total_value),
    })


class StockLedgerListCreateView(generics.ListCreateAPIView):
    queryset         = StockLedger.objects.all().order_by('-created_at')
    serializer_class = StockLedgerSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product'].id
        ledger_type = serializer.validated_data['type']
        qty = serializer.validated_data['qty']

        with transaction.atomic():
            product = Product.objects.select_for_update().get(id=product_id)

            if ledger_type == 'Stock In':
                new_stock = product.stock + qty
            elif ledger_type == 'Stock Out':
                if product.stock < qty:
                    return Response(
                        {'error': f'Cannot stock out {qty} units. Current stock is only {product.stock}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                new_stock = product.stock - qty
            else:
                new_stock = product.stock + qty

            Product.objects.filter(id=product_id).update(stock=new_stock)

            from django.utils.timezone import now
            tx_id = f'TXN-{now():%Y%m%d%H%M%S%f}'
            serializer.save(tx_id=tx_id, balance_after=new_stock)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class NotificationListView(generics.ListAPIView):
    queryset         = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
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
    pagination_class = None


class CategoryBreakdownView(generics.ListAPIView):
    queryset         = VCategoryBreakdown.objects.all().order_by('name')
    serializer_class = CategoryBreakdownSerializer
    pagination_class = None


class DailySalesChartView(generics.ListAPIView):
    queryset         = VDailySalesChart.objects.all()
    serializer_class = DailySalesChartSerializer
    pagination_class = None


class InventoryReportView(generics.ListAPIView):
    queryset         = VInventoryReport.objects.all().order_by('name')
    serializer_class = InventoryReportSerializer
    pagination_class = None


class LowStockAlertsView(generics.ListAPIView):
    queryset         = VLowStockAlert.objects.all().order_by('status', 'name')
    serializer_class = LowStockAlertSerializer
    pagination_class = None
