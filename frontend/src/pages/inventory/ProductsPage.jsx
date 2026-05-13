import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Download, Package, Edit, Trash2, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { useGetProductsQuery, useDeleteProductMutation } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import ProductModal from './components/ProductModal';

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  const colorMap = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    muted: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground',
  };
  return <span className={colorMap[color] || colorMap.muted}>{status}</span>;
};

const ProductsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [filters, setFilters] = useState({ status: '', lowStock: '' });

  const { data, isLoading, isFetching, refetch } = useGetProductsQuery({
    page, limit: 20, search, ...filters,
  });
  const [deleteProduct] = useDeleteProductMutation();

  useEffect(() => {
    dispatch(setPageTitle('Products'));
    dispatch(setBreadcrumbs([{ label: 'Inventory' }, { label: 'Products' }]));
  }, [dispatch]);

  const products = data?.products || [];
  const pagination = data?.pagination || {};

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deleted.');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed.');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || 0} products in your catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => { setEditProduct(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products, SKU..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="input-base w-auto"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
        <select
          value={filters.lowStock}
          onChange={(e) => setFilters((f) => ({ ...f, lowStock: e.target.value }))}
          className="input-base w-auto"
        >
          <option value="">All Stock</option>
          <option value="true">Low Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th">SKU</th>
              <th className="table-th">Category</th>
              <th className="table-th">Price</th>
              <th className="table-th">Stock</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-16">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No products found</p>
                  <button
                    onClick={() => { setEditProduct(null); setShowModal(true); }}
                    className="btn-primary mt-3 text-sm"
                  >
                    Add your first product
                  </button>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <motion.tr
                  key={product._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{product.sku}</code>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {product.category?.name || '—'}
                  </td>
                  <td className="table-td font-medium text-sm">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      {product.stock <= product.minStockLevel && product.stock > 0 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                      )}
                      <span className={cn(
                        'text-sm font-medium',
                        product.stock === 0 ? 'text-red-500' :
                        product.stock <= product.minStockLevel ? 'text-orange-500' : 'text-foreground'
                      )}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/inventory/products/${product._id}`)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    page === p ? 'bg-primary text-primary-foreground' : 'btn-ghost'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editProduct}
            onClose={() => { setShowModal(false); setEditProduct(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;
