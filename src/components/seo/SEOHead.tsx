import React, { useEffect } from 'react';
import { updateSEO, SEOProps } from '../../services/seo';
import { useGetSettingsQuery } from '../../store/api/ecommerceApi';

export const SEOHead: React.FC<SEOProps> = (props) => {
  const { data: settings } = useGetSettingsQuery();

  useEffect(() => {
    updateSEO({
      ...props,
      brandName: settings?.brandName || 'Nandita Fashion',
    });
  }, [props, settings?.brandName]);

  return null;
};
