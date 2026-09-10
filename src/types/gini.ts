export type GiniAdminState = 'off' | 'pilot' | 'on' | 'paused' | 'maintenance';

export type GiniRiskLevel = 
  | 'L0_read' 
  | 'L1_reversible' 
  | 'L2_sensitive' 
  | 'L3_high_impact' 
  | 'L4_payment_secret';

export type GiniActionId =
  | 'navigate_route'      // VC-01
  | 'search_products'     // VC-02
  | 'set_sort'            // VC-03
  | 'open_product'        // VC-04
  | 'select_variant'      // VC-05
  | 'open_size_guide'     // VC-06
  | 'add_cart_item'       // VC-07
  | 'update_cart_item'    // VC-08
  | 'remove_cart_item'    // VC-09
  | 'apply_coupon'        // VC-10
  | 'open_checkout'       // VC-11
  | 'select_saved_address'// VC-12
  | 'select_payment_method'// VC-13
  | 'place_order'         // VC-14
  | 'get_order_status'    // VC-15
  | 'cancel_order'        // VC-16
  | 'start_return'        // VC-17
  | 'assistant_control'   // VC-18
  | 'conversational_response'; // VC-19: Greetings, Chit-chat, General Q&A, Brand info

export interface GiniRouteAlias {
  id: string;
  phrase: string;
  routeId: string;
  targetPath: string;
  label: string;
  priority: number;
}

export interface GiniPhraseDictionaryItem {
  id: string;
  term: string;
  pronunciation: string;
  normalized: string;
  category: 'garment' | 'fabric' | 'color' | 'size' | 'craft' | 'command';
  locale: 'en-IN' | 'hi-IN' | 'all';
}

export interface GiniActionConfig {
  actionId: GiniActionId;
  name: string;
  description: string;
  enabled: boolean;
  riskLevel: GiniRiskLevel;
  requireConfirmation: boolean;
  confirmationTemplate?: string;
  exampleUtterance: string;
  minIdentityRequired: 'guest' | 'customer' | 'admin';
}

export interface GiniSettings {
  // General
  state: GiniAdminState;
  displayName: string;
  greeting: string;
  hindiGreeting: string;
  maintenanceMessage: string;
  allowTextFallback: boolean;
  allowGuestAccess: boolean;
  sessionTimeoutMinutes: number;
  rolloutPercentage: number;
  pilotCustomerEmails: string[];
  
  // Voice & Speech
  sttLocale: 'en-IN' | 'hi-IN' | 'auto';
  sttModel: 'chirp_3' | 'default';
  ttsLocale: 'en-IN' | 'hi-IN';
  ttsVoice: string;
  speakingRate: number;
  volume: number;
  languagePriority: 'en_primary' | 'hi_primary' | 'bilingual';

  // Appearance
  launcherPosition: 'bottom_right' | 'bottom_left';
  launcherOffsetX: number;
  launcherOffsetY: number;
  primaryColor: string;
  accentColor: string;
  drawerWidth: number;
  launcherLabel: string;
  avatarIcon: 'sparkles' | 'mic' | 'lotus' | 'gem';

  // Confirmations & Safeguards
  undoWindowSeconds: number;
  confirmationExpirySeconds: number;
  requireAddressConfirmation: boolean;
  requireOrderConfirmation: boolean;

  // Privacy & Retention
  consentVersion: string;
  consentCopy: string;
  rawAudioRetention: boolean;
  transcriptRetentionDays: number;
  enableRedaction: boolean;

  // Actions & Routing
  routeAliases: GiniRouteAlias[];
  phraseDictionary: GiniPhraseDictionaryItem[];
  actionConfigs: GiniActionConfig[];

  // Published metadata
  version: number;
  publishedAt: string;
  publishedBy: string;
}

export interface GiniConfigVersion {
  id: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  releaseNote?: string;
  diffSummary: string;
  config: GiniSettings;
}

export interface GiniTurn {
  id: string;
  sessionId: string;
  turnIndex: number;
  timestamp: string;
  speaker: 'customer' | 'gini';
  transcript: string;
  redactedTranscript?: string;
  language: 'en-IN' | 'hi-IN' | 'hinglish';
  intent?: string;
  actionProposed?: GiniActionId;
  actionParameters?: Record<string, any>;
  policyResult?: 'allowed' | 'requires_confirmation' | 'denied' | 'needs_clarification';
  suggestedProducts?: any[];
  suggestedChips?: string[];
  executionResult?: {
    success: boolean;
    message: string;
    data?: any;
    errorCategory?: string;
  };
  latencyMs?: {
    stt?: number;
    model?: number;
    executor?: number;
    tts?: number;
    total: number;
  };
}

export interface GiniSession {
  id: string;
  customerId?: string;
  guestId?: string;
  customerName?: string;
  locale: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  startedAt: string;
  endedAt?: string;
  turnCount: number;
  status: 'active' | 'completed' | 'cancelled' | 'timed_out';
  consentGranted: boolean;
  consentGrantedAt?: string;
  turns: GiniTurn[];
}

export interface GiniPendingConfirmation {
  id: string;
  sessionId: string;
  actionId: GiniActionId;
  actionHash: string;
  parameters: Record<string, any>;
  displaySummary: string;
  spokenSummary: string;
  riskLevel: GiniRiskLevel;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  decisionMethod?: 'voice' | 'touch';
}

export interface GiniAnalytics {
  adoption: {
    eligibleViews: number;
    launcherOpens: number;
    consentStarts: number;
    totalSessions: number;
    totalTurns: number;
    uniqueUsers: number;
    mobilePercent: number;
    desktopPercent: number;
  };
  quality: {
    successfulActions: number;
    clarifications: number;
    corrections: number;
    noMatches: number;
    customerCancels: number;
    satisfactionScore: number;
  };
  commerce: {
    searchesTriggered: number;
    productsOpened: number;
    cartAdditions: number;
    cartUpdates: number;
    checkoutsOpened: number;
    ordersConfirmed: number;
    totalAttributedRevenue: number;
  };
  safety: {
    confirmationsRequested: number;
    confirmationsAccepted: number;
    confirmationsRejected: number;
    confirmationsExpired: number;
    policyDenials: number;
    secretsRedactedCount: number;
  };
  performance: {
    avgSttLatencyMs: number;
    avgModelLatencyMs: number;
    avgExecutorLatencyMs: number;
    avgTtsLatencyMs: number;
    avgE2eLatencyMs: number;
    p95E2eLatencyMs: number;
  };
  dailyMetrics: Array<{
    date: string;
    sessions: number;
    turns: number;
    actionsSuccess: number;
    orders: number;
    revenue: number;
    avgLatencyMs: number;
  }>;
  topCommands: Array<{
    command: string;
    count: number;
    successRate: number;
    category: string;
  }>;
  alerts: Array<{
    id: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export interface GiniTestLabFixture {
  id: string;
  name: string;
  utterance: string;
  expectedAction: GiniActionId;
  expectedParams?: Record<string, any>;
  language: 'en-IN' | 'hi-IN' | 'hinglish';
  mockContext: {
    route: string;
    cartItemCount: number;
    isAuthenticated: boolean;
    activeProductId?: string;
  };
}
