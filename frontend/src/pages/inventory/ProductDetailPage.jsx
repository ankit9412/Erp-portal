import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Edit, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useGetProductQuery, useGetStockMovementsQuery } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, isLoading } = useGetProductQuery(id);
  const { data: movementsData } = useGetStockMovementsQuery({ productId: id, limit: 10 });

  const product = data?.data;
  const movements = movementsData?.data || [];

  useEffect(() => {
    if (product) {
      dispatch(setPageTitle(product.name));
      dispatch(setBreadcrumbs([
        { label: 'Inventory' }, { label: 'Products', href: '/inventory/products' }, { label: product.name },
      ]));
    }
  }, [dispatch, product]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="shimmer h-8 w-48 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
          </div>
          <div className="card-base p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="page-container"><p className="text-muted-foreground">Product not found.</p></div>;

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="section-title">{product.name}</h1>
          <p className="text-muted-foreground text-sm">SKU: {product.sku}</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Edit className="h-4 w-4" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base p-6">
            <h3 className="font-semibold text-foreground mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Selling Price', value: formatCurrency(product.price) },
                { label: 'Cost Price', value: formatCurrency(product.costPrice) },
                { label: 'MRP', value: formatCurrency(product.mrp) },
                { label: 'Tax Rate', value: `${product.taxRate || 0}%` },
                { label: 'Unit', value: product.unit },
                { label: 'HSN Code', value: product.hsnCode || '—' },
                { label: 'Brand', value: product.brand || '—' },
                { label: 'Status', value: product.status },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {product.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">{product.description}</p>
              </div>
            )}
          </div>

          {/* Stock Movements */}
          <div className="card-base p-6">
            <h3 className="font-semibold text-foreground mb-4">Recent Stock Movements</h3>
            {movements.length === 0 ? (
              <p className="text-muted-foreground text-sm">No movements recorded.</p>
            ) : (
              <div className="space-y-2">
                {movements.map((m) => (
                  <div key={m._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{m.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)} · {m.warehouse?.name}</p>
                    </div>
                    <span className={cn('text-sm font-semibold', m.quantity > 0 ? 'text-green-500' : 'text-red-500')}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Stock Status</h3>
            <div className="text-center py-4">
              <p className={cn('text-4xl font-bold', product.stock === 0 ? 'text-red-500' : product.stock <= product.minStockLevel ? 'text-orange-500' : 'text-green-500')}>
                {product.stock}
              </p>
              <p className="text-muted-foreground text-sm mt-1">{product.unit} in stock</p>
            </div>
            {product.stock <= product.minStockLevel && (
              <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Below minimum stock level ({product.minStockLevel})</span>
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Stock</span>
                <span className="font-medium">{product.minStockLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reorder Point</span>
                <span className="font-medium">{product.reorderPoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserved</span>
                <span className="font-medium">{product.reservedStock}</span>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-3">Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sold</span>
                <span className="font-medium">{product.totalSold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-medium">{formatCurrency(product.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit Margin</span>
                <span className="font-medium text-green-500">{product.profitMargin ? `${product.profitMargin}%` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
