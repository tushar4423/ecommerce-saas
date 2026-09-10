import { useState, useEffect, useRef, useCallback } from 'react';
import { GiniTurn, GiniPendingConfirmation } from '../types/gini';
import { Product } from '../types';

export type LiveCallState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'interrupted'
  | 'error'
  | 'ended';

export interface UseGeminiLiveCallProps {
  language: 'en-IN' | 'hi-IN';
  context?: {
    currentRoute: string;
    cartItemCount: number;
    cartGrandTotal: number;
    selectedProduct?: any;
    selectedAddress?: any;
    isAuthenticated: boolean;
    customerId?: string;
  };
  onNavigateRoute?: (path: string) => void;
  onSearchCatalog?: (params: Record<string, any>) => void;
  onProductsUpdated?: (products: any[], params?: Record<string, any>) => void;
  onOpenProduct?: (product: any) => void;
  onAddToCart?: (qty: number, size?: string, targetProduct?: any) => void;
  onOpenCheckout?: () => void;
  onOrderConfirmed?: (order: any) => void;
}

// Convert Float32Array to 16-bit PCM Little-Endian Base64 string
function float32To16BitPCMBase64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    // Clamp to -1.0 to 1.0
    const s = Math.max(-1, Math.min(1, input[i]));
    // Convert to 16-bit signed integer
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert 24kHz Base64 PCM chunk to AudioBuffer for playback
function base64PCM24kToAudioBuffer(
  audioCtx: AudioContext,
  base64Data: string
): AudioBuffer | null {
  try {
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const dataView = new DataView(bytes.buffer);
    const numSamples = Math.floor(len / 2);
    const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      // Normalize to -1.0 to +1.0
      channelData[i] = int16 / 32768.0;
    }
    return audioBuffer;
  } catch (err) {
    console.warn('[PCM Decoding Error]:', err);
    return null;
  }
}

export function useGeminiLiveCall({
  language,
  context,
  onNavigateRoute,
  onSearchCatalog,
  onProductsUpdated,
  onOpenProduct,
  onAddToCart,
  onOpenCheckout,
  onOrderConfirmed,
}: UseGeminiLiveCallProps) {
  const [callState, setCallState] = useState<LiveCallState>('idle');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [aiAudioLevel, setAiAudioLevel] = useState(0);
  const [turns, setTurns] = useState<GiniTurn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [currentAiSpeechText, setCurrentAiSpeechText] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState('Aoede');

  // Refs for Web Audio and WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const currentAiTurnTranscriptRef = useRef<string>('');
  const isCallActiveRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);

  // Stop all active and scheduled audio output sources (Instant Interruption Cutoff)
  const stopAllAiAudio = useCallback(() => {
    try {
      activeSourceNodesRef.current.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch {}
      });
      activeSourceNodesRef.current = [];
      if (outputAudioCtxRef.current) {
        nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
      }
      isSpeakingRef.current = false;
      setAiAudioLevel(0);
    } catch (err) {
      console.warn('[Stop AI Audio Error]:', err);
    }
  }, []);

  // Play incoming 24kHz PCM audio chunk seamlessly with jitter-free timeline scheduling
  const queueAudioChunk = useCallback(
    (base64Data: string) => {
      if (isMuted) return;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
          outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
        }
        const ctx = outputAudioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const buffer = base64PCM24kToAudioBuffer(ctx, base64Data);
        if (!buffer) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Analyser for AI output visualizer
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        // Schedule playback sequentially without gap
        const now = ctx.currentTime;
        if (nextStartTimeRef.current < now) {
          nextStartTimeRef.current = now + 0.04; // 40ms safety buffer for network jitter
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;

        activeSourceNodesRef.current.push(source);
        isSpeakingRef.current = true;
        setCallState('speaking');
        setAiAudioLevel(75);

        source.onended = () => {
          activeSourceNodesRef.current = activeSourceNodesRef.current.filter((s) => s !== source);
          if (activeSourceNodesRef.current.length === 0) {
            isSpeakingRef.current = false;
            setAiAudioLevel(0);
            if (isCallActiveRef.current) {
              setCallState('listening');
            }
          }
        };
      } catch (err) {
        console.warn('[Queue Audio Chunk Error]:', err);
      }
    },
    [isMuted]
  );

  // End the live call explicitly
  const endCall = useCallback(() => {
    isCallActiveRef.current = false;
    stopAllAiAudio();

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'end' }));
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    setIsLiveConnected(false);
    setCallState('ended');
    setMicLevel(0);
    setAiAudioLevel(0);
  }, [stopAllAiAudio]);

  // Start the live bidirectional call
  const startLiveCall = useCallback(async () => {
    if (isCallActiveRef.current) return;
    setCallState('connecting');
    setErrorMessage('');
    setInterimText('');
    stopAllAiAudio();

    try {
      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup AudioContext for 16kHz sampling
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      // Output AudioContext (24kHz for Gemini Live output)
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      // 3. Connect WebSocket to Server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/gini/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Gemini Live Client] WebSocket connected to server');
        setIsLiveConnected(true);
        isCallActiveRef.current = true;
        setCallState('listening');

        // Send init message with preserved turns context for session resumption
        ws.send(
          JSON.stringify({
            type: 'init',
            sessionId: `sess-live-${Date.now()}`,
            customerId: context?.customerId,
            language,
            currentRoute: context?.currentRoute || '/',
            cartItemCount: context?.cartItemCount || 0,
            cartGrandTotal: context?.cartGrandTotal || 0,
            selectedProduct: context?.selectedProduct,
            isAuthenticated: context?.isAuthenticated || false,
            previousTurns: turns.slice(-10), // Resume last 10 dialogue turns for seamless context continuity
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Session Ready
          if (msg.type === 'session_ready') {
            setActiveVoiceName(msg.voiceName || 'Aoede');
            setCallState('listening');
          }

          // Interruption / Barge-in notification from Gemini
          if (msg.type === 'interrupted') {
            console.log('[Gemini Live] Interruption signal received: stopping audio playback.');
            stopAllAiAudio();
            setCallState('interrupted');
            setTimeout(() => {
              if (isCallActiveRef.current) setCallState('listening');
            }, 100);
          }

          // Audio Chunk (24kHz PCM from Gemini Live)
          if (msg.type === 'audio_chunk' && msg.pcm24k) {
            queueAudioChunk(msg.pcm24k);
          }

          // Transcript Chunk
          if (msg.type === 'transcript_chunk' && msg.text) {
            currentAiTurnTranscriptRef.current += msg.text;
            setCurrentAiSpeechText(currentAiTurnTranscriptRef.current);
          }

          // Turn complete
          if (msg.type === 'turn_complete') {
            if (currentAiTurnTranscriptRef.current.trim()) {
              const fullText = currentAiTurnTranscriptRef.current.trim();
              const turn: GiniTurn = {
                id: `turn-${Date.now()}`,
                sessionId: context?.customerId || 'live-sess',
                turnIndex: turns.length + 1,
                timestamp: new Date().toISOString(),
                speaker: 'gini',
                transcript: fullText,
                language,
              };
              setTurns((prev) => [...prev, turn]);
              currentAiTurnTranscriptRef.current = '';
            }
          }

          // Tool execution from server
          if (msg.type === 'tool_executed') {
            const { toolName, args, result } = msg;
            console.log(`[Client received tool execution] ${toolName}:`, result);

            if (toolName === 'searchProducts' && result?.products) {
              setRecommendedProducts(result.products);
              if (onProductsUpdated) {
                onProductsUpdated(result.products, args);
              }
            }

            if (toolName === 'addToCart' && result?.addedItem) {
              if (onAddToCart) {
                onAddToCart(result.addedItem.quantity || 1, result.addedItem.size, result.addedItem);
              }
            }

            if (toolName === 'navigateToPage' && result?.navigatedTo) {
              if (onNavigateRoute) {
                onNavigateRoute(result.navigatedTo);
              }
            }

            if (toolName === 'endCall') {
              setTimeout(() => {
                endCall();
              }, 1500);
            }
          }

          // Error handling
          if (msg.type === 'error') {
            console.warn('[Gemini Live Error]:', msg.message);
            setErrorMessage(msg.message);
          }
        } catch (err) {
          console.warn('[WS message error]:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS error]:', err);
        setErrorMessage('Live audio connection failed. Tap to reconnect.');
        setCallState('error');
      };

      ws.onclose = () => {
        console.log('[WS closed]');
        if (isCallActiveRef.current) {
          endCall();
        }
      };

      // 4. Setup Audio Processing Node to stream 16kHz PCM chunks
      const micSource = inputCtx.createMediaStreamSource(stream);
      // Use buffer size of 4096 (~250ms chunks at 16kHz)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isCallActiveRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate input volume energy
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const energyPercent = Math.min(100, Math.round(rms * 400));
        setMicLevel(energyPercent);

        // If customer speaks loudly while AI is outputting audio, trigger local fast-barge-in interruption cutoff
        if (energyPercent > 18 && isSpeakingRef.current) {
          console.log('[Fast Barge-in Local Detection]: Customer spoke, stopping AI output audio.');
          stopAllAiAudio();
          setCallState('listening');
        }

        // Convert float32 samples to 16-bit PCM base64 string
        const pcm16kBase64 = float32To16BitPCMBase64(inputData);

        // Stream PCM chunk to server WebSocket
        wsRef.current.send(
          JSON.stringify({
            type: 'audio_chunk',
            pcm16k: pcm16kBase64,
          })
        );
      };

      micSource.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('[Start Live Call Error]:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone in browser.'
          : 'Could not access microphone or live audio stream.'
      );
      setCallState('error');
    }
  }, [
    context,
    endCall,
    language,
    onAddToCart,
    onNavigateRoute,
    onProductsUpdated,
    queueAudioChunk,
    stopAllAiAudio,
    turns.length,
  ]);

  // Send typed text to the active live session
  const sendTextInput = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const clean = text.trim();
    wsRef.current.send(
      JSON.stringify({
        type: 'text_input',
        text: clean,
      })
    );
    const userTurn: GiniTurn = {
      id: `turn-${Date.now()}`,
      sessionId: 'live-user',
      turnIndex: turns.length + 1,
      timestamp: new Date().toISOString(),
      speaker: 'customer',
      transcript: clean,
      language,
    };
    setTurns((prev) => [...prev, userTurn]);
  }, [language, turns.length]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    callState,
    isLiveConnected,
    micLevel,
    aiAudioLevel,
    turns,
    interimText,
    currentAiSpeechText,
    recommendedProducts,
    errorMessage,
    isMuted,
    activeVoiceName,
    startLiveCall,
    endCall,
    sendTextInput,
    setIsMuted,
    stopAllAiAudio,
  };
}
