import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { Category, Product } from '../../types';
import { useCreateProductMutation, useUpdateProductMutation } from '../../store/api/ecommerceApi';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { PricingSection } from './sections/PricingSection';
import { MediaSection } from './sections/MediaSection';
import { VariantsInventorySection } from './sections/VariantsInventorySection';
import { AttributesSection } from './sections/AttributesSection';
import { SeoSection } from './sections/SeoSection';
import { slugify } from '../../utils/formatters';

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
}

const DEFAULT_KURTI_IMAGES = [
  {
    id: 'img-krt-default-1',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    altText: 'Handcrafted Festive Kurti',
    isPrimary: true,
  },
];

const DEFAULT_KURTI_VARIANTS = [
  { id: 'v-s', sku: 'NF-KRT-S', size: 'S', color: 'Maroon', colorHex: '#7B2435', stock: 10 },
  { id: 'v-m', sku: 'NF-KRT-M', size: 'M', color: 'Maroon', colorHex: '#7B2435', stock: 15 },
  { id: 'v-l', sku: 'NF-KRT-L', size: 'L', color: 'Maroon', colorHex: '#7B2435', stock: 20 },
  { id: 'v-xl', sku: 'NF-KRT-XL', size: 'XL', color: 'Maroon', colorHex: '#7B2435', stock: 12 },
  { id: 'v-xxl', sku: 'NF-KRT-XXL', size: 'XXL', color: 'Maroon', colorHex: '#7B2435', stock: 8 },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Women',
    subcategory: 'Kurtas & Kurtis',
    slug: '',
    description: '',
    mrp: 1999,
    sellingPrice: 1499,
    discountPercent: 25,
    fabric: 'Pure Handloom Cotton',
    work: 'Hand-Block Floral Print',
    occasion: 'Daily & Office Wear',
    pattern: 'Printed',
    sleeve: '3/4th Sleeves',
    neck: 'Mandarin Collar',
    neckType: 'Mandarin Collar',
    length: 'Calf Length (44")',
    washCare: 'Gentle Machine Wash',
    isBestseller: false,
    isNewArrival: true,
    isTrending: false,
    images: DEFAULT_KURTI_IMAGES,
    variants: DEFAULT_KURTI_VARIANTS,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ['cotton kurti', 'ethnic wear', 'nandita fashion'],
    },
  });

  // Track the previous isOpen state so we only initialize when modal opens
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    // Only re-initialize form state when modal transitions from closed to open
    if (isOpen && (!prevIsOpenRef.current || productToEdit?.id !== formData.id)) {
      if (productToEdit) {
        setFormData({
          ...productToEdit,
          neck: productToEdit.neck || productToEdit.neckType || 'Mandarin Collar',
          neckType: productToEdit.neckType || productToEdit.neck || 'Mandarin Collar',
          images: productToEdit.images?.length ? productToEdit.images : DEFAULT_KURTI_IMAGES,
          variants: productToEdit.variants?.length ? productToEdit.variants : DEFAULT_KURTI_VARIANTS,
        });
      } else {
        const defaultCat = (categories && categories.length > 0) ? categories[0].name : 'Women';
        const randomCode = Math.floor(100 + Math.random() * 900);
        const newSku = `NF-KRT-${randomCode}`;
        setFormData({
          name: '',
          sku: newSku,
          category: defaultCat,
          subcategory: 'Kurtas & Kurtis',
          slug: '',
          description: '',
          mrp: 1999,
          sellingPrice: 1499,
          discountPercent: 25,
          fabric: 'Pure Handloom Cotton',
          work: 'Hand-Block Floral Print',
          occasion: 'Daily & Office Wear',
          pattern: 'Printed',
          sleeve: '3/4th Sleeves',
          neck: 'Mandarin Collar',
          neckType: 'Mandarin Collar',
          length: 'Calf Length (44")',
          washCare: 'Gentle Machine Wash',
          isBestseller: false,
          isNewArrival: true,
          isTrending: false,
          images: DEFAULT_KURTI_IMAGES,
          variants: [
            { id: `v-${Date.now()}-s`, sku: `${newSku}-S`, size: 'S', color: 'Maroon', colorHex: '#7B2435', stock: 10 },
            { id: `v-${Date.now()}-m`, sku: `${newSku}-M`, size: 'M', color: 'Maroon', colorHex: '#7B2435', stock: 15 },
            { id: `v-${Date.now()}-l`, sku: `${newSku}-L`, size: 'L', color: 'Maroon', colorHex: '#7B2435', stock: 20 },
            { id: `v-${Date.now()}-xl`, sku: `${newSku}-XL`, size: 'XL', color: 'Maroon', colorHex: '#7B2435', stock: 12 },
            { id: `v-${Date.now()}-xxl`, sku: `${newSku}-XXL`, size: 'XXL', color: 'Maroon', colorHex: '#7B2435', stock: 8 },
          ],
          seo: {
            metaTitle: '',
            metaDescription: '',
            keywords: ['cotton kurti', 'ethnic wear', 'nandita fashion'],
          },
        });
      }
      setActiveTab('basic');
      setErrors({});
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, productToEdit]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Product name is required';
    if (!formData.sku?.trim()) errs.sku = 'SKU is required';
    
    const mrp = Number(formData.mrp);
    const sp = Number(formData.sellingPrice);

    if (isNaN(mrp) || mrp <= 0) {
      errs.mrp = 'Please enter a valid MRP greater than 0';
    }
    if (isNaN(sp) || sp <= 0) {
      errs.sellingPrice = 'Please enter a valid selling price greater than 0';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill required fields in Basic Info and Pricing');
      if (errs.name || errs.sku) setActiveTab('basic');
      else if (errs.mrp || errs.sellingPrice) setActiveTab('pricing');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const cleanSlug = formData.slug?.trim() || slugify(formData.name || 'ethnic-kurti');
      const mrpNum = Number(formData.mrp) || 1999;
      const spNum = Number(formData.sellingPrice) || 1499;
      const discount = mrpNum > spNum ? Math.round(((mrpNum - spNum) / mrpNum) * 100) : 0;

      const payload: Partial<Product> = {
        ...formData,
        name: formData.name?.trim(),
        sku: formData.sku?.trim(),
        slug: cleanSlug,
        mrp: mrpNum,
        sellingPrice: spNum,
        discountPercent: discount,
        neckType: formData.neckType || formData.neck || 'Mandarin Collar',
        neck: formData.neck || formData.neckType || 'Mandarin Collar',
        category: formData.category || 'Women',
        subcategory: formData.subcategory || 'Kurtas & Kurtis',
        images: formData.images && formData.images.length > 0 ? formData.images : DEFAULT_KURTI_IMAGES,
        variants: formData.variants && formData.variants.length > 0 ? formData.variants : DEFAULT_KURTI_VARIANTS,
      };

      if (productToEdit) {
        await updateProduct({ id: productToEdit.id, updates: payload }).unwrap();
        toast.success(`Updated "${payload.name}" successfully!`);
      } else {
        await createProduct(payload).unwrap();
        toast.success(`Added new kurti "${payload.name}" to catalog!`);
      }
      onClose();
    } catch (err: any) {
      console.error('Save product error:', err);
      toast.error(err?.message || 'Failed to save product. Please check network/console.');
    }
  };

  const tabsList = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'pricing', label: '2. Pricing & Taxes' },
    { id: 'media', label: `3. Media & Images (${formData.images?.length || 0})` },
    { id: 'variants', label: `4. Variants (${formData.variants?.length || 0})` },
    { id: 'attributes', label: '5. Fabric & Fit' },
    { id: 'seo', label: '6. SEO & Meta' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={productToEdit ? `Edit Kurti: ${productToEdit.name}` : 'Add New Ethnic Kurti to Catalog'}
      subtitle="Complete product details, multi-size inventory, high-res photos and SEO tags."
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            isLoading={isCreating || isUpdating}
            onClick={handleSave}
          >
            {productToEdit ? 'Save Changes' : 'Publish Product to Store'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Step Navigation Tabs */}
        <Tabs
          tabs={tabsList}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
          className="pb-2 border-b border-neutral-100"
        />

        {/* Section View Router */}
        {activeTab === 'basic' && (
          <BasicInfoSection
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            errors={errors}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}

        {activeTab === 'media' && (
          <MediaSection
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {activeTab === 'variants' && (
          <VariantsInventorySection
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {activeTab === 'attributes' && (
          <AttributesSection
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {activeTab === 'seo' && (
          <SeoSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
      </div>
    </Modal>
  );
};
