import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  Settings,
  Volume2,
  Layers,
  ShieldCheck,
  Palette,
  Eye,
  BarChart3,
  FileText,
  FlaskConical,
  History,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Save,
  Send,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  Info,
  Radio,
  Sliders
} from 'lucide-react';
import {
  GiniSettings,
  GiniConfigVersion,
  GiniAnalytics,
  GiniSession,
  GiniTestLabFixture,
  GiniActionConfig,
  GiniActionId
} from '../../types/gini';
import {
  INITIAL_GINI_SETTINGS,
  INITIAL_GINI_CONFIG_VERSIONS,
  INITIAL_GINI_ANALYTICS,
  INITIAL_GINI_TEST_FIXTURES
} from '../../data/giniDefaults';
import { API_BASE_URL } from '../../config/apiConfig';

function adminGiniFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('vedaaya_admin_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

export type GiniAdminTab =
  | 'overview'
  | 'general'
  | 'voice'
  | 'commands'
  | 'confirmations'
  | 'appearance'
  | 'privacy'
  | 'analytics'
  | 'sessions'
  | 'testlab'
  | 'releases';

export const GiniAdminPlugin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GiniAdminTab>('overview');
  const [settings, setSettings] = useState<GiniSettings>(INITIAL_GINI_SETTINGS);
  const [versions, setVersions] = useState<GiniConfigVersion[]>(INITIAL_GINI_CONFIG_VERSIONS);
  const [analytics, setAnalytics] = useState<GiniAnalytics>(INITIAL_GINI_ANALYTICS);
  const [sessions, setSessions] = useState<GiniSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Test Lab states
  const [testUtterance, setTestUtterance] = useState('Show red cotton kurtis under 2000 rupees');
  const [testContext, setTestContext] = useState({
    currentRoute: '/catalog',
    cartItemCount: 1,
    cartGrandTotal: 1599,
    isAuthenticated: true
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [regressionRuns, setRegressionRuns] = useState<{ id: string; passed: boolean; score: number }[]>([]);

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [releaseNote, setReleaseNote] = useState('');

  // Phrase dictionary temp state
  const [newPhraseOriginal, setNewPhraseOriginal] = useState('');
  const [newPhraseTarget, setNewPhraseTarget] = useState('');

  // 1. Load Admin Data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [setRes, anaRes, sessRes] = await Promise.all([
        adminGiniFetch('/admin/gini/settings'),
        adminGiniFetch('/admin/gini/analytics'),
        adminGiniFetch('/admin/gini/sessions')
      ]);

      if (setRes.ok) {
        const data = await setRes.json();
        setSettings(data.settings);
        setVersions(data.versions);
      }
      if (anaRes.ok) {
        const data = await anaRes.json();
        setAnalytics(data);
      }
      if (sessRes.ok) {
        const data = await sessRes.json();
        setSessions(data);
      }
    } catch (e) {
      console.warn('Failed to load Gini admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 2. Save Draft Settings
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await adminGiniFetch('/admin/gini/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('Draft configuration saved successfully.');
      }
    } catch (e) {
      showToast('Error saving draft settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Publish Version
  const handlePublish = async () => {
    try {
      const res = await adminGiniFetch('/admin/gini/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseNote: releaseNote || `Version ${settings.version + 1} published`,
          actor: 'Kushagra Avyukta (Super Admin)'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShowPublishModal(false);
        setReleaseNote('');
        showToast(`Version ${data.version} published to storefront.`);
        loadAdminData();
      }
    } catch (e) {
      showToast('Publishing failed.');
    }
  };

  // 4. Rollback
  const handleRollback = async (verNum: number) => {
    if (!window.confirm(`Are you sure you want to rollback storefront to Version ${verNum}?`)) return;
    try {
      const res = await adminGiniFetch('/admin/gini/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion: verNum })
      });
      if (res.ok) {
        showToast(`Rolled back to Version ${verNum}.`);
        loadAdminData();
      }
    } catch (e) {
      showToast('Rollback failed.');
    }
  };

  // 5. Emergency Toggle
  const handleEmergencyToggle = async () => {
    const nextState = settings.state === 'paused' ? 'on' : 'paused';
    try {
      const res = await adminGiniFetch('/admin/gini/emergency-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause: nextState === 'paused' })
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, state: nextState }));
        showToast(`Assistant state changed to: ${nextState.toUpperCase()}`);
      }
    } catch (e) {
      showToast('Failed to toggle emergency state.');
    }
  };

  // 6. Dry Run in Test Lab
  const handleDryRun = async () => {
    setIsDryRunning(true);
    try {
      const res = await adminGiniFetch('/admin/gini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utterance: testUtterance,
          mockContext: testContext
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data.dryRunResult);
      }
    } catch (e) {
      showToast('Dry run failed.');
    } finally {
      setIsDryRunning(false);
    }
  };

  // 7. Run Full Regression Test Suite
  const handleRunRegression = async () => {
    setIsDryRunning(true);
    const results = [];
    for (const fixture of INITIAL_GINI_TEST_FIXTURES) {
      try {
        const res = await adminGiniFetch('/admin/gini/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utterance: fixture.utterance,
            mockContext: fixture.mockContext
          })
        });
        const data = await res.json();
        const passed = data?.dryRunResult?.proposedAction === fixture.expectedAction;
        results.push({ id: fixture.id, passed, score: passed ? 1.0 : 0.4 });
      } catch (e) {
        results.push({ id: fixture.id, passed: false, score: 0 });
      }
    }
    setRegressionRuns(results);
    setIsDryRunning(false);
    showToast(`Executed ${results.length} regression test fixtures.`);
  };

  // Tabs Configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'general', label: 'General', icon: Settings },
    { id: 'voice', label: 'Voice & Language', icon: Volume2 },
    { id: 'commands', label: 'Commands & Routes', icon: Layers },
    { id: 'confirmations', label: 'Confirmations', icon: ShieldCheck },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Retention', icon: Eye },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'sessions', label: 'Session Logs', icon: FileText },
    { id: 'testlab', label: 'Test Lab', icon: FlaskConical },
    { id: 'releases', label: 'Releases & Versions', icon: History },
  ];

  return (
    <div id="gini-admin-root" className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#7B2435] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-[#D4AF37]/50 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#7B2435] via-[#5C1926] to-[#4A121E] rounded-3xl p-6 text-white shadow-xl border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-inner">
            <Mic className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black font-serif text-[#FAF6F0] tracking-wide">
                Gini Voice Commerce Assistant
              </h2>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                settings.state === 'on' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {settings.state === 'on' ? 'LIVE (STOREFRONT ACTIVE)' : settings.state.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-amber-100/75 mt-1">
              Google Chirp 3 Speech Engine, Gemini Function Calling, & Multilingual Commerce Actions
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleEmergencyToggle}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
              settings.state === 'paused'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-700 hover:bg-rose-800 text-white'
            }`}
          >
            {settings.state === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{settings.state === 'paused' ? 'Resume Gini' : 'Emergency Pause'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            id="gini-admin-publish-btn"
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c29e2f] text-neutral-900 text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-neutral-900" />
            <span>Publish v{settings.version + 1}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-[#EADBDA] p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`gini-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as GiniAdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#7B2435] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Provider Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                <span>STT Provider</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h4 className="text-sm font-black text-neutral-900">Google Chirp 3</h4>
              <p className="text-[11px] text-emerald-700 font-medium">99.98% Available • 320ms avg</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                <span>TTS Provider</span>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h4 className="text-sm font-black text-neutral-900">Google Chirp 3 HD</h4>
              <p className="text-[11px] text-emerald-700 font-medium">Native Indian Accents • 24kHz</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                <span>Orchestrator</span>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h4 className="text-sm font-black text-neutral-900">Gemini 2.5 Flash</h4>
              <p className="text-[11px] text-emerald-700 font-medium">18 Typed Commerce Tools</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                <span>Voice Gateway</span>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h4 className="text-sm font-black text-neutral-900">Server Policy Gate</h4>
              <p className="text-[11px] text-emerald-700 font-medium">L0-L4 Safe Execution</p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs">
              <span className="text-xs font-bold text-neutral-500 block">Voice Sessions</span>
              <div className="text-2xl font-black text-neutral-900 mt-1 font-serif">
                {analytics.adoption.totalSessions.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                +{analytics.commerce.cartAdditions} Cart Additions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs">
              <span className="text-xs font-bold text-neutral-500 block">Attributed Revenue</span>
              <div className="text-2xl font-black text-[#7B2435] mt-1 font-serif">
                ₹{analytics.commerce.totalAttributedRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-neutral-600 font-medium block mt-1">
                {analytics.commerce.ordersConfirmed} Voice Orders Placed
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs">
              <span className="text-xs font-bold text-neutral-500 block">Action Success Rate</span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-serif">
                {Math.round((analytics.quality.successfulActions / (analytics.adoption.totalTurns || 1)) * 100)}%
              </div>
              <span className="text-[11px] text-neutral-600 font-medium block mt-1">
                {analytics.quality.successfulActions} verified executions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EADBDA] shadow-xs">
              <span className="text-xs font-bold text-neutral-500 block">P95 Turn Latency</span>
              <div className="text-2xl font-black text-neutral-900 mt-1 font-serif">
                {analytics.performance.p95E2eLatencyMs}ms
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                Well under 1500ms target
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: General */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 font-serif border-b border-neutral-100 pb-3">
            General Assistant Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Display Name</label>
              <input
                type="text"
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Launcher Button Label</label>
              <input
                type="text"
                value={settings.launcherLabel}
                onChange={(e) => setSettings({ ...settings, launcherLabel: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-neutral-700">English Welcome Greeting</label>
              <textarea
                rows={2}
                value={settings.greeting}
                onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-neutral-700">Hindi Welcome Greeting</label>
              <textarea
                rows={2}
                value={settings.hindiGreeting}
                onChange={(e) => setSettings({ ...settings, hindiGreeting: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Rollout Percentage</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.rolloutPercentage}
                  onChange={(e) => setSettings({ ...settings, rolloutPercentage: Number(e.target.value) })}
                  className="flex-1 accent-[#7B2435]"
                />
                <span className="text-xs font-black text-[#7B2435] w-12">{settings.rolloutPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Voice & Language */}
      {activeTab === 'voice' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 font-serif border-b border-neutral-100 pb-3">
            Voice Synthesis & Phrase Dictionary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">STT Locale</label>
              <select
                value={settings.sttLocale}
                onChange={(e) => setSettings({ ...settings, sttLocale: e.target.value as 'en-IN' | 'hi-IN' | 'auto' })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs font-medium"
              >
                <option value="en-IN">English (India) - en-IN</option>
                <option value="hi-IN">Hindi (India) - hi-IN</option>
                <option value="auto">Auto-Detect / Bilingual</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">TTS Voice (Chirp 3 HD)</label>
              <select
                value={settings.ttsVoice}
                onChange={(e) => setSettings({ ...settings, ttsVoice: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs font-medium"
              >
                <option value="chirp3-hd-in-female-1">Chirp 3 HD Female (Natural / Warm)</option>
                <option value="chirp3-hd-in-female-2">Chirp 3 HD Female (Clear / Professional)</option>
                <option value="chirp3-hd-in-male-1">Chirp 3 HD Male (Polite / Crisp)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Speaking Rate: {settings.speakingRate}x</label>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={settings.speakingRate}
                onChange={(e) => setSettings({ ...settings, speakingRate: parseFloat(e.target.value) })}
                className="w-full accent-[#7B2435]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Volume: {Math.round(settings.volume * 100)}%</label>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={settings.volume}
                onChange={(e) => setSettings({ ...settings, volume: parseFloat(e.target.value) })}
                className="w-full accent-[#7B2435]"
              />
            </div>
          </div>

          {/* Phrase Dictionary Table */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Domain Phrase Dictionary & Phonetic Aliases
            </h4>
            <div className="border border-[#EADBDA] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] text-neutral-600 font-bold border-b border-[#EADBDA]">
                  <tr>
                    <th className="p-3">Spoken Term / Pronunciation</th>
                    <th className="p-3">Normalized Entity</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBDA]">
                  {settings.phraseDictionary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-3 font-medium text-neutral-900">{item.term} ({item.pronunciation || item.term})</td>
                      <td className="p-3 text-neutral-700">{item.normalized}</td>
                      <td className="p-3 text-neutral-500 uppercase text-[10px] font-bold">{item.category}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = settings.phraseDictionary.filter((_, i) => i !== idx);
                            setSettings({ ...settings, phraseDictionary: updated });
                          }}
                          className="text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Phrase Form */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Spoken (e.g. cord set, kurti)"
                value={newPhraseOriginal}
                onChange={(e) => setNewPhraseOriginal(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
              <input
                type="text"
                placeholder="Normalized (e.g. Co-ord Set)"
                value={newPhraseTarget}
                onChange={(e) => setNewPhraseTarget(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPhraseOriginal && newPhraseTarget) {
                    setSettings({
                      ...settings,
                      phraseDictionary: [
                        ...settings.phraseDictionary,
                        {
                          id: `phrase-${Date.now()}`,
                          term: newPhraseOriginal,
                          pronunciation: newPhraseOriginal,
                          normalized: newPhraseTarget,
                          category: 'garment',
                          locale: 'all'
                        }
                      ]
                    });
                    setNewPhraseOriginal('');
                    setNewPhraseTarget('');
                  }
                }}
                className="px-4 py-2 bg-[#7B2435] text-white rounded-xl text-xs font-bold hover:bg-[#5C1926] cursor-pointer"
              >
                Add Alias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Commands & Routes */}
      {activeTab === 'commands' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-serif">
                Action Registry & Allowlist (VC-01 to VC-18)
              </h3>
              <p className="text-xs text-neutral-500">
                Only explicitly enabled actions can be executed by Gini Voice Orchestrator.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.actionConfigs.map((act) => (
              <div
                key={act.actionId}
                className="p-4 rounded-2xl border border-[#EADBDA] bg-[#FAF6F0] flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-neutral-900">{act.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      act.riskLevel === 'L3_high_impact' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {act.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-mono">ID: {act.actionId}</p>
                  <p className="text-xs text-neutral-700 italic">Example: &quot;{act.exampleUtterance}&quot;</p>
                </div>

                <input
                  type="checkbox"
                  checked={act.enabled}
                  onChange={(e) => {
                    const updated = settings.actionConfigs.map(a =>
                      a.actionId === act.actionId ? { ...a, enabled: e.target.checked } : a
                    );
                    setSettings({ ...settings, actionConfigs: updated });
                  }}
                  className="w-5 h-5 accent-[#7B2435] mt-1 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Confirmations */}
      {activeTab === 'confirmations' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 font-serif border-b border-neutral-100 pb-3">
            High-Impact Action & Undo Policies
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Confirmation Expiry Timeout (Seconds)</label>
              <input
                type="number"
                value={settings.confirmationExpirySeconds}
                onChange={(e) => setSettings({ ...settings, confirmationExpirySeconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
              <p className="text-[11px] text-neutral-500">
                After this timeout, unconfirmed high-impact actions (order placement, returns) automatically expire.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Reversible Action Undo Window (Seconds)</label>
              <input
                type="number"
                value={settings.undoWindowSeconds}
                onChange={(e) => setSettings({ ...settings, undoWindowSeconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
              <p className="text-[11px] text-neutral-500">
                Duration of the live floating &quot;Undo&quot; banner after adding an item to the shopping bag.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Test Lab */}
      {activeTab === 'testlab' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-serif">
                Gini Voice Test Lab & Dry-Run Sandbox
              </h3>
              <p className="text-xs text-neutral-500">
                Dry-run voice transcripts and run automated regression suites against the current draft policy.
              </p>
            </div>
            <button
              type="button"
              id="gini-run-regression-btn"
              onClick={handleRunRegression}
              disabled={isDryRunning}
              className="px-4 py-2 bg-[#7B2435] text-white rounded-xl text-xs font-bold hover:bg-[#5C1926] transition flex items-center gap-2 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Run Regression Suite ({INITIAL_GINI_TEST_FIXTURES.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Test Utterance</label>
                <input
                  type="text"
                  value={testUtterance}
                  onChange={(e) => setTestUtterance(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Mock Context (JSON)</label>
                <textarea
                  rows={4}
                  value={JSON.stringify(testContext, null, 2)}
                  onChange={(e) => {
                    try {
                      setTestContext(JSON.parse(e.target.value));
                    } catch (err) {}
                  }}
                  className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs font-mono"
                />
              </div>

              <button
                type="button"
                id="gini-dry-run-btn"
                onClick={handleDryRun}
                disabled={isDryRunning}
                className="w-full py-2.5 bg-[#D4AF37] text-neutral-900 rounded-xl text-xs font-black hover:bg-[#c29e2f] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-neutral-900" />
                <span>Execute Dry-Run</span>
              </button>
            </div>

            {/* Dry Run Output */}
            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA] space-y-3">
              <h4 className="text-xs font-bold text-neutral-800">Dry-Run Inspection Results</h4>
              {testResult ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200">
                    <span className="font-bold text-neutral-500 block">Proposed Action:</span>
                    <span className="font-mono text-[#7B2435] font-bold">
                      {testResult.proposedAction || 'None'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200">
                    <span className="font-bold text-neutral-500 block">Policy Decision:</span>
                    <span className="font-bold text-emerald-700">{testResult.policyResult}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200">
                    <span className="font-bold text-neutral-500 block">Synthesized Response:</span>
                    <p className="text-neutral-800 mt-1">{testResult.speechResponse}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 font-mono text-[11px]">
                    <span className="font-bold text-neutral-500 block">Latency Breakdown:</span>
                    <p>Total: {testResult.latencyMs?.total}ms | STT: {testResult.latencyMs?.stt}ms | Model: {testResult.latencyMs?.model}ms</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">Click &quot;Execute Dry-Run&quot; to inspect action resolution.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Releases & Versions */}
      {activeTab === 'releases' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 font-serif border-b border-neutral-100 pb-3">
            Immutable Release Version History & Rollbacks
          </h3>

          <div className="border border-[#EADBDA] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-neutral-600 font-bold border-b border-[#EADBDA]">
                <tr>
                  <th className="p-3">Version</th>
                  <th className="p-3">Published At</th>
                  <th className="p-3">Published By</th>
                  <th className="p-3">Release Note</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBDA]">
                {versions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-[#7B2435]">v{ver.version}</td>
                    <td className="p-3 text-neutral-600">{new Date(ver.publishedAt).toLocaleString()}</td>
                    <td className="p-3 text-neutral-800 font-medium">{ver.publishedBy}</td>
                    <td className="p-3 text-neutral-700">{ver.releaseNote}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleRollback(ver.version)}
                        className="px-3 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700 hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Session Logs */}
      {activeTab === 'sessions' && (
        <div className="bg-white p-6 rounded-3xl border border-[#EADBDA] shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 font-serif border-b border-neutral-100 pb-3">
            Customer Voice Session Audit Logs (RBAC Redacted)
          </h3>

          <div className="border border-[#EADBDA] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-neutral-600 font-bold border-b border-[#EADBDA]">
                <tr>
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Locale</th>
                  <th className="p-3">Turns</th>
                  <th className="p-3">Started At</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBDA]">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-mono text-[11px] text-neutral-600">{sess.id}</td>
                    <td className="p-3 font-bold text-neutral-800">{sess.customerName}</td>
                    <td className="p-3 text-neutral-600">{sess.locale}</td>
                    <td className="p-3 font-bold text-[#7B2435]">{sess.turnCount}</td>
                    <td className="p-3 text-neutral-500">{new Date(sess.startedAt).toLocaleTimeString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {sess.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Publish Version Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900 font-serif">
                  Publish Version {settings.version + 1}
                </h4>
                <p className="text-xs text-neutral-500">
                  This will generate an immutable snapshot and deploy immediately to storefront users.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Release Notes / Changelog</label>
              <textarea
                rows={3}
                placeholder="e.g. Updated speech rate, added 5 ethnic fabric aliases..."
                value={releaseNote}
                onChange={(e) => setReleaseNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="gini-confirm-publish-btn"
                onClick={handlePublish}
                className="flex-1 py-2.5 rounded-xl bg-[#7B2435] text-white text-xs font-bold hover:bg-[#5C1926] shadow-md cursor-pointer"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
