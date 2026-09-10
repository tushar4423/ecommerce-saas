import React, { useState } from 'react';
import { X, Ruler, Sparkles } from 'lucide-react';
import { useGetSizeGuidesQuery } from '../../store/api/ecommerceApi';
import { Product } from '../../types';
import { SmartFitAssistant } from './SmartFitAssistant';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  selectedSize = 'M',
  onSelectSize = () => {}
}) => {
  const { data: sizeGuides = [] } = useGetSizeGuidesQuery();

  if (!isOpen) return null;

  // Evaluate Precedence Order: Product > Collection > Category > Default
  const activeGuides = sizeGuides.filter((g) => g.isActive !== false);
  let activeGuide = activeGuides.find((g) => g.productIds?.includes(product?.id || ''));
  
  if (!activeGuide && product && product.collections) {
    activeGuide = activeGuides.find((g) => 
      (g.collectionIds || []).some((colId) => product.collections?.includes(colId))
    );
  }

  if (!activeGuide && product) {
    activeGuide = activeGuides.find((g) => 
      (g.categoryIds || []).includes(product.category) ||
      (g.categoryIds || []).includes(product.subcategory || '')
    );
  }

  if (!activeGuide) {
    activeGuide = activeGuides.find((g) => g.isDefault) || activeGuides[0];
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-[#F0E6E1] animate-fade-in overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-5">
          <div className="flex items-center gap-3 text-[#7B2435]">
            <span className="p-2.5 rounded-2xl bg-[#FFF0F3]">
              <Sparkles className="w-5 h-5 text-[#7B2435]" />
            </span>
            <div>
              <h3 className="font-serif text-xl font-bold text-neutral-900">
                {activeGuide?.title || 'Smart Size & Fit Assistant'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {activeGuide?.description || 'Custom tailored dimensions and rule-based fit recommendations.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Smart Fit Assistant Component */}
        {product ? (
          <SmartFitAssistant
            product={product}
            activeGuide={activeGuide}
            selectedSize={selectedSize}
            onSelectSize={(newSize) => {
              onSelectSize(newSize);
            }}
            onClose={onClose}
          />
        ) : (
          <div className="p-8 text-center text-neutral-500 text-sm">
            Please select a product to load custom sizing details.
          </div>
        )}
      </div>
    </div>
  );
};
