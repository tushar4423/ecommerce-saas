import React from 'react';
import { ProductCard as CommonProductCard, ProductCardProps } from '../common/ProductCard';

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  return <CommonProductCard {...props} />;
};

export default ProductCard;
