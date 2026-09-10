import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeSizeGuide } from '../../store/slices/uiSlice';
import { SIZE_CHART } from '../../config/constants';

export const SizeGuideModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSizeGuideOpen);
  const product = useAppSelector((state) => state.ui.sizeGuideProduct);

  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeSizeGuide())}
      title="Nandita Fashion — Ethnic Kurti Size Guide"
      subtitle="Standard Indian Kurti & Suit Set Measurement Chart (Regular Comfort Fit)"
      size="lg"
    >
      <div className="space-y-6">
        {/* Unit Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            All our kurtis are designed with +2 inches ease over body measurements for a flattering silhouette.
          </p>
          <div className="bg-[#FAF6F0] p-1 rounded-xl flex items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                unit === 'inches' ? 'bg-[#7B2435] text-white shadow-xs' : 'text-neutral-600'
              }`}
            >
              Inches (in)
            </button>
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                unit === 'cm' ? 'bg-[#7B2435] text-white shadow-xs' : 'text-neutral-600'
              }`}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Size Chart Table */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-center text-xs">
            <thead className="bg-[#FAF6F0] text-neutral-700 font-bold border-b border-neutral-200">
              <tr>
                <th className="py-3 px-3 text-left">Size</th>
                <th className="py-3 px-3">Bust ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-3">Waist ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-3">Hip ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-3">Length ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th className="py-3 px-3">Shoulder ({unit === 'inches' ? 'in' : 'cm'})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
              {SIZE_CHART.map((row) => {
                const multiplier = unit === 'cm' ? 2.54 : 1;
                const formatVal = (v: number) =>
                  unit === 'cm' ? (v * multiplier).toFixed(0) : v.toString();

                return (
                  <tr key={row.size} className="hover:bg-[#FFF0F3]/30 transition-colors">
                    <td className="py-3 px-3 text-left font-bold text-[#7B2435] font-serif text-sm">
                      {row.size}
                    </td>
                    <td className="py-3 px-3">{formatVal(row.bust)}</td>
                    <td className="py-3 px-3">{formatVal(row.waist)}</td>
                    <td className="py-3 px-3">{formatVal(row.hip)}</td>
                    <td className="py-3 px-3">{formatVal(row.length)}</td>
                    <td className="py-3 px-3">{formatVal(row.shoulder)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* How to Measure Instructions */}
        <div className="p-4 rounded-xl bg-[#FAF6F0] border border-neutral-200/80 space-y-2">
          <h4 className="font-serif text-sm font-bold text-neutral-900">How to Measure for the Perfect Fit:</h4>
          <ul className="text-xs text-neutral-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              <strong>Bust:</strong> Measure around the fullest part of your bust, keeping the measuring tape horizontal.
            </li>
            <li>
              <strong>Waist:</strong> Measure around your natural waistline, keeping one finger between tape and body.
            </li>
            <li>
              <strong>Hip:</strong> Measure around the fullest point of your hips.
            </li>
            <li>
              <strong>Tip:</strong> If you are between sizes, we recommend sizing up for a relaxed, comfortable drape.
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
