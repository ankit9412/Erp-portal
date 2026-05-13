import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useCreateProductMutation, useUpdateProductMutation } from '../../../features/inventory/inventoryApi';
import { cn } from '../../../utils/cn';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  costPrice: z.coerce.number().min(0).optional(),
  unit: z.string().default('pcs'),
  minStockLevel: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  status: z.string().default('active'),
});

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="label-base mb-1.5 block">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {children}
    {error && <p className="text-destructive text-xs mt-1">{error}</p>}
  </div>
);

const ProductModal = ({ product, onClose }) => {
  const isEdit = !!product;
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      unit: product.unit,
      minStockLevel: product.minStockLevel,
      reorderPoint: product.reorderPoint,
      taxRate: product.taxRate,
      description: product.description,
      hsnCode: product.hsnCode,
      status: product.status,
    } : { unit: 'pcs', status: 'active' },
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateProduct({ id: product._id, ...data }).unwrap();
        toast.success('Product updated.');
      } else {
        await createProduct(data).unwrap();
        toast.success('Product created.');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Operation failed.');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name" error={errors.name?.message} required>
                  <input {...register('name')} placeholder="e.g. Blue T-Shirt" className={cn('input-base', errors.name && 'border-destructive')} />
                </Field>
                <Field label="SKU" error={errors.sku?.message} required>
                  <input {...register('sku')} placeholder="e.g. TSH-BLU-001" className={cn('input-base', errors.sku && 'border-destructive')} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Selling Price (₹)" error={errors.price?.message} required>
                  <input {...register('price')} type="number" step="0.01" placeholder="0.00" className={cn('input-base', errors.price && 'border-destructive')} />
                </Field>
                <Field label="Cost Price (₹)" error={errors.costPrice?.message}>
                  <input {...register('costPrice')} type="number" step="0.01" placeholder="0.00" className="input-base" />
                </Field>
                <Field label="Tax Rate (%)" error={errors.taxRate?.message}>
                  <input {...register('taxRate')} type="number" step="0.01" placeholder="18" className="input-base" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Unit">
                  <select {...register('unit')} className="input-base">
                    {['pcs', 'kg', 'g', 'ltr', 'ml', 'mtr', 'cm', 'box', 'pack', 'dozen', 'pair'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Min Stock Level">
                  <input {...register('minStockLevel')} type="number" placeholder="0" className="input-base" />
                </Field>
                <Field label="Reorder Point">
                  <input {...register('reorderPoint')} type="number" placeholder="0" className="input-base" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="HSN/SAC Code">
                  <input {...register('hsnCode')} placeholder="e.g. 6109" className="input-base" />
                </Field>
                <Field label="Status">
                  <select {...register('status')} className="input-base">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="draft">Draft</option>
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea {...register('description')} rows={3} placeholder="Product description..." className="input-base resize-none" />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default ProductModal;
