import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import { GiniSettings, GiniTurn, GiniPendingConfirmation } from '../../types/gini';
import { GiniUIState } from '../../hooks/useGiniVoice';

interface GiniVoiceAssistantProps {
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
  lastActionResult: any;
  errorMessage: string;
  isMuted: boolean;
  onToggleMute: () => void;
  canUndo: boolean;
  undoCountdown: number;
  audioLevel?: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onGrantConsent: () => void;
  onSubmitTurn: (text: string) => void;
  onResolveConfirmation: (decision: 'confirmed' | 'rejected') => void;
  onUndoLastAction: () => void;
  onStopSpeech: () => void;
  onSpeakResponse?: (text: string, lang?: 'en-IN' | 'hi-IN') => void;
  onUnlockAudio?: () => void;
}

export const GiniVoiceAssistant: React.FC<GiniVoiceAssistantProps> = ({
  isOpen,
  onClose,
  config,
  uiState,
  hasConsent,
  language,
  onToggleLanguage,
  turns,
  partialTranscript,
  currentSpeechText,
  pendingConfirmation,
  lastActionResult,
  errorMessage,
  isMuted,
  onToggleMute,
  canUndo,
  undoCountdown,
  audioLevel = 0,
  onStartListening,
  onStopListening,
  onGrantConsent,
  onSubmitTurn,
  onResolveConfirmation,
  onUndoLastAction,
  onStopSpeech,
  onSpeakResponse,
  onUnlockAudio
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript on new turn
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, partialTranscript, pendingConfirmation]);

  if (!isOpen) return null;

  const isRight = config.launcherPosition !== 'bottom_left';
  const isListening = uiState === 'listening';
  const isProcessing = uiState === 'processing';
  const isSpeaking = uiState === 'speaking';

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedInput.trim()) return;
    onSubmitTurn(typedInput.trim());
    setTypedInput('');
  };

  const suggestionChips = [
    { label: 'Red cotton kurtis under ₹2,000', query: 'Show red cotton kurtis under 2000 rupees' },
    { label: 'Anarkali Suits', query: 'Show Anarkali suits' },
    { label: 'Where is my order?', query: 'Where is my last order?' },
    { label: 'Standard Size Chart', query: 'Show size guide' },
    { label: 'Apply coupon VEDAAYA20', query: 'Apply VEDAAYA20 coupon' },
  ];

  return (
    <div
      id="gini-assistant-overlay"
      className="fixed inset-0 z-50 flex justify-end md:bg-black/30 md:backdrop-blur-xs transition-opacity duration-300"
    >
      {/* Background click dismiss for desktop */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Slide-over Drawer (Desktop) / Bottom Sheet (Mobile) */}
      <div
        id="gini-assistant-drawer"
        className={`bg-[#FAF6F0] w-full md:max-w-md h-full md:h-[calc(100vh-24px)] md:my-3 md:mr-3 md:rounded-3xl shadow-2xl flex flex-col border border-[#EADBDA] overflow-hidden transition-all duration-300 ${
          isRight ? 'md:ml-auto' : 'md:mr-auto md:ml-3'
        }`}
        style={{
          width: window.innerWidth >= 768 ? `${config.drawerWidth || 440}px` : '100%',
        }}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#7B2435] via-[#5C1926] to-[#4A121E] text-white p-4 shrink-0 flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide font-serif text-[#FAF6F0]">
                  {config.displayName || 'Gini Voice Assistant'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D4AF37]/30 text-amber-200 border border-[#D4AF37]/40">
                  v{config.version || 1}
                </span>
              </div>
              <p className="text-[11px] text-amber-100/75">
                Google Chirp 3 & Vertex Sulafat Voice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onToggleLanguage('en-IN')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  language === 'en-IN' ? 'bg-[#D4AF37] text-neutral-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onToggleLanguage('hi-IN')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  language === 'hi-IN' ? 'bg-[#D4AF37] text-neutral-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Mute/Unmute Toggle */}
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="gini-close-drawer-btn"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Voice Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Undo Notification Banner */}
        {canUndo && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between animate-fadeIn shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Item added to shopping bag.</span>
            </div>
            <button
              type="button"
              onClick={onUndoLastAction}
              className="flex items-center gap-1 text-xs font-black text-[#7B2435] bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs hover:bg-amber-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo ({undoCountdown}s)</span>
            </button>
          </div>
        )}

        {/* Main Body Area */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Permission / Consent State */}
          {!hasConsent ? (
            <div className="p-5 bg-white rounded-2xl border border-[#EADBDA] shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-[#7B2435]">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 font-serif mb-1">
                  Enable Voice Shopping with Gini
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {config.consentCopy ||
                    'Gini uses Google Cloud Speech-to-Text V2 (Chirp 3) and Gemini AI to understand shopping navigation, size selection, and cart actions. Audio is processed transiently and never stored by default.'}
                </p>
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl text-[11px] text-neutral-500 text-left flex items-start gap-2 border border-neutral-200">
                <ShieldCheck className="w-4 h-4 text-[#7B2435] shrink-0 mt-0.5" />
                <span>
                  All actions strictly follow server verification. High-impact actions like placing orders require your explicit spoken or touch confirmation.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Not Now
                </button>
                <button
                  type="button"
                  id="gini-grant-consent-btn"
                  onClick={onGrantConsent}
                  className="flex-1 py-2.5 rounded-xl bg-[#7B2435] text-white text-xs font-bold hover:bg-[#5C1926] shadow-md transition cursor-pointer"
                >
                  Allow Microphone
                </button>
              </div>
            </div>
          ) : uiState === 'maintenance' ? (
            /* Maintenance State */
            <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-800">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900">Voice Assistant Paused</h4>
              <p className="text-xs text-neutral-600">
                {config.maintenanceMessage || 'Gini voice assistant is undergoing brief routine calibration. You can continue shopping manually.'}
              </p>
            </div>
          ) : (
            /* Active Conversation View */
            <>
              {/* Initial Gini Greeting if turns array is empty */}
              {turns.length === 0 && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#7B2435] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-[#EADBDA] rounded-2xl rounded-tl-none p-3.5 shadow-xs max-w-[85%]">
                    <p className="text-xs font-medium text-neutral-800 leading-relaxed">
                      {language === 'hi-IN' ? config.hindiGreeting : config.greeting}
                    </p>
                  </div>
                </div>
              )}

              {/* Conversation History Turns */}
              {turns.map((turn, idx) => {
                const isCustomer = turn.speaker === 'customer';
                return (
                  <div
                    key={turn.id || idx}
                    className={`flex gap-2.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCustomer && (
                      <div className="w-7 h-7 rounded-full bg-[#7B2435] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl shadow-xs max-w-[85%] text-xs leading-relaxed ${
                        isCustomer
                          ? 'bg-[#7B2435] text-white rounded-tr-none'
                          : 'bg-white border border-[#EADBDA] text-neutral-800 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold ${isCustomer ? 'text-amber-200' : 'text-[#7B2435]'}`}>
                          {isCustomer ? 'You (Voice)' : 'Gini'}
                        </span>
                        {!isCustomer && onSpeakResponse && (
                          <button
                            type="button"
                            onClick={() => {
                              onUnlockAudio?.();
                              onSpeakResponse(turn.transcript, (turn.language as any) || language);
                            }}
                            className="p-1 rounded hover:bg-stone-100 text-[#7B2435] transition cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                            title="Play Voice"
                          >
                            <Volume2 className="w-3 h-3 text-[#7B2435]" />
                            <span>Play Voice</span>
                          </button>
                        )}
                      </div>
                      <p>{turn.transcript}</p>
                      {turn.actionProposed && (
                        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#7B2435]">
                            Action: {turn.actionProposed.replace(/_/g, ' ')}
                          </span>
                          {turn.latencyMs && (
                            <span className="text-neutral-400">
                              {turn.latencyMs.total}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Live Partial Transcript while listening */}
              {isListening && (
                <div className="flex gap-2.5 justify-end animate-pulse">
                  <div className="bg-[#7B2435]/80 text-white/90 p-3 rounded-2xl rounded-tr-none text-xs italic shadow-xs">
                    {partialTranscript || 'Listening... (Speak now)'}
                  </div>
                </div>
              )}

              {/* Processing Spinner */}
              {isProcessing && (
                <div className="flex gap-2.5 items-center text-xs text-[#7B2435] font-bold p-3 bg-white rounded-xl border border-[#EADBDA] shadow-xs w-fit">
                  <div className="w-4 h-4 border-2 border-[#7B2435] border-t-transparent rounded-full animate-spin" />
                  <span>Gini is understanding your request...</span>
                </div>
              )}

              {/* High-Impact L3 Confirmation Modal Card */}
              {pendingConfirmation && (
                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-[#D4AF37] shadow-lg space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Action Confirmation Required</span>
                  </div>
                  <p className="text-xs text-neutral-800 font-medium leading-relaxed">
                    {pendingConfirmation.displaySummary}
                  </p>
                  <p className="text-[11px] text-neutral-500 italic">
                    Say &quot;Confirm order&quot; / &quot;Cancel&quot; or use the buttons below.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onResolveConfirmation('rejected')}
                      className="flex-1 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="gini-confirm-action-btn"
                      onClick={() => onResolveConfirmation('confirmed')}
                      className="flex-1 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-xs transition cursor-pointer"
                    >
                      Confirm Action
                    </button>
                  </div>
                </div>
              )}

              {/* Suggestion Chips */}
              {turns.length === 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-neutral-500 block uppercase tracking-wider">
                    Try Saying:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSubmitTurn(chip.query)}
                        className="px-3 py-1.5 bg-white hover:bg-[#7B2435] hover:text-white text-neutral-700 border border-[#EADBDA] rounded-full text-xs font-medium transition cursor-pointer shadow-xs text-left"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Audio Visualizer & Control Deck */}
        <div className="p-4 bg-white border-t border-[#EADBDA] shrink-0 space-y-3">
          {/* Animated Waveform / Listening Orb */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isListening ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </>
                ) : isSpeaking ? (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-300"></span>
                )}
              </span>
              <span className="text-xs font-bold text-neutral-600">
                {isListening ? 'Listening (Google Chirp 3)...' : isSpeaking ? 'Speaking (Chirp 3 HD)...' : 'Ready'}
              </span>
            </div>

            {/* Stop Speech / Cancel Button */}
            {isSpeaking && (
              <button
                type="button"
                onClick={onStopSpeech}
                className="text-[11px] font-bold text-[#7B2435] hover:underline cursor-pointer"
              >
                Stop speaking
              </button>
            )}
          </div>

          {/* Central Voice Button & Waveform Container */}
          <div className="flex flex-col items-center justify-center py-1 gap-2">
            {isListening && (
              <div className="flex items-center gap-1 h-8 px-4 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-inner">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                  return (
                    <span
                      key={bar}
                      className={`w-1 bg-gradient-to-t from-amber-600 to-amber-400 rounded-full animate-soundwave-${bar}`}
                      style={{ minHeight: '6px' }}
                    />
                  );
                })}
              </div>
            )}

            <button
              type="button"
              id="gini-mic-toggle-btn"
              onClick={isListening ? onStopListening : onStartListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 cursor-pointer ${
                isListening
                  ? 'bg-amber-600 ring-8 ring-amber-200 animate-pulse scale-105'
                  : 'bg-gradient-to-tr from-[#7B2435] to-[#9C3044] hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(123,36,53,0.35)]'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-[#FAF6F0]" />
              )}
            </button>
          </div>

          {/* Text Input Fallback */}
          {config.allowTextFallback && (
            <form onSubmit={handleSendText} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                id="gini-text-fallback-input"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Or type a shopping command..."
                className="flex-1 px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#7B2435]/20 focus:border-[#7B2435]"
              />
              <button
                type="submit"
                id="gini-send-text-btn"
                disabled={!typedInput.trim()}
                className="p-2.5 bg-[#7B2435] text-white rounded-xl hover:bg-[#5C1926] disabled:opacity-40 transition cursor-pointer"
                title="Send Command"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
