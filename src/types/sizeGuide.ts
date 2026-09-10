export type MeasurementType = 'garment' | 'body';

export interface DynamicMeasurementColumn {
  id: string;
  name: string;
  key: string;
  unit: 'inches' | 'cm';
  description?: string;
  isRequired?: boolean;
}

export type SizeMeasurementColumn = DynamicMeasurementColumn;

export interface SizeMeasurementRow {
  size: string;
  bust?: number;
  waist?: number;
  hip?: number;
  length?: number;
  shoulder?: number;
  acrossBack?: number;
  inseam?: number;
  sleeveLength?: number;
  armhole?: number;
  flare?: number;
  [key: string]: string | number | undefined;
}

export interface HowToMeasureInstruction {
  field: string;
  label: string;
  tip: string;
  imageUrl?: string;
  videoUrl?: string;
  diagramSvg?: string;
}

export type MeasurementInstructionItem = HowToMeasureInstruction;

export interface SizeGuideHowToMeasure {
  bustTip?: string;
  waistTip?: string;
  hipTip?: string;
  lengthTip?: string;
  shoulderTip?: string;
  easeNote?: string;
  instructions?: HowToMeasureInstruction[];
}

export interface RecommendationRule {
  id: string;
  name: string;
  priority: number; // 1 (highest) to 100
  condition: {
    minBust?: number;
    maxBust?: number;
    minWaist?: number;
    maxWaist?: number;
    minHip?: number;
    maxHip?: number;
    bodyShape?: 'Hourglass' | 'Pear' | 'Rectangle' | 'Apple' | 'Petite' | 'Any';
    fitPreference?: 'snug' | 'regular' | 'relaxed';
    fabricStretch?: 'non_stretch' | 'low_stretch' | 'medium_stretch';
  };
  recommendedSize: string;
  easeAdjustmentInches: number; // e.g. +1.5, +2.0, +3.5
  confidenceScore: number; // 0 to 100
  explanation: string;
  betweenSizesRecommendation?: 'size_up' | 'size_down' | 'custom_tailor';
  isActive: boolean;
}

export interface SizeGuideVersion {
  version: number;
  sizeGuideId: string;
  timestamp: string;
  createdBy: string;
  changeSummary: string;
  snapshot: Omit<SizeGuide, 'versions'>;
}

export interface SizeGuide {
  id: string;
  title: string;
  measurementType: MeasurementType; // 'body' vs 'garment'
  precedenceLevel: 'product' | 'collection' | 'category' | 'default'; // Priority hierarchy
  categoryIds?: string[];
  categoryNames?: string[];
  collectionIds?: string[];
  productIds?: string[];
  description?: string;
  unitDefault: 'inches' | 'cm';
  customColumns?: DynamicMeasurementColumn[];
  measurements: SizeMeasurementRow[];
  howToMeasure: SizeGuideHowToMeasure;
  rules?: RecommendationRule[];
  easeAllowanceInches?: number;
  isDefault?: boolean;
  isActive: boolean;
  version?: number;
  versions?: SizeGuideVersion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OutOfStockFitTradeOff {
  isRecommendedOutOfStock: boolean;
  recommendedSize: string;
  alternativeSizes: {
    size: string;
    stock: number;
    fitType: 'snug' | 'relaxed' | 'custom';
    chestEaseDiff: number; // e.g. -2.0 or +2.0 inches
    tradeOffExplanation: string;
    isSuggested: boolean;
  }[];
  notifyMeAvailable: boolean;
}

export interface FitRecommendationRequest {
  productId: string;
  productName?: string;
  garmentType?: string;
  fabricStretch?: 'non_stretch' | 'low_stretch' | 'medium_stretch';
  bodyBust?: number;
  bodyWaist?: number;
  bodyHip?: number;
  bodyShoulder?: number;
  bodyHeight?: number;
  preferredFit?: 'snug' | 'regular' | 'relaxed';
  unit: 'inches' | 'cm';
  userId?: string;
  isGuestSession?: boolean;
}

export interface FitRecommendationResponse {
  recommendedSize: string | null;
  confidenceScore: number; // 0 to 100
  confidenceLevel: 'High' | 'Medium' | 'Low' | 'Insufficient Information';
  explanation: string;
  matchedRuleId?: string;
  matchedRuleName?: string;
  guideUsed: {
    id: string;
    title: string;
    type: MeasurementType;
    precedenceLevel: string;
  };
  betweenSizesWarning?: {
    isBetween: boolean;
    lowerSize: string;
    upperSize: string;
    advice: string;
  };
  outOfStockTradeOff?: OutOfStockFitTradeOff;
  measurementBreakdown: {
    bustDiff?: number;
    waistDiff?: number;
    hipDiff?: number;
    easeApplied: number;
  };
  conflictWarnings?: string[];
  isConfident: boolean;
  safeCustomerMessage?: string;
}

export interface CustomerFitProfile {
  userId: string;
  name?: string;
  email?: string;
  hasConsented: boolean;
  consentGrantedAt?: string;
  retentionDays: number; // e.g. 30, 90, 365, or -1 (forever)
  bust?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  preferredFit: 'snug' | 'regular' | 'relaxed';
  preferredUnit: 'inches' | 'cm';
  createdAt: string;
  updatedAt: string;
}

export interface GuestFitSession {
  sessionId: string;
  bust?: number;
  waist?: number;
  hip?: number;
  preferredFit: 'snug' | 'regular' | 'relaxed';
  unit: 'inches' | 'cm';
  createdAt: string;
  expiresAt: string;
}

export interface SizeWidgetAppearanceSettings {
  buttonText: string;
  buttonColorStyle: 'primary_crimson' | 'royal_gold' | 'neutral_dark' | 'outline';
  placement: 'above_size_selector' | 'below_size_selector' | 'sticky_side_tab';
  layoutMode: 'modal' | 'side_drawer';
  mobileBehavior: 'bottom_sheet' | 'fullscreen_modal';
  defaultUnit: 'inches' | 'cm';
  showConfidenceScores: boolean;
  showOutOfStockTradeOffs: boolean;
  enableGuestStorage: boolean;
  requireExplicitConsent: boolean;
}

export interface SizeOverrideAnalytics {
  id: string;
  productId: string;
  productName?: string;
  recommendedSize: string;
  chosenSize: string;
  confidenceScore: number;
  fitPreference: string;
  reason?: string;
  userId?: string;
  isGuest?: boolean;
  timestamp: string;
}

export interface BetweenSizeBoundaryTestCase {
  id: string;
  name: string;
  garmentCategory: string;
  fabricStretch: 'non_stretch' | 'low_stretch' | 'medium_stretch';
  preferredFit: 'snug' | 'regular' | 'relaxed';
  inputMeasurements: {
    bust: number;
    waist?: number;
    hip?: number;
    unit: 'inches' | 'cm';
  };
  expectedRecommendedSize: string;
  expectedConfidenceLevel: 'High' | 'Medium' | 'Low' | 'Insufficient Information';
  expectedBetweenSizeFlag: boolean;
  description: string;
}

export interface BoundaryTestExecutionResult {
  testId: string;
  testName: string;
  passed: boolean;
  actualSize: string | null;
  expectedSize: string;
  actualConfidence: number;
  actualConfidenceLevel: string;
  isBetweenDetected: boolean;
  notes: string;
  executionTimeMs: number;
}

export interface SizeFitAuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'create_guide' | 'update_guide' | 'publish_guide' | 'rollback_guide' | 'delete_guide' | 'update_widget_settings' | 'export_customer_data' | 'delete_customer_profile';
  entityId: string;
  entityName: string;
  previousValue?: any;
  newValue?: any;
  diffSummary: string;
}

export interface GranularSizeFitPermission {
  key: 'size_fit_create' | 'size_fit_edit' | 'size_fit_publish' | 'size_fit_rollback' | 'size_fit_import_export' | 'size_fit_analytics' | 'size_fit_customer_data';
  label: string;
  description: string;
  rolesAllowed: string[];
}
