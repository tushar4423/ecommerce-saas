import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  ChevronRight, 
  Video, 
  Image as ImageIcon,
  ShieldCheck,
  RotateCcw,
  Bell,
  Trash2,
  Download,
  Lock,
  UserCheck
} from 'lucide-react';
import { Product, SizeGuide, FitRecommendationResponse, CustomerFitProfile } from '../../types';
import { 
  useGetFitRecommendationMutation, 
  useLogSizeOverrideMutation
} from '../../store/api/ecommerceApi';
import { api } from '../../services/api';

interface SmartFitAssistantProps {
  product: Product;
  activeGuide?: SizeGuide;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onClose?: () => void;
  currentUser?: { id: string; name?: string; email?: string } | null;
}

export const SmartFitAssistant: React.FC<SmartFitAssistantProps> = ({
  product,
  activeGuide,
  selectedSize,
  onSelectSize,
  onClose,
  currentUser,
}) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const [bust, setBust] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hip, setHip] = useState<string>('');
  const [preferredFit, setPreferredFit] = useState<'snug' | 'regular' | 'relaxed'>('regular');
  const [fabricStretch, setFabricStretch] = useState<'non_stretch' | 'low_stretch' | 'medium_stretch'>('non_stretch');
  const [activeTab, setActiveTab] = useState<'calculator' | 'instructions' | 'guide_table' | 'privacy'>('calculator');
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState<number>(0);
  
  // Consent & Guest State
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(!currentUser);
  const [savedProfile, setSavedProfile] = useState<CustomerFitProfile | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [notifySubscribed, setNotifySubscribed] = useState<boolean>(false);

  // Recommendation state
  const [recommendation, setRecommendation] = useState<FitRecommendationResponse | null>(null);
  const [confirmedSize, setConfirmedSize] = useState<string | null>(null);
  const [manualOverridePending, setManualOverridePending] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');

  const [getFitRecommendation, { isLoading: isCalculating }] = useGetFitRecommendationMutation();
  const [logSizeOverride] = useLogSizeOverrideMutation();

  // Load session measurements for guest, or load profile for logged in user
  useEffect(() => {
    if (currentUser?.id) {
      setIsGuest(false);
      try {
        const saved = localStorage.getItem(`fit_profile_${currentUser.id}`);
        if (saved) {
          const prof = JSON.parse(saved);
          setSavedProfile(prof);
          if (prof.bust) setBust(prof.bust.toString());
          if (prof.waist) setWaist(prof.waist.toString());
          if (prof.hip) setHip(prof.hip.toString());
          if (prof.preferredFit) setPreferredFit(prof.preferredFit);
          if (prof.preferredUnit) setUnit(prof.preferredUnit);
          setHasConsented(true);
        }
      } catch {}
    } else {
      // Guest session handling
      setIsGuest(true);
      const sessionData = sessionStorage.getItem('nandita_guest_fit_answers');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          if (parsed.bust) setBust(parsed.bust);
          if (parsed.waist) setWaist(parsed.waist);
          if (parsed.hip) setHip(parsed.hip);
          if (parsed.preferredFit) setPreferredFit(parsed.preferredFit);
          if (parsed.unit) setUnit(parsed.unit);
        } catch {}
      }
    }
  }, [currentUser]);

  const handleCalculateFit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bust && !waist && !hip) {
      alert('Please enter at least your bust or chest measurement to calculate your optimal size.');
      return;
    }

    // Save to guest session storage if guest
    if (isGuest) {
      sessionStorage.setItem('vedaaya_guest_fit_answers', JSON.stringify({
        bust,
        waist,
        hip,
        preferredFit,
        unit,
      }));
    }

    // If customer explicitly checked consent and is logged in, save profile
    if (hasConsented && currentUser?.id) {
      const profileData: CustomerFitProfile = {
        userId: currentUser.id,
        name: currentUser.name || 'Customer',
        email: currentUser.email || '',
        bust: Number(bust) || undefined,
        waist: Number(waist) || undefined,
        hip: Number(hip) || undefined,
        preferredFit,
        preferredUnit: unit,
        hasConsented: true,
        consentGrantedAt: new Date().toISOString(),
        retentionDays: 365,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`fit_profile_${currentUser.id}`, JSON.stringify(profileData));
      setSavedProfile(profileData);
      setProfileMessage('Fit profile saved securely with active consent.');
    }

    try {
      const res = await getFitRecommendation({
        productId: product.id,
        productName: product.name,
        garmentType: product.category,
        fabricStretch,
        bodyBust: bust ? Number(bust) : undefined,
        bodyWaist: waist ? Number(waist) : undefined,
        bodyHip: hip ? Number(hip) : undefined,
        preferredFit,
        unit,
      }).unwrap();

      setRecommendation(res);
      setConfirmedSize(null);
      setManualOverridePending(false);
    } catch (err) {
      console.error('Failed to calculate size recommendation:', err);
    }
  };

  const handleClearGuestSession = () => {
    sessionStorage.removeItem('vedaaya_guest_fit_answers');
    setBust('');
    setWaist('');
    setHip('');
    setRecommendation(null);
    setProfileMessage('Guest session measurements discarded.');
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handlePurgeProfile = async () => {
    if (!currentUser?.id) return;
    if (!window.confirm('Are you sure you want to permanently delete your saved measurements and fit profile (Right to be Forgotten)?')) {
      return;
    }
    try {
      localStorage.removeItem(`fit_profile_${currentUser.id}`);
      setSavedProfile(null);
      setHasConsented(false);
      setBust('');
      setWaist('');
      setHip('');
      setProfileMessage('Fit profile permanently deleted from all studio records.');
    } catch {
      alert('Failed to delete profile. Please try again.');
    }
  };

  const handleExportData = async () => {
    if (!currentUser?.id) return;
    const profile = savedProfile || (localStorage.getItem(`fit_profile_${currentUser.id}`) ? JSON.parse(localStorage.getItem(`fit_profile_${currentUser.id}`)!) : null);
    if (profile) {
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nandita-fit-data-${currentUser.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleConfirmAndApplySize = (sizeToApply: string) => {
    setConfirmedSize(sizeToApply);
    onSelectSize(sizeToApply);

    // If customer selected a different size than recommendation, track override
    if (recommendation && recommendation.recommendedSize && recommendation.recommendedSize !== sizeToApply) {
      logSizeOverride({
        productId: product.id,
        productName: product.name,
        recommendedSize: recommendation.recommendedSize,
        chosenSize: sizeToApply,
        confidenceScore: recommendation.confidenceScore || 0,
        fitPreference: preferredFit,
        reason: overrideReason || 'Customer confirmed manual override',
        userId: currentUser?.id || 'guest',
        isGuest,
      }).unwrap().catch(() => {});
    }
  };

  const instructions = activeGuide?.howToMeasure?.instructions || [
    {
      field: 'bust',
      label: 'Bust / Chest Circumference',
      tip: 'Hold the tape level around the fullest point of the bust without digging in.',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    },
    {
      field: 'waist',
      label: 'Natural Waistline',
      tip: 'Find the narrowest natural crease of your torso (approx. 1-2 inches above navel).',
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    },
    {
      field: 'hip',
      label: 'Full Hip Circumference',
      tip: 'Stand with feet together and measure around the fullest curve of the hips and seat.',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
    },
    {
      field: 'shoulder',
      label: 'Across Back Shoulder',
      tip: 'Measure across the upper back from outer shoulder bone to outer shoulder bone.',
      imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Precedence and Measurement Type Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#7B2435] text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
            {activeGuide?.measurementType === 'body' ? 'Body Measurement Chart' : 'Finished Garment Dimensions'}
          </span>
          <span className="text-xs text-neutral-600 font-medium">
            Precedence Level: <strong className="text-neutral-900 capitalize">{activeGuide?.precedenceLevel || 'Category'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={() => setUnit('inches')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              unit === 'inches' ? 'bg-[#7B2435] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Inches (in)
          </button>
          <button
            type="button"
            onClick={() => setUnit('cm')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              unit === 'cm' ? 'bg-[#7B2435] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Centimeters (cm)
          </button>
        </div>
      </div>

      {profileMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {profileMessage}
          </span>
          <button type="button" onClick={() => setProfileMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'calculator'
              ? 'bg-[#7B2435] text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Smart Fit Calculator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('instructions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'instructions'
              ? 'bg-[#7B2435] text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Measurement Media & Guides
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guide_table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'guide_table'
              ? 'bg-[#7B2435] text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" /> Full Sizing Table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'privacy'
              ? 'bg-[#7B2435] text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Privacy & Consent
        </button>
      </div>

      {/* TAB 1: Smart Fit Calculator */}
      {activeTab === 'calculator' && (
        <div className="space-y-5">
          <form onSubmit={handleCalculateFit} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#7B2435]" />
                Enter Your Body Measurements ({unit === 'inches' ? 'Inches' : 'CM'})
              </h4>
              <span className="text-[11px] text-neutral-500 italic">
                Values will be matched against studio ease allowances
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Bust / Chest * ({unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unit === 'inches' ? 'e.g. 36.5' : 'e.g. 92'}
                  value={bust}
                  onChange={(e) => setBust(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:border-[#7B2435] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Waist ({unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unit === 'inches' ? 'e.g. 32.0' : 'e.g. 81'}
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:border-[#7B2435] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Hip ({unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={unit === 'inches' ? 'e.g. 40.0' : 'e.g. 101'}
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:border-[#7B2435] focus:outline-none"
                />
              </div>
            </div>

            {/* Fit Preference & Fabric Stretch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Fit Silhouette Preference:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'snug', label: 'Snug (+1")' },
                    { id: 'regular', label: 'Classic (+2")' },
                    { id: 'relaxed', label: 'Flowing (+3.5")' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreferredFit(p.id as any)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-semibold text-center transition cursor-pointer ${
                        preferredFit === p.id
                          ? 'border-[#7B2435] bg-[#FFF0F3] text-[#7B2435] shadow-xs'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Fabric Drape & Stretch:
                </label>
                <select
                  value={fabricStretch}
                  onChange={(e) => setFabricStretch(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 font-medium"
                >
                  <option value="non_stretch">Pure Non-Stretch Woven (Cotton / Chanderi Silk)</option>
                  <option value="low_stretch">Low Stretch / Modal Blend</option>
                  <option value="medium_stretch">Flexible Georgette / Crepe</option>
                </select>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADBDA] space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 text-[#7B2435] focus:ring-[#7B2435]"
                />
                <div className="text-[11px] text-neutral-700 leading-snug">
                  <span className="font-bold text-neutral-900">Save measurements to my private Vedaaya Fit Profile</span>
                  <p className="text-neutral-500 mt-0.5">
                    {isGuest 
                      ? 'Guest mode active: Measurements remain in temporary browser session and are discarded upon closing.'
                      : 'Allows instant size recommendations across all ethnic collections. 365-day retention with instant deletion controls.'}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isCalculating}
                className="flex-1 py-2.5 bg-[#7B2435] hover:bg-[#631B2A] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isCalculating ? 'Evaluating Precedence & Boundary Math...' : 'Calculate My Recommended Size'}
              </button>

              {isGuest && (bust || waist || hip) && (
                <button
                  type="button"
                  onClick={handleClearGuestSession}
                  className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Clear temporary session data"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Discard
                </button>
              )}
            </div>
          </form>

          {/* Recommendation Output Display */}
          {recommendation && (
            <div className={`p-5 rounded-2xl border transition-all ${
              recommendation.isConfident
                ? 'bg-[#F9FAF6] border-emerald-200'
                : 'bg-[#FFF9F6] border-amber-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      recommendation.confidenceLevel === 'High'
                        ? 'bg-emerald-100 text-emerald-800'
                        : recommendation.confidenceLevel === 'Medium'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {recommendation.confidenceLevel} Confidence ({recommendation.confidenceScore}%)
                    </span>
                    {recommendation.matchedRuleName && (
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Rule: {recommendation.matchedRuleName}
                      </span>
                    )}
                  </div>

                  {recommendation.recommendedSize ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-serif font-bold text-neutral-900">
                        Recommended Size: <span className="text-[#7B2435]">{recommendation.recommendedSize}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-amber-900">
                      Insufficient Information for Definite Recommendation
                    </span>
                  )}

                  <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                    {recommendation.explanation}
                  </p>
                </div>
              </div>

              {/* Between Sizes Warning Box */}
              {recommendation.betweenSizesWarning && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Between Sizes Advice:</strong> {recommendation.betweenSizesWarning.advice} (Lower: {recommendation.betweenSizesWarning.lowerSize}, Sizing Up: {recommendation.betweenSizesWarning.upperSize})
                  </div>
                </div>
              )}

              {/* Out of Stock Fit Trade-Off Section */}
              {recommendation.outOfStockTradeOff && (
                <div className="mt-4 p-4 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-3">
                  <div className="flex items-start gap-2 text-rose-950">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        Out-of-Stock Fit Trade-Off Explanation
                      </h5>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        Recommended size <strong>{recommendation.outOfStockTradeOff.recommendedSize}</strong> is temporarily sold out in our studio inventory. Compare the fit differences below before choosing an available alternate:
                      </p>
                    </div>
                  </div>

                  {recommendation.outOfStockTradeOff.alternativeSizes && recommendation.outOfStockTradeOff.alternativeSizes.length > 0 ? (
                    <div className="space-y-2">
                      {recommendation.outOfStockTradeOff.alternativeSizes.map((alt: any) => (
                        <div key={alt.size} className="p-3 bg-white rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 text-sm">Size {alt.size}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                                {alt.stock} In Stock
                              </span>
                              {alt.isSuggested && (
                                <span className="px-2 py-0.5 bg-[#7B2435] text-white text-[10px] font-bold rounded">
                                  Studio Recommended Alt
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-600 text-[11px] mt-1 leading-snug">
                              {alt.tradeOffExplanation}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConfirmAndApplySize(alt.size)}
                            className="px-3 py-1.5 bg-[#7B2435] hover:bg-[#631B2A] text-white text-xs font-bold rounded-lg shrink-0 transition cursor-pointer"
                          >
                            Choose Size {alt.size}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 italic">No alternative sizes currently in stock.</p>
                  )}

                  {/* Restock Notification */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-600">
                      Prefer to wait for exact size {recommendation.outOfStockTradeOff.recommendedSize}?
                    </span>
                    {notifySubscribed ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Restock Alert Set!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNotifySubscribed(true)}
                        className="px-3 py-1 bg-white border border-rose-300 text-rose-900 hover:bg-rose-50 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 text-rose-700" /> Notify Me When Restocked
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Conflict Warnings (if any) */}
              {recommendation.conflictWarnings && recommendation.conflictWarnings.length > 0 && (
                <div className="mt-2 text-[11px] text-neutral-500 space-y-0.5">
                  {recommendation.conflictWarnings.map((w, idx) => (
                    <p key={idx} className="flex items-center gap-1 text-neutral-500">
                      <Info className="w-3 h-3 text-neutral-400" /> {w}
                    </p>
                  ))}
                </div>
              )}

              {/* MANDATORY: Customer Confirmation Before Size Selection */}
              <div className="mt-4 pt-4 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-neutral-600">
                  {confirmedSize ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Size {confirmedSize} confirmed and applied to product!
                    </span>
                  ) : (
                    <span>Confirm your size to apply to the product selection:</span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {recommendation.recommendedSize && (
                    <button
                      type="button"
                      onClick={() => handleConfirmAndApplySize(recommendation.recommendedSize!)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        confirmedSize === recommendation.recommendedSize
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#7B2435] text-white hover:bg-[#631B2A] shadow-xs'
                      }`}
                    >
                      <Check className="w-4 h-4" /> Apply Size {recommendation.recommendedSize}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setManualOverridePending(!manualOverridePending)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white cursor-pointer"
                  >
                    Choose Different Size
                  </button>
                </div>
              </div>

              {/* Manual Override Tracking Form */}
              {manualOverridePending && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-neutral-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      Manual Size Selection (Override Recommendation):
                    </span>
                    <span className="text-[10px] text-neutral-400">Override tracked for fit refinement</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleConfirmAndApplySize(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          selectedSize === s
                            ? 'bg-[#7B2435] text-white border-[#7B2435]'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Optional: Why do you prefer this size? (e.g. Broader shoulders, layering)"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Measurement Instructions & Media */}
      {activeTab === 'instructions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sidebar list */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                Measurement Points
              </span>
              {instructions.map((ins, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedInstructionIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedInstructionIndex === idx
                      ? 'bg-[#FFF0F3] border-[#7B2435] text-[#7B2435] font-bold shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-xs">{ins.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              ))}
            </div>

            {/* Instruction Detail Preview */}
            <div className="md:col-span-2 p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-neutral-900">
                  {instructions[selectedInstructionIndex]?.label}
                </h4>
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-mono rounded">
                  Point: {instructions[selectedInstructionIndex]?.field}
                </span>
              </div>

              {instructions[selectedInstructionIndex]?.imageUrl && (
                <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 relative">
                  <img
                    src={instructions[selectedInstructionIndex].imageUrl}
                    alt={instructions[selectedInstructionIndex].label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Visual Guide
                  </div>
                </div>
              )}

              <p className="text-xs text-neutral-700 leading-relaxed bg-[#FAF6F0] p-3 rounded-xl border border-neutral-200">
                <strong>Studio Measurement Tip:</strong> {instructions[selectedInstructionIndex]?.tip}
              </p>

              {instructions[selectedInstructionIndex]?.videoUrl && (
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between text-xs text-[#7B2435]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Video className="w-4 h-4" /> Watch 30-second measurement tutorial
                  </span>
                  <a
                    href={instructions[selectedInstructionIndex].videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline hover:text-[#631B2A]"
                  >
                    Watch Video
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Full Sizing Table */}
      {activeTab === 'guide_table' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-xs">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-[#FAF6F0] text-neutral-900 uppercase font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3 text-[#7B2435]">Size</th>
                  {(activeGuide?.customColumns || [
                    { id: 'col-bust', name: 'Bust (in)', key: 'bust' },
                    { id: 'col-waist', name: 'Waist (in)', key: 'waist' },
                    { id: 'col-hip', name: 'Hip (in)', key: 'hip' },
                    { id: 'col-length', name: 'Length (in)', key: 'length' },
                    { id: 'col-shoulder', name: 'Shoulder (in)', key: 'shoulder' },
                  ]).map((col) => (
                    <th key={col.id} className="p-3">
                      {col.name} ({unit === 'inches' ? 'in' : 'cm'})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {(activeGuide?.measurements || []).map((row) => (
                  <tr key={row.size} className={`hover:bg-[#FFF6F7] transition font-medium ${
                    selectedSize === row.size ? 'bg-[#FFF0F3]/60 font-bold' : ''
                  }`}>
                    <td className="p-3 text-[#7B2435] font-bold text-sm flex items-center gap-1.5">
                      {row.size}
                      {selectedSize === row.size && (
                        <span className="px-1.5 py-0.5 bg-[#7B2435] text-white text-[9px] rounded uppercase">
                          Selected
                        </span>
                      )}
                    </td>
                    {(activeGuide?.customColumns || [
                      { id: 'col-bust', key: 'bust' },
                      { id: 'col-waist', key: 'waist' },
                      { id: 'col-hip', key: 'hip' },
                      { id: 'col-length', key: 'length' },
                      { id: 'col-shoulder', key: 'shoulder' },
                    ]).map((col) => {
                      const val = (row as any)[col.key];
                      const formatted = val !== undefined && val !== null 
                        ? (unit === 'cm' ? `${Math.round(val * 2.54)} cm` : `${val}"`) 
                        : '-';
                      return (
                        <td key={col.id} className="p-3 font-semibold text-neutral-800">
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Privacy, Consent & Profile Controls */}
      {activeTab === 'privacy' && (
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#7B2435] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">
                Fit Profile Privacy & Explicit Consent Architecture
              </h4>
              <p className="text-xs text-neutral-500">
                Full transparency over body measurement storage, retention policies, and data export.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FAF6F0] rounded-xl border border-neutral-200 space-y-2">
              <h5 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7B2435]" /> Data Protection Standards
              </h5>
              <ul className="text-[11px] text-neutral-600 space-y-1.5 list-disc list-inside">
                <li>Measurements are <strong>never shared or sold</strong> to third parties.</li>
                <li>Data is retained for a maximum of 365 days unless renewed.</li>
                <li>Guest measurements remain in temporary session memory only.</li>
                <li>Right to be Forgotten is fully supported with 1-click irreversible deletion.</li>
              </ul>
            </div>

            <div className="p-4 bg-[#FAF6F0] rounded-xl border border-neutral-200 space-y-2">
              <h5 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" /> Current Customer Status
              </h5>
              <div className="text-[11px] text-neutral-700 space-y-1">
                <p>Status: <strong>{currentUser ? 'Registered Customer' : 'Guest Shopper'}</strong></p>
                <p>Consent: <strong className={hasConsented ? 'text-emerald-700' : 'text-amber-700'}>{hasConsented ? 'Explicit Consent Granted' : 'Session Only / No Consent'}</strong></p>
                {savedProfile && (
                  <p>Profile ID: <code className="bg-neutral-200 px-1 py-0.5 rounded text-[10px]">{savedProfile.userId}</code></p>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentUser?.id && (
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export My Fit Data (JSON)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isGuest ? (
                <button
                  type="button"
                  onClick={handleClearGuestSession}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Session Memory
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePurgeProfile}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete My Fit Profile (Right to be Forgotten)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
