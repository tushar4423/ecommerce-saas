import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Sparkles, Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceDisplay } from '../../components/common/PriceDisplay';
import { PageHeader } from '../../components/common/PageHeader';
import { Product, Category } from '../../types';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
} from '../../store/api/ecommerceApi';
import { useToast } from '../../hooks/useToast';
import { ProductFormModal } from './ProductFormModal';

export interface ProductListProps {
  categories: Category[];
  onViewProductOnStore?: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  categories,
  onViewProductOnStore,
}) => {
  const toast = useToast();
  const { data: products = [], isLoading } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const duplicated: Partial<Product> = {
        ...product,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-COPY-${Math.floor(10 + Math.random() * 90)}`,
        slug: `${product.slug}-copy-${Date.now()}`,
      };
      delete (duplicated as any).id;
      await createProduct(duplicated).unwrap();
      toast.success(`Duplicated "${product.name}" successfully.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to duplicate product');
    }
  };

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id).unwrap();
      toast.success(`Deleted "${product.name}" from catalog.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product');
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'image',
      header: 'Product',
      render: (product) => {
        const imgUrl =
          product.images.find((i) => i.isPrimary)?.url ||
          product.images[0]?.url ||
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80';

        return (
          <div className="flex items-center gap-3">
            <img
              src={imgUrl}
              alt={product.name}
              className="w-12 h-16 object-cover rounded-lg border border-neutral-200 shrink-0 bg-neutral-50"
            />
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900 line-clamp-1">{product.name}</span>
              <span className="text-[11px] text-neutral-400 font-mono">SKU: {product.sku}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {product.isBestseller && (
                  <span className="text-[10px] bg-[#FFF0F3] text-[#7B2435] px-1.5 py-0.2 rounded font-bold">
                    Bestseller
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold">
                    New
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (product) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800">{product.category}</span>
          <span className="text-xs text-neutral-500">{product.subcategory}</span>
        </div>
      ),
    },
    {
      key: 'sellingPrice',
      header: 'Price',
      sortable: true,
      render: (product) => (
        <PriceDisplay
          sellingPrice={product.sellingPrice}
          mrp={product.mrp}
          size="sm"
          showDiscountBadge={false}
        />
      ),
    },
    {
      key: 'inventory',
      header: 'Inventory',
      render: (product) => {
        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) ?? 0;
        const status = totalStock > 5 ? 'In Stock' : totalStock > 0 ? 'Low Stock' : 'Out of Stock';

        return (
          <div className="flex flex-col gap-1">
            <StatusBadge status={status} />
            <span className="text-[11px] text-neutral-500 font-medium">
              {totalStock} units ({product.variants?.map((v) => `${v.size}:${v.stock}`).join(', ')})
            </span>
          </div>
        );
      },
    },
    {
      key: 'fabric',
      header: 'Fabric / Craft',
      render: (product) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-neutral-800">{product.fabric || 'Cotton'}</span>
          <span className="text-neutral-500">{product.work || 'Printed'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (product) => (
        <div className="flex items-center justify-end gap-1.5">
          {onViewProductOnStore && (
            <button
              type="button"
              title="Preview on store"
              onClick={() => onViewProductOnStore(product)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            title="Edit product"
            onClick={() => handleOpenEdit(product)}
            className="p-1.5 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FFF0F3] rounded-lg cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Duplicate product"
            onClick={() => handleDuplicate(product)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Delete product"
            onClick={() => handleDelete(product)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kurti Catalog & Product Management"
        subtitle="Manage inventory, variants (M, L, XL, XXL), pricing, high-res photos, and attributes."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Kurti
          </Button>
        }
      />

      <DataTable
        data={products}
        columns={columns}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search kurtis by title, SKU, fabric, or category..."
        searchFilter={(p, q) => {
          const cleanQ = q.trim().toLowerCase();
          const tokens = cleanQ.split(/\s+/).filter(Boolean);
          const name = (p.name || '').toLowerCase();
          const sku = (p.sku || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();
          const subcat = (p.subcategory || '').toLowerCase();
          const fabric = (p.fabric || '').toLowerCase();
          const work = (p.work || '').toLowerCase();
          const tags = (p.tags || []).join(' ').toLowerCase();
          const variants = (p.variants || []).map((v) => `${v.size} ${v.color}`).join(' ').toLowerCase();
          const haystack = `${name} ${sku} ${cat} ${subcat} ${fabric} ${work} ${tags} ${variants}`;
          return tokens.every((token) => haystack.includes(token));
        }}
        emptyTitle="No kurtis in catalog"
        emptyDescription="Get started by adding your first handcrafted kurti collection item."
      />

      {/* Reusable Multi-Step Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProduct}
        categories={categories}
      />
    </div>
  );
};
