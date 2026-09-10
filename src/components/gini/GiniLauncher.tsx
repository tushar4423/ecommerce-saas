import React from 'react';
import { Sparkles, Mic, Volume2, ShieldCheck } from 'lucide-react';
import { GiniSettings } from '../../types/gini';
import { GiniUIState } from '../../hooks/useGiniVoice';

interface GiniLauncherProps {
  config: GiniSettings;
  uiState: GiniUIState;
  isOpen: boolean;
  onOpen: () => void;
}

export const GiniLauncher: React.FC<GiniLauncherProps> = ({
  config,
  uiState,
  isOpen,
  onOpen
}) => {
  // If explicitly turned off, do not render
  if (config.state === 'off' || isOpen) {
    return null;
  }

  const isListening = uiState === 'listening';
  const isSpeaking = uiState === 'speaking';
  const isRight = config.launcherPosition !== 'bottom_left';

  return (
    <div
      id="gini-voice-launcher"
      className="fixed z-40 transition-all duration-300 pointer-events-auto"
      style={{
        bottom: `${config.launcherOffsetY || 24}px`,
        [isRight ? 'right' : 'left']: `${config.launcherOffsetX || 24}px`,
      }}
    >
      <button
        type="button"
        id="gini-launcher-btn"
        onClick={onOpen}
        aria-label="Open Gini Voice Shopping Assistant"
        className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-[#D4AF37]/40 ${
          isListening
            ? 'animate-pulse ring-4 ring-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.6)]'
            : isSpeaking
            ? 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
            : 'shadow-[0_8px_25px_rgba(123,36,53,0.35)]'
        }`}
        style={{
          background: 'linear-gradient(135deg, #7B2435 0%, #4A121E 100%)',
        }}
      >
        {/* Animated Glow Halo */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] opacity-60 blur-xs group-hover:opacity-100 transition animate-pulse" />

        {/* Icon Container with Google Astra Multicolor Gradient */}
        <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] p-0.5 flex items-center justify-center shadow-md">
          <div className="w-full h-full bg-[#120F16] rounded-full flex items-center justify-center text-[#D4AF37]">
            {isListening ? (
              <Mic className="w-4 h-4 text-amber-300 animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            )}
          </div>
        </div>

        {/* Label */}
        <div className="relative z-10 flex flex-col items-start pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wide font-serif text-[#FAF6F0]">
              Gini Astra
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#D4AF37]/30 text-amber-200 border border-[#D4AF37]/40">
              Sulafat S2S
            </span>
          </div>
          <span className="text-[10px] text-[#FAF6F0]/90 font-medium whitespace-nowrap">
            {isListening ? 'Listening Live...' : isSpeaking ? 'Sulafat Speaking...' : (config.launcherLabel || 'Speech-to-Speech Shopping')}
          </span>
        </div>

        {/* Status Dot */}
        <span className="relative z-10 flex h-2 w-2">
          {isListening ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          )}
        </span>
      </button>
    </div>
  );
};
