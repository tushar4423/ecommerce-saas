import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GiniSettings, 
  GiniTurn, 
  GiniPendingConfirmation, 
  GiniActionId 
} from '../types/gini';
import { INITIAL_GINI_SETTINGS } from '../data/giniDefaults';
import { API_BASE_URL } from '../config/apiConfig';

export type GiniUIState = 
  | 'off'
  | 'idle'
  | 'permission'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'confirmation'
  | 'complete'
  | 'error'
  | 'maintenance';

// Acoustic & phonetic normalizer for Indian English & Hindi voice transcription
function normalizeIndianVoiceTranscript(raw: string): string {
  if (!raw) return '';
  let t = raw.toLowerCase().trim();

  // 1. Common STT phonetics & homophones in Indian English
  // "card" / "kort" / "cot" -> "cart" when combined with open / view / my / to
  t = t.replace(/\b(open|view|show|check|see|go to|mera|meri|my)?\s*(?:card|kort|cot|kut|cut|cort|curt)\b/gi, (match) => {
    return match.replace(/(?:card|kort|cot|kut|cut|cort|curt)/gi, 'cart');
  });

  // Standalone "card" in shopping context -> "cart"
  if (/^(open card|my card|show card|view card|card kholo|card dikhao|card)$/i.test(t)) {
    t = t.replace(/\bcard\b/gi, 'cart');
  }

  // 2. Garment & craft normalizations
  t = t.replace(/\b(kuti|kutie|kurtie|kurte|kurtis|koti|kurtees)\b/gi, 'kurti');
  t = t.replace(/\b(chikan|chiken|chicken|chikankari|chikankaari|chikan kari)\b/gi, 'chikankari');
  t = t.replace(/\b(anarkli|anar kali|anarkaly|anarkali suit)\b/gi, 'anarkali');
  t = t.replace(/\b(dupatto|dupatta set|chunnri|chunni)\b/gi, 'dupatta');
  t = t.replace(/\b(palazo|plazzo|plazo|plazo set)\b/gi, 'palazzo');
  t = t.replace(/\b(coord|co ord|cord set|cord)\b/gi, 'co-ord');
  t = t.replace(/\b(check out|chec out|chekout|checkit)\b/gi, 'checkout');
  t = t.replace(/\b(size guide|size chart|naap|measurements|measurement)\b/gi, 'size guide');

  return t;
}

export interface UseGiniVoiceProps {
  onNavigateRoute?: (path: string) => void;
  onSearchCatalog?: (params: Record<string, any>) => void;
  onProductsUpdated?: (products: any[], params?: Record<string, any>) => void;
  onOpenProduct?: (product: any) => void;
  onOpenSizeGuide?: () => void;
  onOpenCheckout?: () => void;
  onSelectVariant?: (size?: string, color?: string, alsoAddToCart?: boolean) => void;
  onAddToCart?: (qty: number, size?: string, targetProduct?: any) => void;
  onUpdateCartQty?: (qty: number) => void;
  onRemoveCartItem?: () => void;
  onApplyCoupon?: (code: string) => void;
  onOrderConfirmed?: (order: any) => void;
  context?: {
    currentRoute: string;
    cartItemCount: number;
    cartGrandTotal: number;
    selectedProduct?: any;
    selectedAddress?: any;
    isAuthenticated: boolean;
    customerId?: string;
  };
}

export function useGiniVoice({
  onNavigateRoute,
  onSearchCatalog,
  onProductsUpdated,
  onOpenProduct,
  onOpenSizeGuide,
  onOpenCheckout,
  onSelectVariant,
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onApplyCoupon,
  onOrderConfirmed,
  context
}: UseGiniVoiceProps) {
  const [config, setConfig] = useState<GiniSettings>(INITIAL_GINI_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [uiState, setUiState] = useState<GiniUIState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(true);
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [isCallActive, setIsCallActive] = useState(false);
  
  // Transcripts & Conversation
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [turns, setTurns] = useState<GiniTurn[]>([]);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<GiniPendingConfirmation | null>(null);
  const [lastActionResult, setLastActionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // Kept for interface compatibility

  // Audio recognition & speech references
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const micPermissionDeniedRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioElemRef = useRef<HTMLAudioElement | null>(null);
  const undoTimerRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const speechWatchdogTimerRef = useRef<any>(null);
  const hasGreetedRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  // 1. Proactively request microphone access on initial application load
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      }).then((stream) => {
        mediaStreamRef.current = stream;
        micPermissionDeniedRef.current = false;
        setHasConsent(true);
        localStorage.setItem('gini_consent_granted', 'true');
        setErrorMessage('');
      }).catch((err) => {
        console.warn('[Initial Mic Access]:', err);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          micPermissionDeniedRef.current = true;
          setErrorMessage('Microphone access denied. Tap "Allow Mic" or type below.');
        }
      });
    }
  }, []);

  // 1. Fetch published Gini config
  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/gini/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.state === 'off') {
          setUiState('off');
        } else if (data.state === 'maintenance' || data.state === 'paused') {
          setUiState('maintenance');
        }
      }
    } catch (e) {
      console.warn('Could not fetch Gini config:', e);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    const interval = setInterval(refreshConfig, 30000);
    return () => clearInterval(interval);
  }, [refreshConfig]);

  // Check stored consent
  useEffect(() => {
    localStorage.setItem('gini_consent_granted', 'true');
    setHasConsent(true);
  }, []);

  // 2. Start or Resume Consented Session
  const initSession = useCallback(async () => {
    if (sessionId) return sessionId;
    try {
      const res = await fetch(`${API_BASE_URL}/gini/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: context?.customerId,
          locale: language,
          deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        return data.sessionId;
      }
    } catch (e) {
      console.warn('Session start error:', e);
    }
    const fallbackId = `sess-local-${Date.now()}`;
    setSessionId(fallbackId);
    return fallbackId;
  }, [sessionId, context?.customerId, language]);

  // Stop any current speech playback
  const stopSpeech = useCallback(() => {
    if (speechWatchdogTimerRef.current) {
      clearTimeout(speechWatchdogTimerRef.current);
      speechWatchdogTimerRef.current = null;
    }

    if (activeAudioElemRef.current) {
      try {
        activeAudioElemRef.current.pause();
        activeAudioElemRef.current.currentTime = 0;
      } catch {}
      activeAudioElemRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      if ((window as any).__giniSpeechUtterances) {
        (window as any).__giniSpeechUtterances.clear();
      }
    }
    isSpeakingRef.current = false;
    if (uiState === 'speaking') {
      setUiState(isCallActiveRef.current ? 'listening' : 'idle');
    }
  }, [uiState]);

  // Forward declarations for continuous loop
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);

  // Helper to safely schedule microphone restart in continuous call mode
  const resumeListeningLoop = useCallback((delayMs: number = 250) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current && startListeningRef.current) {
        startListeningRef.current().catch(() => {});
      }
    }, delayMs);
  }, []);

  // Unlock Web Audio & SpeechSynthesis upon any user interaction
  const unlockAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
        // Play micro silent tone to unlock HTML5 & Web Audio autoplay restriction
        try {
          const osc = audioContextRef.current.createOscillator();
          const gain = audioContextRef.current.createGain();
          gain.gain.value = 0.0001;
          osc.connect(gain);
          gain.connect(audioContextRef.current.destination);
          osc.start();
          osc.stop(audioContextRef.current.currentTime + 0.02);
        } catch {}
      }
    } catch {}
  }, []);

  // Fallback Web Speech synthesis with anti-GC, pause-resume & watchdog safety
  const fallbackBrowserSpeech = useCallback((text: string, lang: 'en-IN' | 'hi-IN') => {
    if (speechWatchdogTimerRef.current) {
      clearTimeout(speechWatchdogTimerRef.current);
      speechWatchdogTimerRef.current = null;
    }

    // Stop microphone during speech output to prevent hearing Gini's voice
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch {}
    }
    isListeningRef.current = false;
    isSpeakingRef.current = true;
    setUiState('speaking');
    setCurrentSpeechText(text);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      isSpeakingRef.current = false;
      isProcessingRef.current = false;
      if (isCallActiveRef.current) {
        setUiState('listening');
        resumeListeningLoop(300);
      } else {
        setUiState('idle');
      }
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {}

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Global Set to prevent Chromium V8 garbage collection bug
    if (!(window as any).__giniSpeechUtterances) {
      (window as any).__giniSpeechUtterances = new Set();
    }
    (window as any).__giniSpeechUtterances.add(utterance);

    utterance.lang = lang;
    utterance.rate = Math.max(0.9, Math.min(1.15, config.speakingRate || 1.0));
    utterance.pitch = 1.05;
    utterance.volume = config.volume || 1.0;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      if (lang === 'hi-IN') {
        return voices.find(v => 
          v.lang.toLowerCase().includes('hi') || 
          v.name.toLowerCase().includes('hindi') || 
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('kalpana')
        ) || voices.find(v => v.lang.includes('IN')) || voices[0];
      }
      // Indian English / English priority
      return voices.find(v => 
        v.lang === 'en-IN' || 
        v.name.toLowerCase().includes('india') || 
        v.name.toLowerCase().includes('veena') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('neerja')
      ) || voices.find(v => 
        v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    };

    const targetVoice = pickVoice();
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    let isFinished = false;
    let keepAliveTimer: any = null;

    const finishSpokenTurn = () => {
      if (isFinished) return;
      isFinished = true;
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      if (speechWatchdogTimerRef.current) {
        clearTimeout(speechWatchdogTimerRef.current);
        speechWatchdogTimerRef.current = null;
      }
      if ((window as any).__giniSpeechUtterances) {
        (window as any).__giniSpeechUtterances.delete(utterance);
      }
      isSpeakingRef.current = false;
      isProcessingRef.current = false;

      if (isCallActiveRef.current) {
        setUiState('listening');
        resumeListeningLoop(400);
      } else {
        setUiState('idle');
      }
    };

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setUiState('speaking');
      setCurrentSpeechText(text);

      // Keep synthesis alive across browser engines
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(() => {
        if (!isSpeakingRef.current) {
          clearInterval(keepAliveTimer);
          return;
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 200);
    };

    utterance.onend = () => {
      finishSpokenTurn();
    };

    utterance.onerror = (e: any) => {
      if (e?.error !== 'canceled' && e?.error !== 'interrupted') {
        console.warn('[SpeechSynthesis Error]:', e);
      }
      finishSpokenTurn();
    };

    // Watchdog fallback ensures turn is ALWAYS released even if browser skips onend
    const maxDuration = Math.max(3500, (text.length * 85) + 2500);
    speechWatchdogTimerRef.current = setTimeout(() => {
      finishSpokenTurn();
    }, maxDuration);

    // Speak with safety resume call
    try {
      if (!utterance.voice) {
        const freshVoice = pickVoice();
        if (freshVoice) utterance.voice = freshVoice;
      }
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (synthErr) {
      console.warn('[SpeechSynthesis Speak Error]:', synthErr);
      finishSpokenTurn();
    }
  }, [config.speakingRate, config.volume, resumeListeningLoop]);

  // Text-to-Speech Output (Plays Google Cloud / Vertex Kore HD Audio or browser TTS)
  const speakResponse = useCallback((
    text: string, 
    lang: 'en-IN' | 'hi-IN' = language, 
    audioBase64?: string,
    audioContentType?: string
  ) => {
    if (speechWatchdogTimerRef.current) {
      clearTimeout(speechWatchdogTimerRef.current);
      speechWatchdogTimerRef.current = null;
    }

    // Stop mic recognition immediately so it doesn't hear Gini speaking
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch {}
    }
    isListeningRef.current = false;

    if (!text || typeof window === 'undefined') {
      isSpeakingRef.current = false;
      isProcessingRef.current = false;
      if (isCallActiveRef.current) {
        setUiState('listening');
        resumeListeningLoop(200);
      }
      return;
    }

    unlockAudio();

    if (isMuted) {
      // If muted, show text and transition back to listening
      isSpeakingRef.current = false;
      isProcessingRef.current = false;
      setCurrentSpeechText(text);
      if (isCallActiveRef.current) {
        setUiState('listening');
        resumeListeningLoop(800);
      }
      return;
    }

    // If server provided HD audio base64, play it seamlessly via HTML5 audio
    if (audioBase64 && audioBase64.length > 50) {
      try {
        let cleanBase64 = audioBase64;
        let mime = audioContentType || 'audio/mp3';
        if (cleanBase64.includes('base64,')) {
          const parts = cleanBase64.split('base64,');
          mime = parts[0].replace('data:', '').replace(';','') || mime;
          cleanBase64 = parts[1];
        }

        const binary = atob(cleanBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const audio = new Audio(blobUrl);
        activeAudioElemRef.current = audio;
        audio.volume = config.volume || 1.0;

        isSpeakingRef.current = true;
        setUiState('speaking');
        setCurrentSpeechText(text);

        let isPlaybackFinished = false;
        const finishAudioPlayback = () => {
          if (isPlaybackFinished) return;
          isPlaybackFinished = true;
          if (speechWatchdogTimerRef.current) {
            clearTimeout(speechWatchdogTimerRef.current);
            speechWatchdogTimerRef.current = null;
          }
          isSpeakingRef.current = false;
          isProcessingRef.current = false;
          activeAudioElemRef.current = null;
          try { URL.revokeObjectURL(blobUrl); } catch {}

          if (isCallActiveRef.current) {
            setUiState('listening');
            resumeListeningLoop(400);
          } else {
            setUiState('idle');
          }
        };

        audio.onended = () => {
          finishAudioPlayback();
        };

        audio.onerror = (e) => {
          console.warn('[Audio Element Error, falling back to browser synthesis]:', e);
          if (speechWatchdogTimerRef.current) {
            clearTimeout(speechWatchdogTimerRef.current);
            speechWatchdogTimerRef.current = null;
          }
          activeAudioElemRef.current = null;
          try { URL.revokeObjectURL(blobUrl); } catch {}
          fallbackBrowserSpeech(text, lang);
        };

        // Safety watchdog timer
        const maxAudioDuration = Math.max(3500, (text.length * 85) + 3000);
        speechWatchdogTimerRef.current = setTimeout(() => {
          if (isSpeakingRef.current) {
            finishAudioPlayback();
          }
        }, maxAudioDuration);

        audio.play().catch(playErr => {
          console.warn('[Audio Play blocked by browser, falling back to synthesis]:', playErr);
          if (speechWatchdogTimerRef.current) {
            clearTimeout(speechWatchdogTimerRef.current);
            speechWatchdogTimerRef.current = null;
          }
          activeAudioElemRef.current = null;
          try { URL.revokeObjectURL(blobUrl); } catch {}
          fallbackBrowserSpeech(text, lang);
        });
        return;
      } catch (err) {
        console.warn('Audio decoding failed, falling back to Web Speech:', err);
      }
    }

    // Fallback: Web Speech API synthesis
    fallbackBrowserSpeech(text, lang);
  }, [isMuted, language, config.volume, unlockAudio, fallbackBrowserSpeech, resumeListeningLoop]);

  // Execute or Dispatch Action locally & on server
  const handleActionExecution = useCallback((
    actionId: GiniActionId, 
    params: Record<string, any>, 
    executionResult?: any
  ) => {
    setLastActionResult({ actionId, params, executionResult });

    switch (actionId) {
      case 'conversational_response': {
        break;
      }
      case 'navigate_route': {
        if (params.path && onNavigateRoute) {
          onNavigateRoute(params.path);
        }
        break;
      }
      case 'search_products': {
        if (onSearchCatalog) {
          onSearchCatalog(params);
        }
        break;
      }
      case 'open_product': {
        if (executionResult?.data?.product && onOpenProduct) {
          onOpenProduct(executionResult.data.product);
        }
        break;
      }
      case 'select_variant': {
        if (onSelectVariant) {
          onSelectVariant(params.size, params.color, params.alsoAddToCart);
        }
        break;
      }
      case 'open_size_guide': {
        if (onOpenSizeGuide) {
          onOpenSizeGuide();
        }
        break;
      }
      case 'add_cart_item': {
        if (onAddToCart) {
          onAddToCart(params.quantity || 1, params.size, executionResult?.data?.targetProduct);
        }
        // Enable undo window
        setCanUndo(true);
        setUndoCountdown(config.undoWindowSeconds || 8);
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        undoTimerRef.current = setInterval(() => {
          setUndoCountdown(prev => {
            if (prev <= 1) {
              clearInterval(undoTimerRef.current);
              setCanUndo(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        break;
      }
      case 'update_cart_item': {
        if (onUpdateCartQty) {
          onUpdateCartQty(params.quantity || 2);
        }
        break;
      }
      case 'remove_cart_item': {
        if (onRemoveCartItem) {
          onRemoveCartItem();
        }
        break;
      }
      case 'apply_coupon': {
        if (onApplyCoupon && params.couponCode) {
          onApplyCoupon(params.couponCode);
        }
        break;
      }
      case 'open_checkout': {
        if (onOpenCheckout) {
          onOpenCheckout();
        }
        break;
      }
      case 'place_order': {
        if (onOrderConfirmed && executionResult?.data?.order) {
          onOrderConfirmed(executionResult.data.order);
        } else if (onOpenCheckout) {
          onOpenCheckout();
        }
        break;
      }
      case 'assistant_control': {
        if (params.control === 'stop' || params.control === 'cancel') {
          stopSpeech();
          setIsCallActive(false);
          setUiState('idle');
        } else if (params.control === 'repeat') {
          if (turns.length > 0) {
            const lastGiniTurn = [...turns].reverse().find(t => t.speaker === 'gini');
            if (lastGiniTurn) {
              speakResponse(lastGiniTurn.transcript);
            }
          }
        }
        break;
      }
      default:
        break;
    }
  }, [
    onNavigateRoute, 
    onSearchCatalog, 
    onOpenProduct, 
    onSelectVariant, 
    onOpenSizeGuide, 
    onAddToCart, 
    onUpdateCartQty, 
    onRemoveCartItem, 
    onApplyCoupon, 
    onOpenCheckout, 
    onOrderConfirmed, 
    config.undoWindowSeconds, 
    stopSpeech, 
    turns, 
    speakResponse
  ]);

  // Submit a turn (Voice or Typed) to Server Intent Orchestrator
  const submitTurn = useCallback(async (transcriptText: string, audioBase64Payload?: string) => {
    const rawClean = (transcriptText || '').trim();
    if (!rawClean && !audioBase64Payload) {
      if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
        resumeListeningLoop(100);
      }
      return;
    }

    const normalizedTranscript = normalizeIndianVoiceTranscript(rawClean);

    isProcessingRef.current = true;
    setUiState('processing');
    setPartialTranscript('');
    setFinalTranscript('');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Safety watchdog: ensure processing never locks up longer than 4.5 seconds
    const processingSafetyTimer = setTimeout(() => {
      if (isProcessingRef.current && !isSpeakingRef.current) {
        console.warn('[Gini] Processing watchdog timeout safety unlocked');
        isProcessingRef.current = false;
        if (isCallActiveRef.current) {
          setUiState('listening');
          resumeListeningLoop(150);
        } else {
          setUiState('idle');
        }
      }
    }, 4500);

    // Stop current recognition while processing server turn
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;

    const currentSessId = await initSession();

    // Add user turn to UI immediately
    const userTurn: GiniTurn = {
      id: `turn-${Date.now()}`,
      sessionId: currentSessId,
      turnIndex: turns.length + 1,
      timestamp: new Date().toISOString(),
      speaker: 'customer',
      transcript: normalizedTranscript || rawClean || 'Spoken Audio',
      language,
    };
    setTurns(prev => [...prev, userTurn]);

    try {
      const res = await fetch(`${API_BASE_URL}/gini/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessId,
          transcript: normalizedTranscript || rawClean,
          language,
          context: {
            currentRoute: context?.currentRoute || '/',
            cartItemCount: context?.cartItemCount || 0,
            cartGrandTotal: context?.cartGrandTotal || 0,
            selectedProduct: context?.selectedProduct,
            selectedAddress: context?.selectedAddress,
            isAuthenticated: context?.isAuthenticated || false,
            customerId: context?.customerId,
          }
        })
      });

      clearTimeout(processingSafetyTimer);

      if (res.ok) {
        const data = await res.json();
        const responseCopy = language === 'hi-IN' && data.hindiSpeechResponse ? data.hindiSpeechResponse : data.speechResponse;
        const suggestedProds = data.suggestedProducts || data.executionResult?.data?.suggestedProducts || [];

        // Synchronize storefront catalog with AI recommended products immediately
        if (suggestedProds && suggestedProds.length > 0 && onProductsUpdated) {
          onProductsUpdated(suggestedProds, data.parameters);
        }
        if ((data.proposedAction === 'search_products' || data.parameters?.query || data.parameters?.maxPrice || data.parameters?.category || data.parameters?.fabric || data.parameters?.color || data.parameters?.size) && onSearchCatalog) {
          onSearchCatalog(data.parameters || {});
        }

        // Execute action (opening cart, navigation, size guide, variant select) immediately
        if (data.policyResult === 'allowed' && data.proposedAction) {
          handleActionExecution(data.proposedAction, data.parameters, data.executionResult);
        }

        // Record assistant turn
        const assistantTurn: GiniTurn = {
          id: `turn-${Date.now() + 1}`,
          sessionId: currentSessId,
          turnIndex: turns.length + 2,
          timestamp: new Date().toISOString(),
          speaker: 'gini',
          transcript: responseCopy,
          language,
          actionProposed: data.proposedAction,
          actionParameters: data.parameters,
          policyResult: data.policyResult,
          suggestedProducts: suggestedProds,
          suggestedChips: data.suggestedChips || [],
          executionResult: data.executionResult,
          latencyMs: data.latencyMs
        };
        setTurns(prev => [...prev, assistantTurn]);

        if (data.policyResult === 'requires_confirmation' && data.pendingConfirmation) {
          setPendingConfirmation(data.pendingConfirmation);
          setUiState('confirmation');
          speakResponse(responseCopy, language, data.audioBase64, data.audioContentType);
        } else {
          setPendingConfirmation(null);
          speakResponse(responseCopy, language, data.audioBase64, data.audioContentType);
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      clearTimeout(processingSafetyTimer);
      console.warn('Turn submission failed:', err);
      const fallbackText = 'I am right here with you! Would you like to check pure cotton kurtis under ₹2,000, festive Anarkalis, or view your cart?';
      const errTurn: GiniTurn = {
        id: `turn-${Date.now() + 1}`,
        sessionId: currentSessId,
        turnIndex: turns.length + 2,
        timestamp: new Date().toISOString(),
        speaker: 'gini',
        transcript: fallbackText,
        language,
        suggestedChips: [
          '🌸 Cotton Kurtis under ₹2,000',
          '✨ Festive Anarkali Sets',
          '📏 Kurti Size Chart Guide',
          '🛒 View Cart & Checkout'
        ]
      };
      setTurns(prev => [...prev, errTurn]);
      speakResponse(fallbackText, language);
    }
  }, [
    initSession, 
    turns.length, 
    language, 
    context, 
    speakResponse, 
    handleActionExecution,
    onProductsUpdated,
    onSearchCatalog,
    resumeListeningLoop
  ]);

  // Greeting trigger on assistant activation
  const triggerGreeting = useCallback(async (forcedLang?: 'en-IN' | 'hi-IN') => {
    const targetLang = forcedLang || language;
    const greetingText = targetLang === 'hi-IN'
      ? (config.hindiGreeting || 'नमस्ते! आप कैसे हैं? मैं गिनी हूँ, आपकी AI शॉपिंग असिस्टेंट। आज मैं आपकी क्या मदद कर सकती हूँ?')
      : (config.greeting || 'Namaste! Hello, how are you? I am Gini, your AI shopping assistant. How can I help you today? Are you looking for daily wear kurtis, festive wear, or help with sizing?');

    const currentSessId = await initSession();

    let serverAudioBase64 = '';
    let serverAudioContentType = 'audio/wav';

    try {
      const ttsRes = await fetch(`${API_BASE_URL}/gini/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: greetingText,
          language: targetLang,
          voiceName: 'Sulafat',
          speakingRate: config.speakingRate || 1.0,
        })
      });
      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        if (ttsData.audioBase64) {
          serverAudioBase64 = ttsData.audioBase64;
          serverAudioContentType = ttsData.audioContentType || 'audio/wav';
        }
      }
    } catch (e) {
      console.warn('[Greeting TTS fetch warn]:', e);
    }

    const greetingTurn: GiniTurn = {
      id: `turn-greeting-${Date.now()}`,
      sessionId: currentSessId,
      turnIndex: 1,
      timestamp: new Date().toISOString(),
      speaker: 'gini',
      transcript: greetingText,
      language: targetLang,
      intent: 'greeting',
      suggestedProducts: [],
      suggestedChips: [
        '🌸 Cotton Kurtis under ₹2,000',
        '✨ Festive Anarkali Sets',
        '💎 Handcrafted Chikankari',
        '📏 Kurti Size Chart Guide',
        '🛒 View Cart & Checkout'
      ]
    };

    setTurns([greetingTurn]);
    setCurrentSpeechText(greetingText);
    setIsCallActive(true);
    isCallActiveRef.current = true;
    speakResponse(greetingText, targetLang, serverAudioBase64, serverAudioContentType);
  }, [config.hindiGreeting, config.greeting, config.speakingRate, initSession, language, speakResponse]);

  // Preload and register speech synthesis voices as soon as browser engine mounts
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const preloadVoices = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {}
    };
    preloadVoices();
    try {
      window.speechSynthesis.onvoiceschanged = preloadVoices;
    } catch {}
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.onvoiceschanged = null;
        } catch {}
      }
    };
  }, []);

  // Global user interaction listener to unlock audio & voices immediately on first touch/click
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleFirstInteraction = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [unlockAudio]);

  // Auto-trigger greeting once when opening if turns list is empty
  useEffect(() => {
    if (isOpen && turns.length === 0 && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      triggerGreeting();
    }
  }, [isOpen, turns.length, triggerGreeting]);

  // Stop Listening & Process
  const stopListeningWithText = useCallback((recognizedText?: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Stop recognition safely without triggering old async onend
    if (recognitionRef.current) {
      const oldRec = recognitionRef.current;
      recognitionRef.current = null;
      oldRec.onstart = null;
      oldRec.onresult = null;
      oldRec.onerror = null;
      oldRec.onend = null;
      try {
        oldRec.abort();
      } catch {}
    }
    isListeningRef.current = false;

    if (recognizedText && recognizedText.trim()) {
      submitTurn(recognizedText.trim());
      return;
    }

    if (partialTranscript && partialTranscript.trim()) {
      submitTurn(partialTranscript.trim());
      return;
    }

    if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
      resumeListeningLoop(100);
    } else {
      setUiState('idle');
    }
  }, [partialTranscript, submitTurn, resumeListeningLoop]);

  const stopListening = useCallback(() => {
    stopListeningWithText();
  }, [stopListeningWithText]);

  // Start Listening with robust continuous microphone access
  const startListening = useCallback(async () => {
    if (config.state === 'paused' || config.state === 'maintenance' || config.state === 'off') {
      setUiState('maintenance');
      return;
    }

    if (isSpeakingRef.current || isProcessingRef.current) {
      return;
    }

    if (isListeningRef.current && recognitionRef.current) {
      return;
    }

    setIsCallActive(true);
    isCallActiveRef.current = true;
    setPartialTranscript('');
    setErrorMessage('');

    // 1. Initialize persistent MediaStream if not already active
    if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
      try {
        if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          mediaStreamRef.current = stream;
          micPermissionDeniedRef.current = false;
          setErrorMessage('');
        }
      } catch (micErr: any) {
        console.warn('[Microphone Stream Warning]:', micErr);
        if (micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError') {
          micPermissionDeniedRef.current = true;
          setErrorMessage('Microphone access blocked. Click "Allow Mic" or tap suggestions below.');
        }
      }
    }

    // 2. Start Web Speech API for instantaneous transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          const oldRec = recognitionRef.current;
          recognitionRef.current = null;
          oldRec.onstart = null;
          oldRec.onresult = null;
          oldRec.onerror = null;
          oldRec.onend = null;
          try { oldRec.abort(); } catch {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
          isListeningRef.current = true;
          setUiState('listening');
        };

        recognition.onresult = (event: any) => {
          if (isSpeakingRef.current || isProcessingRef.current) return;

          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (interim) {
            setPartialTranscript(interim);
            // Detect user pause (1.3s silence after speaking) and auto-submit
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (interim.trim() && !isProcessingRef.current && !isSpeakingRef.current) {
                stopListeningWithText(interim);
              }
            }, 1300);
          }

          if (final && final.trim()) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            setFinalTranscript(final);
            setPartialTranscript('');
            stopListeningWithText(final);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          isListeningRef.current = false;
          recognitionRef.current = null;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            micPermissionDeniedRef.current = true;
            setErrorMessage('Microphone access denied. Tap "Allow Mic" or type below.');
            setUiState('idle');
          } else {
            // Non-fatal error (no-speech, aborted, network, audio-capture): Keep the call alive!
            if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current && !micPermissionDeniedRef.current) {
              resumeListeningLoop(150);
            }
          }
        };

        recognition.onend = () => {
          isListeningRef.current = false;
          recognitionRef.current = null;
          // When recognition ends due to browser timeout: keep call alive and restart!
          if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current && !micPermissionDeniedRef.current) {
            resumeListeningLoop(100);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (recErr) {
        console.warn('SpeechRecognition start failed:', recErr);
        // Retry if start threw a transient error
        if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current && !micPermissionDeniedRef.current) {
          resumeListeningLoop(300);
        }
      }
    }

    isListeningRef.current = true;
    setUiState('listening');
  }, [config.state, language, resumeListeningLoop, stopListeningWithText]);

  // Keep ref updated
  startListeningRef.current = startListening;

  // Active call keep-alive heartbeat: ensures mic never stops until user clicks End Call
  useEffect(() => {
    if (!isCallActive) return;
    const heartbeat = setInterval(() => {
      if (
        isCallActiveRef.current &&
        !micPermissionDeniedRef.current &&
        !isSpeakingRef.current &&
        !isProcessingRef.current &&
        !isListeningRef.current &&
        startListeningRef.current
      ) {
        startListeningRef.current().catch(() => {});
      }
    }, 1500);
    return () => clearInterval(heartbeat);
  }, [isCallActive]);

  // Grant Consent & Request Mic directly
  const grantConsent = useCallback(async () => {
    setHasConsent(true);
    localStorage.setItem('gini_consent_granted', 'true');
    setErrorMessage('');
    micPermissionDeniedRef.current = false;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        mediaStreamRef.current = stream;
      }
    } catch (err: any) {
      console.warn('[Grant Consent Mic]:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        micPermissionDeniedRef.current = true;
        setErrorMessage('Microphone access denied. Tap "Allow Mic" or type below.');
        return;
      }
    }
    startListening();
  }, [startListening]);

  // End Call Completely (explicit user hang up)
  const endCall = useCallback(() => {
    hasGreetedRef.current = false;
    setIsCallActive(false);
    isCallActiveRef.current = false;
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    isListeningRef.current = false;

    if (speechWatchdogTimerRef.current) clearTimeout(speechWatchdogTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    stopSpeech();
    if (recognitionRef.current) {
      const oldRec = recognitionRef.current;
      recognitionRef.current = null;
      oldRec.onstart = null;
      oldRec.onresult = null;
      oldRec.onerror = null;
      oldRec.onend = null;
      try { oldRec.abort(); } catch {}
    }

    setAudioLevel(0);
    setUiState('idle');
  }, [stopSpeech]);

  // Confirm or Cancel L3 Pending Action
  const resolveConfirmation = useCallback(async (decision: 'confirmed' | 'rejected') => {
    if (!pendingConfirmation) return;

    try {
      const res = await fetch(`${API_BASE_URL}/gini/confirmations/${pendingConfirmation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          decisionMethod: 'touch'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPendingConfirmation(null);
        setUiState('idle');

        if (decision === 'confirmed') {
          handleActionExecution(pendingConfirmation.actionId, pendingConfirmation.parameters, data.executionResult);
          speakResponse(
            language === 'hi-IN' ? 'आपका अनुरोध पूरा कर दिया गया है।' : 'Action confirmed and executed successfully.',
            language
          );
        } else {
          speakResponse(
            language === 'hi-IN' ? 'अनुरोध रद्द कर दिया गया।' : 'Action has been cancelled.',
            language
          );
        }
      }
    } catch (e) {
      console.warn('Confirmation resolve error:', e);
      setPendingConfirmation(null);
      setUiState('idle');
    }
  }, [pendingConfirmation, handleActionExecution, speakResponse, language]);

  // Undo Last Action
  const undoLastAction = useCallback(() => {
    if (!canUndo) return;
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    setCanUndo(false);
    setUndoCountdown(0);

    if (onRemoveCartItem) {
      onRemoveCartItem();
    }
    speakResponse(
      language === 'hi-IN' ? 'पिछली क्रिया पूर्ववत कर दी गई।' : 'Last item removed from your cart.',
      language
    );
  }, [canUndo, onRemoveCartItem, speakResponse, language]);

  // Toggle language
  const toggleLanguage = useCallback((newLang: 'en-IN' | 'hi-IN') => {
    setLanguage(newLang);
    stopSpeech();
    speakResponse(
      newLang === 'hi-IN' ? 'नमस्ते! मैं आपकी पसंदीदा कुर्तियां खोजने में कैसे मदद करूँ?' : 'Hi! What style or occasion are you shopping for today?',
      newLang
    );
  }, [speakResponse, stopSpeech]);

  return {
    isOpen,
    setIsOpen,
    config,
    uiState,
    hasConsent,
    language,
    toggleLanguage,
    turns,
    partialTranscript,
    currentSpeechText,
    pendingConfirmation,
    lastActionResult,
    errorMessage,
    isMuted,
    setIsMuted,
    canUndo,
    undoCountdown,
    audioLevel,
    isCallActive,
    startListening,
    stopListening,
    endCall,
    grantConsent,
    submitTurn,
    speakResponse,
    unlockAudio,
    resolveConfirmation,
    undoLastAction,
    stopSpeech,
    refreshConfig
  };
}
