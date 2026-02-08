import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const VOICE_BACKEND_URL = 'http://localhost:3002/voice';
// const SAMPLE_RATE = 16000; // Unused, we use context sample rate

export const useVoiceAgent = (interviewId?: string, token?: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [aiState, setAiState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
    const [transcript, setTranscript] = useState<string>('');
    const [lastAiText, setLastAiText] = useState<string>('');

    const socketRef = useRef<Socket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);

    // Audio Queue for playback (Future use for smoothing)
    // const audioQueueRef = useRef<{ buffer: AudioBuffer; duration: number }[]>([]); 
    // const isPlayingRef = useRef(false);

    // Initialize Socket
    useEffect(() => {
        if (!interviewId) return;

        const socket = io(VOICE_BACKEND_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: false,
        });

        socket.on('connect', () => {
            console.log('Voice Socket connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Voice Socket disconnected');
            setIsConnected(false);
            setIsRecording(false);
        });

        socket.on('ai_text', (text: string) => {
            setLastAiText(text);
            setAiState('speaking');
            setTranscript((prev) => prev + '\nAI: ' + text);
        });

        socket.on('ai_audio', async (arrayBuffer: ArrayBuffer) => {
            if (!audioContextRef.current) return;
            // Decode raw PCM to AudioBuffer
            // Backend sends raw Int16 PCM (16kHz). 
            // Web Audio API decodeAudioData expects complete file formats (wav/mp3) usually, OR we manually create buffer.
            // Since we know format (16k, 1ch, int16), manual creation is faster/better for streaming.

            const int16Array = new Int16Array(arrayBuffer);
            const float32Array = new Float32Array(int16Array.length);

            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768; // Convert Int16 to Float32 [-1, 1]
            }

            const audioBuf = audioContextRef.current.createBuffer(1, float32Array.length, 16000); // 16kHz
            audioBuf.getChannelData(0).set(float32Array);

            schedulePlayback(audioBuf);
        });

        socket.on('enable_local_tts', (text: string) => {
            console.log('Using Local TTS Fallback:', text);
            if ('speechSynthesis' in window) {
                // Cancel previous
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                // Optional: Select a voice
                // const voices = window.speechSynthesis.getVoices();
                // utterance.voice = voices.find(v => v.lang.includes('en')) || null;

                utterance.rate = 1.0;
                utterance.pitch = 1.0;

                setAiState('speaking');
                utterance.onend = () => {
                    setAiState('idle');
                };

                window.speechSynthesis.speak(utterance);
            }
        });

        socket.on('ai_audio_end', () => {
            // Backend audio finished
            // We could setAiState('idle') here if we were sure audio buffer is empty
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close();
            }
        };
    }, [interviewId, token]);

    const schedulePlayback = (buffer: AudioBuffer) => {
        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        // Schedule slightly ahead to prevent glitches
        const latency = 0.05;
        const startTime = Math.max(ctx.currentTime + latency, nextStartTimeRef.current);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(startTime);

        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                setAiState('idle'); // Back to listening/idle when audio finishes
            }
        };
    };

    const startSession = async () => {
        if (!socketRef.current) return;
        socketRef.current.connect();

        // Wait for connection?
        // socketRef.current.emit('join_session', { interviewId, token });

        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000, // Try to request 16k to minimize resampling, but browser might ignore
            });

            await audioContextRef.current.audioWorklet.addModule('/recorder.worklet.js');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const worklet = new AudioWorkletNode(audioContextRef.current, 'recorder-processor');

            worklet.port.onmessage = (event) => {
                const inputFloat32 = event.data;
                // input is Float32 at Context sampleRate (could be 44.1/48k)
                // We typically need to downsample if context is not 16k.
                // Deepgram Nova-2 is robust, we can just send it, BUT we must tell Backend the rate?
                // For this MVP, let's assume we send raw Float32 and backend/Deepgram handles it?
                // Sending Float32 over socket is expensive (4 bytes).

                // Let's Convert to Int16 at least.
                const int16 = floatTo16BitPCM(inputFloat32);

                // Emit chunk
                if (socketRef.current?.connected) {
                    socketRef.current.emit('audio_chunk', int16);
                }
            };

            source.connect(worklet);
            worklet.connect(audioContextRef.current.destination); // Keep alive? mute?
            // Note: Don't connect to destination if you don't want self-monitoring!
            // Worklet needs to be connected to *something* or have output=0? 
            // Usually connecting to destination is fine if we output silence or muted. 
            // Or just keep the node reference. Chrome sometimes garbage collects disconnected nodes.
            // Safe bet: connect to a GainNode with gain 0, then to destination.

            const mute = audioContextRef.current.createGain();
            mute.gain.value = 0;
            worklet.connect(mute);
            mute.connect(audioContextRef.current.destination);

            workletNodeRef.current = worklet;
            setIsRecording(true);
            setAiState('listening');

            socketRef.current.emit('join_session', {
                interviewId,
                token,
                sampleRate: audioContextRef.current.sampleRate // Send actual sample rate
            });

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopSession = () => {
        setIsRecording(false);
        setAiState('idle');

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };

    const interrupt = () => {
        if (socketRef.current) {
            socketRef.current.emit('interrupt');
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };

    return {
        isConnected,
        isRecording,
        aiState,
        transcript,
        lastAiText,
        startSession,
        stopSession,
        interrupt
    };
};

// Helper: Float32 -> Int16
function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
}
