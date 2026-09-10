import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Camera,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Maximize2,
  Columns,
  Star,
  Tag,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CreditCard,
  PhoneOff,
  PhoneCall,
  HelpCircle,
  Layers,
  Radio,
  Activity,
  Zap
} from 'lucide-react';
import { GiniSettings, GiniTurn, GiniPendingConfirmation } from '../../types/gini';
import { GiniUIState } from '../../hooks/useGiniVoice';
import { Product } from '../../types';
import { useGeminiLiveCall } from '../../hooks/useGeminiLiveCall';
import { API_BASE_URL } from '../../config/apiConfig';

export interface GiniAstraModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GiniSettings;
  uiState: GiniUIState;
  hasConsent: boolean;
  language: 'en-IN' | 'hi-IN';
  onToggleLanguage: (lang: 'en-IN' | 'hi-IN') => void;
  turns: GiniTurn[];
  partialTranscript: string;
  currentSpeechText: string;
  pendingConfirmation: GiniPendingConfirmation | null;
  errorMessage: string;
  isMuted: boolean;
  onToggleMute: () => void;
  audioLevel?: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onGrantConsent: () => void;
  onSubmitTurn: (text: string) => void;
  onResolveConfirmation: (decision: 'confirmed' | 'rejected') => void;
  onStopSpeech: () => void;
  onSpeakResponse?: (text: string, lang?: 'en-IN' | 'hi-IN') => void;
  onUnlockAudio?: () => void;
  onOpenProduct?: (product: Product) => void;
  onAddToCart?: (qty: number, size?: string, targetProduct?: Product) => void;
  onOpenCheckout?: () => void;
  onProductsUpdated?: (products: any[], params?: Record<string, any>) => void;
  onNavigateRoute?: (path: string) => void;
  layoutMode?: 'split' | 'fullscreen';
  onToggleLayoutMode?: () => void;
}

export const GiniAstraModal: React.FC<GiniAstraModalProps> = ({
  isOpen,
  onClose,
  config,
  uiState,
  hasConsent,
  language,
  onToggleLanguage,
  turns: fallbackTurns,
  partialTranscript: fallbackPartialTranscript,
  currentSpeechText: fallbackSpeechText,
  pendingConfirmation,
  errorMessage: fallbackError,
  isMuted,
  onToggleMute,
  audioLevel = 0,
  onStartListening,
  onStopListening,
  onGrantConsent,
  onSubmitTurn,
  onResolveConfirmation,
  onStopSpeech,
  onSpeakResponse,
  onUnlockAudio,
  onOpenProduct,
  onAddToCart,
  onOpenCheckout,
  onProductsUpdated,
  onNavigateRoute,
  layoutMode = 'fullscreen',
  onToggleLayoutMode
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'camera'>('voice');
  const [typedInput, setTypedInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionInsights, setVisionInsights] = useState<any>(null);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [visionError, setVisionError] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Gemini Live Native Real-Time Bidirectional Speech-to-Speech Hook
  const liveCall = useGeminiLiveCall({
    language,
    context: {
      currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
      cartItemCount: 0,
      cartGrandTotal: 0,
      isAuthenticated: true,
    },
    onNavigateRoute: (path) => {
      if (onNavigateRoute) onNavigateRoute(path);
    },
    onSearchCatalog: (params) => {
      // Catalog search callback
    },
    onProductsUpdated: (prods, params) => {
      setMatchedProducts(prods);
      if (onProductsUpdated) onProductsUpdated(prods, params);
    },
    onOpenProduct: (p) => {
      if (onOpenProduct) onOpenProduct(p);
    },
    onAddToCart: (qty, size, target) => {
      if (onAddToCart) onAddToCart(qty, size, target);
    },
    onOpenCheckout: () => {
      if (onOpenCheckout) onOpenCheckout();
    },
  });

  // PHP-FPM uses request/response voice turns; browser speech keeps the conversation continuous.
  const activeTurns = fallbackTurns;
  const isLiveActive = uiState === 'listening' || uiState === 'speaking' || uiState === 'processing';
  const isListening = uiState === 'listening';
  const isSpeaking = uiState === 'speaking';
  const isProcessing = uiState === 'processing' || isAnalyzingVision;
  const isInterrupted = false;
  const activeError = fallbackError;

  // Auto-scroll chat to latest turn smoothly when turns update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeTurns.length, fallbackSpeechText, isProcessing, pendingConfirmation]);

  // Clean up camera
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
    }
  }, [isOpen, activeTab, stopCamera]);

  const startCamera = async () => {
    try {
      setVisionError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setVisionError('Unable to access camera. Please allow camera permissions in your browser.');
      setCameraActive(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);

    setIsAnalyzingVision(true);
    setVisionError('');

    try {
      const res = await fetch(`${API_BASE_URL}/gini/vision-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          prompt: 'Identify the ethnic apparel type, fabric, neckline, occasion, embroidery, and suggest matching kurtis or suits.',
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVisionInsights(data.analysis);
        setMatchedProducts(data.matchedProducts || []);
      } else {
        throw new Error('Vision analysis failed');
      }
    } catch (err: any) {
      console.warn('Vision analysis error:', err);
      setVisionError('Could not analyze the frame. Please align the clothing item and try again.');
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product: Product) => {
    const chosenSize = selectedSizes[product.id] || 'M';
    if (onAddToCart) {
      onAddToCart(1, chosenSize, product);
    }
  };

  const handleBuyNow = (product: Product) => {
    const chosenSize = selectedSizes[product.id] || 'M';
    if (onAddToCart) {
      onAddToCart(1, chosenSize, product);
    }
    if (onOpenCheckout) {
      onOpenCheckout();
    }
  };

  const handleHangUp = () => {
    liveCall.endCall();
    onStopListening();
    onStopSpeech();
    onClose();
  };

  const handleSendText = (text: string) => {
    if (!text.trim()) return;
    onSubmitTurn(text);
    setTypedInput('');
  };

  if (!isOpen) return null;

  const isSplit = layoutMode === 'split';

  // Extract suggestions from last turn or defaults
  const lastAssistantTurn = [...activeTurns].reverse().find(t => t.speaker === 'gini');
  const activeSuggestionChips = lastAssistantTurn?.suggestedChips && lastAssistantTurn.suggestedChips.length > 0
    ? lastAssistantTurn.suggestedChips
    : [
        '🌸 Pure cotton kurtis under ₹2,000',
        '✨ Festive Anarkali Sets',
        '💎 Handcrafted Chikankari',
        '🛒 Where is my order?',
        '🛍️ View Bag & Checkout'
      ];

  const modalContent = (
    <div
      id="gini-astra-container"
      className={`bg-white text-stone-900 flex flex-col overflow-hidden border border-stone-200 shadow-2xl transition-all duration-300 ${
        isSplit
          ? 'w-full h-full rounded-none'
          : 'w-full max-w-4xl h-[92vh] sm:h-[88vh] rounded-3xl relative z-10'
      }`}
    >
      {/* Red Website Brand Top Header with Live Phone Indicators */}
      <div className="bg-gradient-to-r from-[#7B2435] via-[#8B1E3F] to-[#7B2435] px-4 py-3 border-b border-[#D4AF37]/40 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F5E6BE] flex items-center justify-center text-stone-950 font-black shadow-md">
              <Sparkles className="w-5 h-5 text-[#7B2435] animate-spin-slow" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#7B2435] animate-ping" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#7B2435]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm tracking-wide text-white">
                {config.displayName || 'Gini AI Shopping Call'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-300 animate-pulse" />
                <span>Vertex Live S2S</span>
              </span>
            </div>
            <p className="text-[11px] text-amber-100/90 font-medium truncate max-w-[220px] sm:max-w-xs flex items-center gap-1">
              <span>Real-Time Bidirectional Speech Call</span>
              <span className="text-[9px] px-1 bg-white/20 rounded">Voice: {liveCall.activeVoiceName || 'Aoede'}</span>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => onToggleLanguage(language === 'en-IN' ? 'hi-IN' : 'en-IN')}
            className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <span>{language === 'en-IN' ? 'English' : 'हिंदी'}</span>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleMute();
              liveCall.setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isMuted
                ? 'bg-rose-950/80 border-rose-400 text-rose-200'
                : 'bg-white/15 border-white/25 text-amber-200 hover:bg-white/25'
            }`}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Split / Fullscreen mode toggle */}
          {onToggleLayoutMode && (
            <button
              type="button"
              onClick={onToggleLayoutMode}
              className="hidden sm:flex p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white transition cursor-pointer"
              title={isSplit ? 'Expand to Fullscreen' : 'Switch to Split Pane'}
            >
              {isSplit ? <Maximize2 className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
            </button>
          )}

          {/* Prominent Hang Up / End Call Button */}
          <button
            type="button"
            onClick={handleHangUp}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
            title="Hang Up / End Voice Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Hang Up</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs (Voice Assistant vs Live Camera Vision) */}
      <div className="bg-[#FAF7F2] px-4 py-2 border-b border-stone-200 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-[#7B2435] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Commerce Call</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              if (!cameraActive) startCamera();
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-[#7B2435] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Style Lens (Camera)</span>
          </button>
        </div>

        {/* Real-Time Call Status Indicator */}
        <div className="flex items-center gap-2 text-[11px] font-medium">
          {isInterrupted ? (
            <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600" />
              Interruption Handled
            </span>
          ) : isSpeaking ? (
            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-emerald-600 animate-pulse" />
              Gini Speaking (24kHz HD)
            </span>
          ) : isListening ? (
            <span className="text-[#7B2435] bg-rose-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#7B2435] animate-ping" />
              Continuous Listening (Speak freely)
            </span>
          ) : (
            <span className="text-stone-600">Connected</span>
          )}
        </div>
      </div>

      {/* Main Interactive Body */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-[#FAF9F6]">
        {activeTab === 'camera' ? (
          /* Live Vision / Camera Mode */
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[340px] border border-stone-300 flex items-center justify-center shadow-sm">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#D4AF37]/80 m-4 rounded-xl flex items-center justify-center">
                <span className="bg-black/70 px-3 py-1 rounded-full text-[11px] text-amber-200 font-medium">
                  Align Kurti, Fabric, or Pattern in frame
                </span>
              </div>

              <div className="absolute bottom-3 inset-x-0 flex justify-center">
                <button
                  type="button"
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzingVision}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7B2435] to-[#9C2D43] text-white font-bold text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzingVision ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Analyzing Style & Fabric...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-white" />
                      <span>Capture & Match Kurti</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {visionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{visionError}</span>
              </div>
            )}

            {/* Vision Insights */}
            {visionInsights && (
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-xs animate-fadeIn">
                <h4 className="text-xs font-bold text-[#7B2435] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>AI Visual Match & Styling Recommendations</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Silhouette</span>
                    <span className="font-bold text-stone-900">{visionInsights.silhouette || 'Straight Kurti'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Fabric</span>
                    <span className="font-bold text-stone-900">{visionInsights.fabric || 'Pure Cotton'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Color Family</span>
                    <span className="font-bold text-stone-900">{visionInsights.color || 'Crimson Red'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Occasion</span>
                    <span className="font-bold text-stone-900">{visionInsights.occasion || 'Festive / Casual'}</span>
                  </div>
                </div>

                {matchedProducts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-stone-900">Closest Catalog Matches:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200 hover:border-[#7B2435]/60 transition shadow-2xs"
                        >
                          <img
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300'}
                            alt={p.name}
                            className="w-14 h-16 object-cover rounded-lg shrink-0 border border-stone-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-stone-900 truncate">{p.name}</h5>
                            <span className="text-xs font-black text-[#7B2435] block">₹{p.sellingPrice?.toLocaleString('en-IN')}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p)}
                              className="mt-1 px-2.5 py-1 rounded bg-[#7B2435] text-white text-[10px] font-bold hover:bg-[#601D2A] transition cursor-pointer shadow-2xs"
                            >
                              Add to Bag
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Voice Call Chat Transcript & Live Recommendations */
          <div
            ref={chatScrollRef}
            className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 scroll-smooth"
          >
            {/* Live Phone Call Banner */}
            <div className="p-3.5 rounded-2xl bg-[#7B2435]/6 border border-[#7B2435]/20 text-xs text-stone-800 flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#7B2435] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#7B2435] text-[12px]">
                    Live Phone Conversation Active
                  </p>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                    Continuous Stream
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Start speaking naturally like a phone call. The call will stay connected throughout. You can interrupt Gini anytime and say things like <span className="text-[#7B2435] font-bold">"Show red cotton kurtis under 2000"</span>, <span className="text-[#7B2435] font-bold">"Add this in size M"</span>, or <span className="text-[#7B2435] font-bold">"Where is my order?"</span>.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {activeError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{activeError}</span>
                </div>
                <button
                  type="button"
                  onClick={onStartListening}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap"
                >
                  Reconnect Call
                </button>
              </div>
            )}

            {/* Conversational Turns */}
            {activeTurns.map((turn, index) => {
              const isGini = turn.speaker === 'gini';
              const turnProds = (turn.suggestedProducts && turn.suggestedProducts.length > 0)
                ? turn.suggestedProducts
                : (matchedProducts.length > 0 && index === activeTurns.length - 1 ? matchedProducts : []);

              return (
                <div
                  key={turn.id || index}
                  className={`flex flex-col space-y-2 animate-fadeIn ${
                    isGini ? 'items-start' : 'items-end'
                  }`}
                >
                  {/* Speaker bubble */}
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-3.5 shadow-sm ${
                      isGini
                        ? 'bg-white border border-stone-200 text-stone-900 rounded-tl-none'
                        : 'bg-gradient-to-r from-[#7B2435] to-[#9C2D43] text-white rounded-tr-none'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isGini ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="text-[11px] font-bold text-[#7B2435] font-serif">
                            {config.displayName || 'Gini AI'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-100">You (Voice)</span>
                      )}
                      <span className={`text-[9px] ml-auto ${isGini ? 'text-stone-400' : 'text-white/60'}`}>
                        {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className={`text-xs sm:text-[13px] leading-relaxed font-sans ${isGini ? 'text-stone-800' : 'text-white'}`}>
                      {turn.transcript}
                    </p>
                  </div>

                  {/* Dynamic Product Cards Rendered on Screen with 1-Tap Purchase */}
                  {turnProds.length > 0 && (
                    <div className="w-full space-y-2.5 mt-1 bg-stone-50 p-3 rounded-2xl border border-stone-200 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#7B2435]">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#7B2435]" />
                          <span>Curated Outfits for You — 1-Tap Add to Bag</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">{turnProds.length} styles</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {turnProds.map((prod: Product) => {
                          const currentSize = selectedSizes[prod.id] || 'M';
                          const discount = prod.mrp && prod.mrp > prod.sellingPrice
                            ? Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100)
                            : 0;

                          return (
                            <div
                              key={prod.id}
                              className="bg-white hover:bg-stone-50/90 border border-stone-200 hover:border-[#7B2435]/50 rounded-xl p-2.5 transition flex flex-col justify-between group shadow-xs"
                            >
                              <div className="flex gap-2.5">
                                <div
                                  onClick={() => onOpenProduct && onOpenProduct(prod)}
                                  className="w-16 h-20 rounded-lg overflow-hidden bg-stone-100 shrink-0 cursor-pointer relative border border-stone-200"
                                >
                                  <img
                                    src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400'}
                                    alt={prod.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                    referrerPolicy="no-referrer"
                                  />
                                  {discount > 0 && (
                                    <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded shadow-2xs">
                                      {discount}% OFF
                                    </span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <h4
                                      onClick={() => onOpenProduct && onOpenProduct(prod)}
                                      className="text-xs font-bold text-stone-900 line-clamp-1 hover:text-[#7B2435] cursor-pointer"
                                    >
                                      {prod.name}
                                    </h4>
                                    <span className="text-[10px] text-stone-500 block">
                                      {prod.category || 'Kurti'} • {prod.fabric || 'Cotton'}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-xs font-black text-[#7B2435]">
                                        ₹{prod.sellingPrice?.toLocaleString('en-IN')}
                                      </span>
                                      {prod.mrp && prod.mrp > prod.sellingPrice && (
                                        <span className="text-[10px] text-stone-400 line-through">
                                          ₹{prod.mrp?.toLocaleString('en-IN')}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Size selector pills */}
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[9px] text-stone-500 font-medium">Size:</span>
                                    {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleSelectSize(prod.id, s)}
                                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition cursor-pointer ${
                                          currentSize === s
                                            ? 'bg-[#7B2435] text-white font-black shadow-2xs'
                                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                        }`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-100">
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(prod)}
                                  className="flex-1 py-1.5 px-2 bg-gradient-to-r from-[#7B2435] to-[#9C2D43] hover:from-[#601D2A] hover:to-[#7B2435] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Add to Bag ({currentSize})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBuyNow(prod)}
                                  className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 border border-stone-200"
                                >
                                  <CreditCard className="w-3 h-3 text-emerald-600" />
                                  <span>Buy Now</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Follow-up chips for turn */}
                  {turn.suggestedChips && turn.suggestedChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {turn.suggestedChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendText(chip.replace(/^[^\w\s]+/, '').trim())}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-[#7B2435] hover:text-white border border-stone-200 text-[10px] sm:text-[11px] text-stone-700 font-medium transition cursor-pointer whitespace-nowrap shadow-2xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Streaming Speech Bubble while Gini is talking */}
            {isSpeaking && fallbackSpeechText && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[85%] rounded-2xl rounded-tl-none p-3 bg-white border border-[#D4AF37]/50 text-stone-900 text-xs sm:text-[13px] shadow-sm flex items-start gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block text-[#7B2435] mb-0.5">
                      Gini Speaking (Live Audio)...
                    </span>
                    <p className="leading-relaxed">{fallbackSpeechText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* High-Impact L3 Confirmation Modal */}
            {pendingConfirmation && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border-2 border-[#D4AF37] text-stone-900 space-y-2.5 animate-fadeIn shadow-sm">
                <div className="flex items-center gap-2 text-[#7B2435] font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Spoken Confirmation Required</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  {pendingConfirmation.displaySummary}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onResolveConfirmation('rejected')}
                    className="flex-1 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 border border-stone-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveConfirmation('confirmed')}
                    className="flex-1 py-1.5 rounded-xl bg-[#7B2435] hover:bg-[#601D2A] text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    Yes, Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Central Live Equalizer & Mic Call Deck */}
      {activeTab === 'voice' && (
        <div className="px-4 py-3.5 bg-white border-t border-stone-200 flex flex-col items-center justify-center space-y-2 shrink-0 shadow-2xs">
          {/* Real-time Dynamic Waveform Equalizer Display */}
          <div className="flex items-center gap-1 h-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
              const isAiTalking = isSpeaking;
              const isUserTalking = audioLevel > 15;
              const barHeight = isAiTalking
                ? Math.min(24, Math.max(6, (Math.sin(bar * 0.8 + Date.now() / 200) + 1) * 10))
                : isUserTalking
                ? Math.min(24, Math.max(6, (audioLevel / 100) * 22))
                : 4;

              return (
                <span
                  key={bar}
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: isAiTalking
                      ? '#059669' // Emerald for AI
                      : isUserTalking
                      ? '#7B2435' // Maroon for User
                      : '#E7E5E4',
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between w-full max-w-md px-2">
            {/* Call State Feedback */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-xs font-bold block text-stone-900">
                  {isSpeaking ? '🔊 Gini Speaking (Interrupt anytime)' : isListening ? '🎙️ Continuous Listening...' : 'Call Connected'}
                </span>
                <span className="text-[10px] text-stone-500">
                  {language === 'hi-IN' ? 'हिंदी में बोलें • रुकावट समर्थित' : 'Speak in English or Hindi naturally'}
                </span>
              </div>
            </div>

            {/* Central Controls: Mute & Hang Up */}
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={() => liveCall.stopAllAiAudio()}
                  className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-bold text-stone-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Interrupt</span>
                </button>
              )}

              <button
                type="button"
                id="gini-hangup-btn"
                onClick={handleHangUp}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Hang Up</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Chips Row */}
      {activeSuggestionChips.length > 0 && (
        <div className="px-3 py-2 bg-[#FAF7F2] border-t border-stone-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#7B2435] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            Ask Gini:
          </span>
          {activeSuggestionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendText(chip.replace(/^[^\w\s]+/, '').trim())}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-[#7B2435] hover:text-white border border-stone-200 text-[10px] text-stone-700 font-medium transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Text Fallback Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!typedInput.trim()) return;
          handleSendText(typedInput.trim());
        }}
        className="p-2.5 sm:p-3 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder={language === 'hi-IN' ? 'जैसे: 2000 के अंदर कॉटन कुर्ती दिखाओ या Add to cart...' : 'Type or speak e.g. "Show me festive anarkali kurtis under 2000"'}
          className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-[#7B2435]"
        />
        <button
          type="submit"
          disabled={!typedInput.trim()}
          className="p-2 rounded-xl bg-[#7B2435] hover:bg-[#601D2A] text-white font-bold transition cursor-pointer disabled:opacity-40 shadow-2xs"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </form>
    </div>
  );

  if (isSplit) {
    return modalContent;
  }

  return (
    <div
      id="gini-astra-live-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#7B2435]/30 via-transparent to-[#D4AF37]/20 pointer-events-none" />
      {modalContent}
    </div>
  );
};
