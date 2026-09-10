import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Ruler, 
  HelpCircle, 
  Layers, 
  AlertTriangle, 
  Sparkles, 
  Video, 
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { 
  useGetSizeGuidesQuery, 
  useCreateSizeGuideMutation, 
  useUpdateSizeGuideMutation, 
  useDeleteSizeGuideMutation,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useGetSizeGuideConflictsQuery,
  useGetSizeOverrideAnalyticsQuery
} from '../../store/api/ecommerceApi';
import { 
  SizeGuide, 
  SizeMeasurementRow, 
  SizeMeasurementColumn, 
  RecommendationRule, 
  MeasurementInstructionItem 
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const SizeGuideManager: React.FC = () => {
  const { data: sizeGuides = [], isLoading } = useGetSizeGuidesQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: collections = [] } = useGetCollectionsQuery();
  const { data: conflictsData } = useGetSizeGuideConflictsQuery();
  const { data: overrideAnalytics = [] } = useGetSizeOverrideAnalyticsQuery();

  const [createSizeGuide] = useCreateSizeGuideMutation();
  const [updateSizeGuide] = useUpdateSizeGuideMutation();
  const [deleteSizeGuide] = useDeleteSizeGuideMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guides' | 'conflicts' | 'analytics'>('guides');
  const [editorTab, setEditorTab] = useState<'basics' | 'columns_rows' | 'rules' | 'media'>('basics');

  // Form State
  const [formState, setFormState] = useState<{
    title: string;
    description: string;
    measurementType: 'body' | 'garment';
    precedenceLevel: 'product' | 'collection' | 'category' | 'default';
    selectedCategories: string[];
    selectedCollections: string[];
    unitDefault: 'inches' | 'cm';
    easeAllowanceInches: number;
    isActive: boolean;
    isDefault: boolean;
    customColumns: SizeMeasurementColumn[];
    measurements: SizeMeasurementRow[];
    rules: RecommendationRule[];
    bustTip: string;
    waistTip: string;
    hipTip: string;
    lengthTip: string;
    shoulderTip: string;
    easeNote: string;
    instructions: MeasurementInstructionItem[];
  }>({
    title: '',
    description: '',
    measurementType: 'garment',
    precedenceLevel: 'category',
    selectedCategories: ['kurtas-kurtis'],
    selectedCollections: [],
    unitDefault: 'inches',
    easeAllowanceInches: 2.0,
    isActive: true,
    isDefault: false,
    customColumns: [
      { id: 'col-bust', name: 'Bust (Chest)', key: 'bust', unit: 'inches', isRequired: true },
      { id: 'col-waist', name: 'Waist', key: 'waist', unit: 'inches', isRequired: true },
      { id: 'col-hip', name: 'Hip', key: 'hip', unit: 'inches', isRequired: true },
      { id: 'col-length', name: 'Length', key: 'length', unit: 'inches', isRequired: false },
      { id: 'col-shoulder', name: 'Shoulder', key: 'shoulder', unit: 'inches', isRequired: false },
    ],
    measurements: [
      { size: 'XS', bust: 34, waist: 30, hip: 36, length: 44, shoulder: 13.5 },
      { size: 'S', bust: 36, waist: 32, hip: 38, length: 44, shoulder: 14.0 },
      { size: 'M', bust: 38, waist: 34, hip: 40, length: 44, shoulder: 14.5 },
      { size: 'L', bust: 40, waist: 36, hip: 42, length: 45, shoulder: 15.0 },
      { size: 'XL', bust: 42, waist: 38, hip: 44, length: 45, shoulder: 15.5 },
      { size: '2XL', bust: 44, waist: 40, hip: 46, length: 46, shoulder: 16.0 },
    ],
    rules: [
      {
        id: 'rule-m',
        name: 'Medium Fit Rule',
        priority: 10,
        condition: { minBust: 34.0, maxBust: 36.5, fitPreference: 'regular' },
        recommendedSize: 'M',
        easeAdjustmentInches: 2.0,
        confidenceScore: 95,
        explanation: 'Provides 2-inch standard ease over 34-36.5" bust profile.',
        betweenSizesRecommendation: 'size_up',
        isActive: true,
      }
    ],
    bustTip: 'Measure around the fullest part of your chest with measuring tape parallel to the floor.',
    waistTip: 'Measure around your natural waistline, keeping the tape comfortably loose.',
    hipTip: 'Measure around the widest point of your hips and seat.',
    lengthTip: 'Measured from high point shoulder down to the garment hemline.',
    shoulderTip: 'Measured from shoulder bone edge to edge across upper back.',
    easeNote: 'Features standard +2 inch ease over body measurements for optimal drape.',
    instructions: [
      {
        field: 'bust',
        label: 'Bust / Chest Circumference',
        tip: 'Hold tape level across fullest part of bust without pulling taut.',
        imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      },
      {
        field: 'waist',
        label: 'Natural Waistline',
        tip: 'Find narrowest part of torso approx. 1-2 inches above navel.',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      }
    ]
  });

  const handleStartCreate = () => {
    setEditingId(null);
    setFormState({
      title: '',
      description: '',
      measurementType: 'garment',
      precedenceLevel: 'category',
      selectedCategories: ['kurtas-kurtis'],
      selectedCollections: [],
      unitDefault: 'inches',
      easeAllowanceInches: 2.0,
      isActive: true,
      isDefault: false,
      customColumns: [
        { id: 'col-bust', name: 'Bust (Chest)', key: 'bust', unit: 'inches', isRequired: true },
        { id: 'col-waist', name: 'Waist', key: 'waist', unit: 'inches', isRequired: true },
        { id: 'col-hip', name: 'Hip', key: 'hip', unit: 'inches', isRequired: true },
        { id: 'col-length', name: 'Length', key: 'length', unit: 'inches', isRequired: false },
        { id: 'col-shoulder', name: 'Shoulder', key: 'shoulder', unit: 'inches', isRequired: false },
      ],
      measurements: [
        { size: 'XS', bust: 34, waist: 30, hip: 36, length: 44, shoulder: 13.5 },
        { size: 'S', bust: 36, waist: 32, hip: 38, length: 44, shoulder: 14.0 },
        { size: 'M', bust: 38, waist: 34, hip: 40, length: 44, shoulder: 14.5 },
        { size: 'L', bust: 40, waist: 36, hip: 42, length: 45, shoulder: 15.0 },
        { size: 'XL', bust: 42, waist: 38, hip: 44, length: 45, shoulder: 15.5 },
        { size: '2XL', bust: 44, waist: 40, hip: 46, length: 46, shoulder: 16.0 },
      ],
      rules: [],
      bustTip: 'Measure around fullest part of chest keeping tape level.',
      waistTip: 'Measure natural waistline.',
      hipTip: 'Measure fullest point of hips.',
      lengthTip: 'Shoulder high point to hem.',
      shoulderTip: 'Shoulder bone to shoulder bone across back.',
      easeNote: 'Finished garment includes +2 inch comfort ease.',
      instructions: [
        {
          field: 'bust',
          label: 'Bust / Chest Circumference',
          tip: 'Hold tape level across fullest part of bust without pulling taut.',
          imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        }
      ]
    });
    setEditorTab('basics');
    setIsEditing(true);
  };

  const handleStartEdit = (guide: SizeGuide) => {
    setEditingId(guide.id);
    setFormState({
      title: guide.title,
      description: guide.description || '',
      measurementType: guide.measurementType || 'garment',
      precedenceLevel: guide.precedenceLevel || 'category',
      selectedCategories: guide.categoryIds || [],
      selectedCollections: guide.collectionIds || [],
      unitDefault: guide.unitDefault || 'inches',
      easeAllowanceInches: guide.easeAllowanceInches || 2.0,
      isActive: guide.isActive,
      isDefault: guide.isDefault || false,
      customColumns: guide.customColumns && guide.customColumns.length > 0 ? guide.customColumns : [
        { id: 'col-bust', name: 'Bust (Chest)', key: 'bust', unit: 'inches', isRequired: true },
        { id: 'col-waist', name: 'Waist', key: 'waist', unit: 'inches', isRequired: true },
        { id: 'col-hip', name: 'Hip', key: 'hip', unit: 'inches', isRequired: true },
        { id: 'col-length', name: 'Length', key: 'length', unit: 'inches', isRequired: false },
        { id: 'col-shoulder', name: 'Shoulder', key: 'shoulder', unit: 'inches', isRequired: false },
      ],
      measurements: guide.measurements && guide.measurements.length > 0 ? guide.measurements : [
        { size: 'M', bust: 38, waist: 34, hip: 40, length: 44, shoulder: 14.5 }
      ],
      rules: guide.rules || [],
      bustTip: guide.howToMeasure?.bustTip || '',
      waistTip: guide.howToMeasure?.waistTip || '',
      hipTip: guide.howToMeasure?.hipTip || '',
      lengthTip: guide.howToMeasure?.lengthTip || '',
      shoulderTip: guide.howToMeasure?.shoulderTip || '',
      easeNote: guide.howToMeasure?.easeNote || '',
      instructions: guide.howToMeasure?.instructions || [
        {
          field: 'bust',
          label: 'Bust / Chest Circumference',
          tip: 'Hold tape level across fullest part of bust.',
          imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        }
      ]
    });
    setEditorTab('basics');
    setIsEditing(true);
  };

  // Dynamic Column Builder Handlers
  const handleAddCustomColumn = () => {
    const colName = prompt('Enter measurement column name (e.g., Armhole Round, Flare, Thigh):');
    if (!colName) return;
    const colKey = colName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCol: SizeMeasurementColumn = {
      id: `col-${Date.now()}`,
      name: colName,
      key: colKey,
      unit: formState.unitDefault,
      isRequired: false,
    };
    setFormState({
      ...formState,
      customColumns: [...formState.customColumns, newCol],
    });
  };

  const handleRemoveCustomColumn = (colId: string) => {
    setFormState({
      ...formState,
      customColumns: formState.customColumns.filter(c => c.id !== colId),
    });
  };

  // Dynamic Row Builder Handlers
  const handleAddMeasurementRow = () => {
    const next = [...formState.measurements];
    next.push({
      size: '3XL',
      bust: 46,
      waist: 42,
      hip: 48,
      length: 46,
      shoulder: 16.5,
    });
    setFormState({ ...formState, measurements: next });
  };

  const handleRemoveMeasurementRow = (index: number) => {
    const next = formState.measurements.filter((_, i) => i !== index);
    setFormState({ ...formState, measurements: next });
  };

  const handleMeasurementChange = (rowIndex: number, colKey: string, value: any) => {
    const next = [...formState.measurements];
    const num = colKey === 'size' ? value : Number(value);
    next[rowIndex] = { ...next[rowIndex], [colKey]: num };
    setFormState({ ...formState, measurements: next });
  };

  // Rule Priority Builder Handlers
  const handleAddRule = () => {
    const newRule: RecommendationRule = {
      id: `rule-${Date.now()}`,
      name: `Fit Rule #${formState.rules.length + 1}`,
      priority: (formState.rules.length + 1) * 10,
      condition: { minBust: 36, maxBust: 38, fitPreference: 'regular' },
      recommendedSize: 'L',
      easeAdjustmentInches: formState.easeAllowanceInches,
      confidenceScore: 95,
      explanation: 'Matched rule with +2 inch comfort ease.',
      betweenSizesRecommendation: 'size_up',
      isActive: true,
    };
    setFormState({ ...formState, rules: [...formState.rules, newRule] });
  };

  const handleUpdateRule = (ruleIndex: number, updates: Partial<RecommendationRule>) => {
    const next = [...formState.rules];
    next[ruleIndex] = { ...next[ruleIndex], ...updates };
    setFormState({ ...formState, rules: next });
  };

  const handleRemoveRule = (ruleIndex: number) => {
    setFormState({
      ...formState,
      rules: formState.rules.filter((_, i) => i !== ruleIndex),
    });
  };

  // Media Instruction Builder Handlers
  const handleAddInstruction = () => {
    const newIns: MeasurementInstructionItem = {
      field: 'armhole',
      label: 'Armhole & Sleeve Fit',
      tip: 'Measure curvature around the shoulder seam down to underarm.',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    };
    setFormState({
      ...formState,
      instructions: [...formState.instructions, newIns],
    });
  };

  const handleUpdateInstruction = (index: number, updates: Partial<MeasurementInstructionItem>) => {
    const next = [...formState.instructions];
    next[index] = { ...next[index], ...updates };
    setFormState({ ...formState, instructions: next });
  };

  const handleRemoveInstruction = (index: number) => {
    setFormState({
      ...formState,
      instructions: formState.instructions.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) return;

    const payload: Partial<SizeGuide> = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      measurementType: formState.measurementType,
      precedenceLevel: formState.precedenceLevel,
      categoryIds: formState.selectedCategories,
      collectionIds: formState.selectedCollections,
      unitDefault: formState.unitDefault,
      easeAllowanceInches: formState.easeAllowanceInches,
      isActive: formState.isActive,
      isDefault: formState.isDefault,
      customColumns: formState.customColumns,
      measurements: formState.measurements,
      rules: formState.rules,
      howToMeasure: {
        bustTip: formState.bustTip,
        waistTip: formState.waistTip,
        hipTip: formState.hipTip,
        lengthTip: formState.lengthTip,
        shoulderTip: formState.shoulderTip,
        easeNote: formState.easeNote,
        instructions: formState.instructions,
      },
    };

    if (editingId) {
      await updateSizeGuide({ id: editingId, updates: payload });
    } else {
      await createSizeGuide(payload);
    }

    setIsEditing(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this size guide?')) {
      await deleteSizeGuide(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FFF0F3] text-[#7B2435]">
              <Ruler className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Smart Size & Fit Assistant Engine</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Dynamic measurement builders, priority rule conflict resolution, precedence hierarchy & override analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleStartCreate}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0"
          >
            New Size Guide
          </Button>
        </div>
      </div>

      {/* Top Manager Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'guides'
              ? 'bg-[#7B2435] text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Ruler className="w-4 h-4" /> Size Guides ({sizeGuides.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conflicts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'conflicts'
              ? 'bg-[#7B2435] text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Assignment Conflicts & Precedence ({conflictsData?.totalConflicts || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-[#7B2435] text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Size Override Analytics ({overrideAnalytics.length})
        </button>
      </div>

      {/* CONFLICTS TAB */}
      {activeTab === 'conflicts' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Precedence Hierarchy & Assignment Conflict Detector
            </h3>
            <span className="text-xs text-neutral-500">
              Resolved in strict order: <strong>Product &gt; Collection &gt; Category &gt; Default</strong>
            </span>
          </div>

          {conflictsData && conflictsData.conflicts && conflictsData.conflicts.length > 0 ? (
            <div className="space-y-3">
              {conflictsData.conflicts.map((c: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <span>Conflict on {c.entityName}</span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] rounded uppercase">
                        {c.type}
                      </span>
                    </div>
                    <p className="text-amber-900 leading-relaxed">{c.warning}</p>
                    <div className="text-[11px] text-amber-800 font-mono">
                      Overlapping Guides: {c.conflictingGuides.join(' • ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs">
              <Check className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <strong>No Assignment Conflicts Detected!</strong>
              <p className="text-emerald-700 mt-1">
                All catalog products and categories map cleanly to distinct precedence tiers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* OVERRIDE ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#7B2435]" />
              Manual Size Override Tracking Logs
            </h3>
            <span className="text-xs text-neutral-500">
              Captures customer decisions when overriding algorithm recommendations
            </span>
          </div>

          {overrideAnalytics.length > 0 ? (
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-[#FAF6F0] font-bold text-neutral-900 border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Product ID</th>
                    <th className="p-3 text-amber-700">Recommended Size</th>
                    <th className="p-3 text-emerald-700 font-bold">Chosen (Override) Size</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Customer Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {overrideAnalytics.map((log: any) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="p-3 text-neutral-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-neutral-800">{log.productId}</td>
                      <td className="p-3 font-bold text-amber-700">{log.recommendedSize}</td>
                      <td className="p-3 font-bold text-emerald-700">{log.chosenSize}</td>
                      <td className="p-3 font-mono">{log.confidenceScore}%</td>
                      <td className="p-3 italic text-neutral-600">{log.reason || 'No reason specified'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-500 text-xs bg-neutral-50 rounded-2xl border border-neutral-200">
              No manual override records logged yet. Records appear when customers select a different size than recommended.
            </div>
          )}
        </div>
      )}

      {/* SIZE GUIDES LIST & EDITOR */}
      {activeTab === 'guides' && (
        <>
          {/* Editor Modal / Form */}
          {isEditing && (
            <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-[#7B2435]/30 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#FFF0F3] text-[#7B2435] rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    {editingId ? 'Edit Size Guide & Fit Rules' : 'Create Dynamic Size Guide'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Sub-tabs in Editor */}
              <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
                {[
                  { id: 'basics', label: '1. Basic Info & Precedence' },
                  { id: 'columns_rows', label: '2. Dynamic Columns & Sizes' },
                  { id: 'rules', label: '3. Priority & Fit Rules' },
                  { id: 'media', label: '4. Instructions & Media' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEditorTab(t.id as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      editorTab === t.id ? 'bg-[#7B2435] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* SUBTAB 1: BASICS */}
              {editorTab === 'basics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Size Guide Title *"
                      placeholder="e.g. Standard Kurti & Tunic Size Chart"
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      required
                    />

                    <div>
                      <label className="text-xs font-semibold text-neutral-700 block mb-1">
                        Measurement Type * (Body vs Garment)
                      </label>
                      <select
                        value={formState.measurementType}
                        onChange={(e) => setFormState({ ...formState, measurementType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:border-[#7B2435] focus:outline-none"
                      >
                        <option value="garment">Finished Garment Measurements (With Ease Included)</option>
                        <option value="body">Body Measurements (Tape to Skin)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-700 block mb-1">
                        Precedence Level *
                      </label>
                      <select
                        value={formState.precedenceLevel}
                        onChange={(e) => setFormState({ ...formState, precedenceLevel: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:border-[#7B2435] focus:outline-none"
                      >
                        <option value="product">Product Specific (Highest Precedence)</option>
                        <option value="collection">Collection Level</option>
                        <option value="category">Category Level</option>
                        <option value="default">Default Store Fallback (Lowest)</option>
                      </select>
                    </div>

                    <Input
                      label="Ease Allowance (Inches)"
                      type="number"
                      step="0.5"
                      value={formState.easeAllowanceInches}
                      onChange={(e) => setFormState({ ...formState, easeAllowanceInches: Number(e.target.value) })}
                    />

                    <div>
                      <label className="text-xs font-semibold text-neutral-700 block mb-1">
                        Default Unit
                      </label>
                      <select
                        value={formState.unitDefault}
                        onChange={(e) => setFormState({ ...formState, unitDefault: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:border-[#7B2435] focus:outline-none"
                      >
                        <option value="inches">Inches (in)</option>
                        <option value="cm">Centimeters (cm)</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Description / Fit Note"
                    placeholder="e.g. Standard sizing for straight, A-line and short ethnic kurtis."
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  />

                  {/* Category Assignment */}
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-2">
                      Assign to Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const isSelected = formState.selectedCategories.includes(cat.slug) || formState.selectedCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const curr = formState.selectedCategories;
                              setFormState({
                                ...formState,
                                selectedCategories: isSelected ? curr.filter(s => s !== cat.slug && s !== cat.id) : [...curr, cat.slug]
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#7B2435] text-white border-[#7B2435]'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: DYNAMIC COLUMNS & ROWS */}
              {editorTab === 'columns_rows' && (
                <div className="space-y-4">
                  {/* Dynamic Column Builder */}
                  <div className="p-4 bg-[#FAF6F0] rounded-xl border border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                          Dynamic Measurement Columns ({formState.customColumns.length})
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          Add custom dimension points beyond bust, waist, hip (e.g. Armhole, Flare, Thigh)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddCustomColumn}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add Column
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formState.customColumns.map((col) => (
                        <div key={col.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800">
                          <span>{col.name} ({col.key})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomColumn(col.id)}
                            className="text-red-500 hover:text-red-700 ml-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Measurement Rows Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Size Measurement Rows
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMeasurementRow}
                        className="text-xs font-bold text-[#7B2435] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Size Row
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6F0] text-neutral-700 border-b border-neutral-200">
                          <tr>
                            <th className="p-2.5 font-bold">Size</th>
                            {formState.customColumns.map((col) => (
                              <th key={col.id} className="p-2.5 font-bold">
                                {col.name} ({formState.unitDefault === 'inches' ? 'in' : 'cm'})
                              </th>
                            ))}
                            <th className="p-2.5 font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {formState.measurements.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-neutral-50/50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.size}
                                  onChange={(e) => handleMeasurementChange(rIdx, 'size', e.target.value)}
                                  className="w-16 px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-bold text-center text-[#7B2435]"
                                />
                              </td>
                              {formState.customColumns.map((col) => (
                                <td key={col.id} className="p-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={(row as any)[col.key] || ''}
                                    onChange={(e) => handleMeasurementChange(rIdx, col.key, e.target.value)}
                                    className="w-20 px-2 py-1 bg-white border border-neutral-200 rounded text-xs"
                                  />
                                </td>
                              ))}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMeasurementRow(rIdx)}
                                  className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: RECOMMENDATION RULES */}
              {editorTab === 'rules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Recommendation Rules & Priority Resolution
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Rules are evaluated in priority order (1 is highest). First matching rule wins.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddRule}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Rule
                    </Button>
                  </div>

                  {formState.rules.map((rule, ruleIdx) => (
                    <div key={rule.id} className="p-4 bg-[#FAF6F0] rounded-xl border border-neutral-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#7B2435] text-white text-[10px] font-bold rounded">
                            Priority #{rule.priority}
                          </span>
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => handleUpdateRule(ruleIdx, { name: e.target.value })}
                            className="text-xs font-bold text-neutral-900 bg-transparent border-b border-dashed border-neutral-400 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(ruleIdx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-600 block mb-1">Min Bust (in)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={rule.condition?.minBust || ''}
                            onChange={(e) => handleUpdateRule(ruleIdx, { condition: { ...rule.condition, minBust: Number(e.target.value) } })}
                            className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-600 block mb-1">Max Bust (in)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={rule.condition?.maxBust || ''}
                            onChange={(e) => handleUpdateRule(ruleIdx, { condition: { ...rule.condition, maxBust: Number(e.target.value) } })}
                            className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-600 block mb-1">Target Size</label>
                          <input
                            type="text"
                            value={rule.recommendedSize}
                            onChange={(e) => handleUpdateRule(ruleIdx, { recommendedSize: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-bold text-[#7B2435]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-600 block mb-1">Confidence (%)</label>
                          <input
                            type="number"
                            value={rule.confidenceScore}
                            onChange={(e) => handleUpdateRule(ruleIdx, { confidenceScore: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-neutral-200 rounded text-xs"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Explanation note for customer"
                        value={rule.explanation || ''}
                        onChange={(e) => handleUpdateRule(ruleIdx, { explanation: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* SUBTAB 4: INSTRUCTIONS & MEDIA */}
              {editorTab === 'media' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Measurement Media, Photos & Video Links
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Add high-resolution measurement diagrams and video links for bust, waist, hip & length
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddInstruction}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Point
                    </Button>
                  </div>

                  {formState.instructions.map((ins, insIdx) => (
                    <div key={insIdx} className="p-4 bg-[#FAF6F0] rounded-xl border border-neutral-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          Measurement Point #{insIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInstruction(insIdx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Point Label"
                          value={ins.label}
                          onChange={(e) => handleUpdateInstruction(insIdx, { label: e.target.value })}
                        />
                        <Input
                          label="Field Key"
                          value={ins.field}
                          onChange={(e) => handleUpdateInstruction(insIdx, { field: e.target.value })}
                        />
                      </div>

                      <Input
                        label="Measuring Tip / Instructions"
                        value={ins.tip}
                        onChange={(e) => handleUpdateInstruction(insIdx, { tip: e.target.value })}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Image / Diagram URL"
                          placeholder="https://..."
                          value={ins.imageUrl || ''}
                          onChange={(e) => handleUpdateInstruction(insIdx, { imageUrl: e.target.value })}
                        />
                        <Input
                          label="Tutorial Video URL"
                          placeholder="https://..."
                          value={ins.videoUrl || ''}
                          onChange={(e) => handleUpdateInstruction(insIdx, { videoUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {editingId ? 'Save Size Guide' : 'Create Size Guide'}
                </Button>
              </div>
            </form>
          )}

          {/* List of Size Guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sizeGuides.map((guide) => (
              <div
                key={guide.id}
                className={`p-5 bg-white rounded-2xl border transition hover:shadow-md space-y-4 ${
                  guide.isActive ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-[#FFF0F3] text-[#7B2435] text-[10px] font-bold rounded uppercase">
                        {guide.measurementType === 'body' ? 'Body Chart' : 'Garment Chart'}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold rounded uppercase">
                        {guide.precedenceLevel || 'Category'}
                      </span>
                      {guide.isDefault && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-neutral-900 text-base">{guide.title}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">{guide.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(guide)}
                      className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(guide.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sizing pill preview */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-neutral-500">Sizes:</span>
                  {(guide.measurements || []).map((m) => (
                    <span key={m.size} className="px-2 py-0.5 bg-neutral-50 border border-neutral-200 rounded text-xs font-mono font-bold text-neutral-700">
                      {m.size}
                    </span>
                  ))}
                </div>

                {/* Custom Columns & Rules count */}
                <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 pt-3">
                  <span>Columns: <strong>{guide.customColumns?.length || 5}</strong></span>
                  <span>Rules: <strong>{guide.rules?.length || 0}</strong></span>
                  <span>Media: <strong>{guide.howToMeasure?.instructions?.length || 0} items</strong></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
