# =====================================================
# api/models.py
# Django models mapped to existing optistock_db tables
# managed = False → Django will NOT alter these tables
# =====================================================
from django.db import models


# ── MODULE 1 — INVENTORY ──────────────────────────────────────────────────────

class Category(models.Model):
    id            = models.CharField(max_length=20, primary_key=True)
    name          = models.CharField(max_length=100, unique=True)
    description   = models.TextField(blank=True, null=True)
    product_count = models.IntegerField(default=0)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'categories'

    def __str__(self):
        return self.name


class Supplier(models.Model):
    id                = models.CharField(max_length=20, primary_key=True)
    company_name      = models.CharField(max_length=150, unique=True)
    contact_person    = models.CharField(max_length=100, blank=True, null=True)
    email             = models.CharField(max_length=100, blank=True, null=True)
    phone             = models.CharField(max_length=30, blank=True, null=True)
    address           = models.TextField(blank=True, null=True)
    products_supplied = models.IntegerField(default=0)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'suppliers'

    def __str__(self):
        return self.company_name


class User(models.Model):
    ROLE_CHOICES = [
        ('Store Admin',      'Store Admin'),
        ('Store Manager',    'Store Manager'),
        ('POS Cashier',      'POS Cashier'),
        ('Inventory Clerk',  'Inventory Clerk'),
    ]
    STATUS_CHOICES = [
        ('Active',  'Active'),
        ('Locked',  'Locked'),
        ('Pending', 'Pending'),
    ]
    id            = models.CharField(max_length=20, primary_key=True)
    email         = models.CharField(max_length=100, unique=True)
    name          = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    role          = models.CharField(max_length=30, choices=ROLE_CHOICES)
    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_CHOICES = [('active', 'active'), ('archived', 'archived')]

    id            = models.CharField(max_length=20, primary_key=True)
    sku           = models.CharField(max_length=50, unique=True)
    name          = models.CharField(max_length=200)
    category      = models.ForeignKey(Category, db_column='category_id', on_delete=models.SET_NULL, null=True, blank=True)
    supplier      = models.ForeignKey(Supplier, db_column='supplier_id', on_delete=models.SET_NULL, null=True, blank=True)
    cost_price    = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    stock         = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)
    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'products'

    def __str__(self):
        return self.name


class StockLedger(models.Model):
    TYPE_CHOICES = [
        ('Stock In',    'Stock In'),
        ('Stock Out',   'Stock Out'),
        ('Adjustment',  'Adjustment'),
    ]
    id             = models.BigAutoField(primary_key=True)
    tx_id          = models.CharField(max_length=40, unique=True)
    product        = models.ForeignKey(Product, db_column='product_id', on_delete=models.CASCADE)
    type           = models.CharField(max_length=15, choices=TYPE_CHOICES)
    qty            = models.IntegerField()
    balance_after  = models.IntegerField()
    user           = models.ForeignKey(User, db_column='user_id', on_delete=models.SET_NULL, null=True, blank=True)
    reference_type = models.CharField(max_length=20, blank=True, null=True)
    reference_id   = models.CharField(max_length=40, blank=True, null=True)
    notes          = models.TextField(blank=True, null=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'stock_ledger'


class Notification(models.Model):
    id          = models.BigAutoField(primary_key=True)
    user        = models.ForeignKey(User, db_column='user_id', on_delete=models.SET_NULL, null=True, blank=True)
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    type        = models.CharField(max_length=40, blank=True, null=True)
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'notifications'


# ── MODULE 1 (cont.) — PURCHASE ORDERS ──────────────────────────────────────

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('Pending',   'Pending'),
        ('Received',  'Received'),
        ('Cancelled', 'Cancelled'),
    ]
    id           = models.BigAutoField(primary_key=True)
    po_number    = models.CharField(max_length=40, unique=True)
    supplier     = models.ForeignKey(Supplier, db_column='supplier_id', on_delete=models.PROTECT)
    created_by   = models.ForeignKey(User, db_column='created_by', on_delete=models.SET_NULL, null=True, blank=True)
    status       = models.CharField(max_length=12, choices=STATUS_CHOICES, default='Pending')
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes        = models.TextField(blank=True, null=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'purchase_orders'

    def __str__(self):
        return self.po_number


class PurchaseOrderItem(models.Model):
    id         = models.BigAutoField(primary_key=True)
    po         = models.ForeignKey(PurchaseOrder, db_column='po_id', on_delete=models.CASCADE)
    product    = models.ForeignKey(Product, db_column='product_id', on_delete=models.PROTECT)
    qty        = models.IntegerField()
    unit_cost  = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal   = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'purchase_order_items'


# ── MODULE 2 — POS ────────────────────────────────────────────────────────────

class SalesOrder(models.Model):
    PAYMENT_CHOICES = [('Cash', 'Cash'), ('GCash', 'GCash'), ('Card', 'Card')]
    STATUS_CHOICES  = [('Completed', 'Completed'), ('Refunded', 'Refunded'), ('Cancelled', 'Cancelled')]

    receipt_no     = models.CharField(max_length=30, primary_key=True)
    cashier        = models.ForeignKey(User, db_column='cashier_id', on_delete=models.PROTECT)
    total          = models.DecimalField(max_digits=12, decimal_places=2)
    paid           = models.DecimalField(max_digits=12, decimal_places=2)
    change_given   = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES)
    status         = models.CharField(max_length=12, choices=STATUS_CHOICES, default='Completed')
    items_count    = models.IntegerField()
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'sales_orders'


class OrderItem(models.Model):
    id         = models.BigAutoField(primary_key=True)
    receipt    = models.ForeignKey(SalesOrder, db_column='receipt_no', on_delete=models.CASCADE)
    product    = models.ForeignKey(Product, db_column='product_id', on_delete=models.PROTECT)
    qty        = models.IntegerField()
    price      = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal   = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'order_items'


# ── MODULE 3 — DASHBOARD VIEWS (read-only) ────────────────────────────────────

class VBestSeller(models.Model):
    rank  = models.IntegerField()
    id    = models.CharField(max_length=20, primary_key=True)
    name  = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    sold  = models.IntegerField()
    revenue = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'v_best_sellers'


class VCategoryBreakdown(models.Model):
    id    = models.CharField(max_length=20, primary_key=True)
    name  = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=7, decimal_places=1)
    color = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'v_category_breakdown'


class VDailySalesChart(models.Model):
    date  = models.CharField(max_length=10, primary_key=True)
    sales = models.DecimalField(max_digits=14, decimal_places=2)
    txn   = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'v_daily_sales_chart'


class VInventoryReport(models.Model):
    id       = models.CharField(max_length=20, primary_key=True)
    sku      = models.CharField(max_length=50)
    name     = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    stock    = models.IntegerField()
    value    = models.DecimalField(max_digits=14, decimal_places=2)
    status   = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'v_inventory_report'


class VLowStockAlert(models.Model):
    id       = models.CharField(max_length=20, primary_key=True)
    sku      = models.CharField(max_length=50)
    name     = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    stock    = models.IntegerField()
    reorder  = models.IntegerField()
    status   = models.CharField(max_length=10)

    class Meta:
        managed = False
        db_table = 'v_low_stock_alerts'
