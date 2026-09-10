import React from 'react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { FABRICS, OCCASIONS, WORKS } from '../../../config/constants';
import { useGetAttributesQuery } from '../../../store/api/ecommerceApi';
import { Product } from '../../../types';

export interface AttributesSectionProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
}

export const AttributesSection: React.FC<AttributesSectionProps> = ({
  formData,
  setFormData,
}) => {
  const { data: attributeGroups = [] } = useGetAttributesQuery();

  const fabricGroup = attributeGroups.find((a) => a.key === 'fabric');
  const workGroup = attributeGroups.find((a) => a.key === 'work');
  const occasionGroup = attributeGroups.find((a) => a.key === 'occasion');
  const patternGroup = attributeGroups.find((a) => a.key === 'pattern');
  const sleeveGroup = attributeGroups.find((a) => a.key === 'sleeve');
  const neckGroup = attributeGroups.find((a) => a.key === 'neck');
  const fitGroup = attributeGroups.find((a) => a.key === 'fit');
  const lengthGroup = attributeGroups.find((a) => a.key === 'length');

  const fabricOptions = fabricGroup?.options?.length
    ? fabricGroup.options.map((o) => ({ value: o.value, label: o.label }))
    : FABRICS.map((f) => ({ value: f, label: f }));

  const workOptions = workGroup?.options?.length
    ? workGroup.options.map((o) => ({ value: o.value, label: o.label }))
    : WORKS.map((w) => ({ value: w, label: w }));

  const occasionOptions = occasionGroup?.options?.length
    ? occasionGroup.options.map((o) => ({ value: o.value, label: o.label }))
    : OCCASIONS.map((o) => ({ value: o, label: o }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Primary Fabric"
          value={formData.fabric || fabricOptions[0]?.value || 'Cotton'}
          onChange={(e) => setFormData((prev) => ({ ...prev, fabric: e.target.value }))}
          options={fabricOptions}
        />

        <Select
          label="Craft & Workmanship"
          value={formData.work || workOptions[0]?.value || 'Zari Embroidery'}
          onChange={(e) => setFormData((prev) => ({ ...prev, work: e.target.value }))}
          options={workOptions}
        />

        <Select
          label="Occasion"
          value={formData.occasion || occasionOptions[0]?.value || 'Festive'}
          onChange={(e) => setFormData((prev) => ({ ...prev, occasion: e.target.value }))}
          options={occasionOptions}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {patternGroup?.options?.length ? (
          <Select
            label="Pattern / Silhouette"
            value={formData.pattern || patternGroup.options[0]?.value || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, pattern: e.target.value }))}
            options={[
              { value: '', label: '-- Select Pattern --' },
              ...patternGroup.options.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        ) : (
          <Input
            label="Pattern / Print"
            placeholder="e.g. Hand-Block Floral Print"
            value={formData.pattern || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, pattern: e.target.value }))}
          />
        )}

        {sleeveGroup?.options?.length ? (
          <Select
            label="Sleeve Styling"
            value={formData.sleeve || sleeveGroup.options[0]?.value || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, sleeve: e.target.value }))}
            options={[
              { value: '', label: '-- Select Sleeve --' },
              ...sleeveGroup.options.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        ) : (
          <Input
            label="Sleeve Styling"
            placeholder="e.g. 3/4th Sleeves with Zari Border"
            value={formData.sleeve || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, sleeve: e.target.value }))}
          />
        )}

        {neckGroup?.options?.length ? (
          <Select
            label="Neck / Collar Style"
            value={formData.neck || neckGroup.options[0]?.value || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, neck: e.target.value }))}
            options={[
              { value: '', label: '-- Select Neck --' },
              ...neckGroup.options.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        ) : (
          <Input
            label="Neck / Collar Style"
            placeholder="e.g. Mandarin Collar with V-Slit"
            value={formData.neck || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, neck: e.target.value }))}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lengthGroup?.options?.length ? (
          <Select
            label="Garment Length"
            value={formData.length || lengthGroup.options[0]?.value || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, length: e.target.value }))}
            options={[
              { value: '', label: '-- Select Length --' },
              ...lengthGroup.options.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        ) : (
          <Input
            label="Length / Fit"
            placeholder="e.g. Calf Length (46 inches)"
            value={formData.length || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, length: e.target.value }))}
          />
        )}

        <Input
          label="Fabric Wash & Care Instructions"
          placeholder="e.g. Dry Clean for first wash, then gentle hand wash"
          value={formData.washCare || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, washCare: e.target.value }))}
        />
      </div>
    </div>
  );
};

