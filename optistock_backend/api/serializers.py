# =====================================================
# api/serializers.py — DRF serializers (JSON output)
# =====================================================
from rest_framework import serializers
from .models import (
    Category, Supplier, User, Product,
    StockLedger, Notification,
    PurchaseOrder, PurchaseOrderItem,
    SalesOrder, OrderItem,
    VBestSeller, VCategoryBreakdown, VDailySalesChart,
    VInventoryReport, VLowStockAlert,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = '__all__'
        read_only_fields = ['id']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = '__all__'
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'name', 'role', 'status', 'created_at']
        # password_hash excluded intentionally


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'sku', 'name',
            'category', 'category_name',
            'supplier', 'supplier_name',
            'cost_price', 'selling_price',
            'stock', 'reorder_level', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id']


class ProductDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ['id', 'sku', 'name', 'selling_price', 'stock']


class StockLedgerSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model  = StockLedger
        fields = [
            'id', 'tx_id', 'product', 'product_name', 'type',
            'qty', 'balance_after', 'user', 'reference_type',
            'reference_id', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'tx_id', 'balance_after', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model  = PurchaseOrder
        fields = [
            'id', 'po_number',
            'supplier_id', 'supplier_name',
            'created_by_id', 'created_by_name',
            'status', 'total_amount', 'notes',
            'created_at', 'updated_at',
        ]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model  = PurchaseOrderItem
        fields = ['id', 'po_id', 'product_id', 'product_name', 'qty', 'unit_cost', 'subtotal']


class SalesOrderSerializer(serializers.ModelSerializer):
    cashier_name = serializers.CharField(source='cashier.name', read_only=True)

    class Meta:
        model  = SalesOrder
        fields = [
            'receipt_no', 'cashier_id', 'cashier_name',
            'total', 'paid', 'change_given',
            'payment_method', 'status', 'items_count', 'created_at',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'receipt_id', 'product_id', 'product_name', 'qty', 'price', 'subtotal']


# ── Dashboard view serializers ─────────────────────────────────────────────────

class BestSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VBestSeller
        fields = '__all__'


class CategoryBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VCategoryBreakdown
        fields = '__all__'


class DailySalesChartSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VDailySalesChart
        fields = ['date', 'sales', 'txn']


class InventoryReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VInventoryReport
        fields = '__all__'


class LowStockAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VLowStockAlert
        fields = '__all__'
