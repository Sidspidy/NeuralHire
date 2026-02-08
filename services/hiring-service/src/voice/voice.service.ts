import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import { createClient, DeepgramClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { ElevenLabsClient } from 'elevenlabs';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VoiceService {
    private readonly logger = new Logger(VoiceService.name);
    private openai: OpenAI;
    private deepgram: DeepgramClient;
    private elevenlabs: ElevenLabsClient;
    // Replace Redis with Map
    private sessionStore = new Map<string, string>(); // key -> serialized JSON

    constructor(private configService: ConfigService) {
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
        } else {
            this.logger.warn('OPENAI_API_KEY not set. Voice features will be disabled.');
        }

        const deepgramKey = this.configService.get<string>('DEEPGRAM_API_KEY');
        if (deepgramKey) {
            this.deepgram = createClient(deepgramKey);
        } else {
            this.logger.warn('DEEPGRAM_API_KEY not set.');
        }

        const elevenLabsKey = this.configService.get<string>('ELEVENLABS_API_KEY');
        if (elevenLabsKey) {
            this.elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsKey });
        } else {
            this.logger.warn('ELEVENLABS_API_KEY not set.');
        }
    }

    async initializeSession(clientId: string, token: string, interviewId: string, sampleRate: number = 16000) {
        // TODO: Verify JWT token
        // TODO: Check if interview is valid and belongs to candidate

        const sessionId = uuidv4();
        this.logger.log(`Initialized session ${sessionId} for client ${clientId} with rate ${sampleRate}`);

        // Store session state in Memory
        this.sessionStore.set(`session:${clientId}`, JSON.stringify({
            sessionId,
            interviewId,
            state: 'INITIALIZING',
            startTime: new Date().toISOString(),
            sampleRate,
        }));

        // Trigger greeting generation (async)
        this.generateGreeting(clientId, interviewId);

        return { sessionId };
    }

    private deepgramConnections = new Map<string, any>(); // Store active Deepgram connections

    async processAudioChunk(clientId: string, chunk: any) {
        if (!this.deepgram) return;

        let connection = this.deepgramConnections.get(clientId);

        if (!connection) {
            // Retrieve session to get sampleRate
            const sessionData = this.sessionStore.get(`session:${clientId}`);
            const sampleRate = sessionData ? JSON.parse(sessionData).sampleRate : 16000;

            this.logger.log(`Creating new Deepgram connection for ${clientId} at ${sampleRate}Hz`);
            connection = this.deepgram.listen.live({
                model: 'nova-2',
                language: 'en-US',
                smart_format: true,
                endpointing: 300,
                encoding: 'linear16',
                sample_rate: sampleRate,
            });

            connection.on(LiveTranscriptionEvents.Open, () => {
                this.logger.log(`Deepgram connection opened for ${clientId}`);
            });

            connection.on(LiveTranscriptionEvents.Close, () => {
                this.logger.log(`Deepgram connection closed for ${clientId}`);
                this.deepgramConnections.delete(clientId);
            });

            connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                const transcript = data.channel.alternatives[0].transcript;
                if (transcript && data.is_final) {
                    this.logger.debug(`Transcript for ${clientId}: ${transcript}`);
                    this.handleUserResponse(clientId, transcript);
                }
            });

            connection.on(LiveTranscriptionEvents.Error, (err: any) => {
                this.logger.error(`Deepgram error for ${clientId}: ${err}`);
            });

            this.deepgramConnections.set(clientId, connection);
        }

        // Send chunk to Deepgram
        if (connection.getReadyState() === 1) { // WebSocket.OPEN
            connection.send(chunk);
        }
    }

    private server: Server; // Store Socket.IO server

    setServer(server: Server) {
        this.server = server;
    }

    private async handleUserResponse(clientId: string, text: string) {
        this.logger.log(`Processing user response: ${text}`);

        if (!this.openai || !this.elevenlabs) {
            this.logger.warn('AI services not configured.');
            return;
        }

        try {
            // 1. Get LLM Response (Streaming)
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini", // Changed from gpt-4-turbo for better availability
                messages: [{ role: "user", content: text }], // In a real app, maintain history!
                stream: true,
            });

            // 2. Stream to ElevenLabs
            let llmTextBuffer = "";

            // Note: For lowest latency, we should stream text chunks to ElevenLabs. 
            // However, ElevenLabs requires somewhat complete sentences for best prosody.
            // For MVP, we'll accumulate a bit or just send sentence by sentence.
            // Simplest approach: Accumulate full response for now (adds latency) OR Use ElevenLabs WebSocket API (best for streaming).

            // Let's implement full response for stability first, or sentence buffering.

            // Collecting full response for V1 stability
            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content || "";
                llmTextBuffer += content;
            }

            this.logger.log(`LLM Response: ${llmTextBuffer}`);
            this.server.to(clientId).emit('ai_text', llmTextBuffer); // Send text to UI

            // 3. Generate Audio
            if (this.elevenlabs) {
                const audioStream = await this.elevenlabs.textToSpeech.convert(
                    this.configService.get('DEFAULT_VOICE_ID', 'EXAVITQu4vr4xnSDxMaL'),
                    {
                        text: llmTextBuffer,
                        model_id: "eleven_turbo_v2_5",
                        output_format: "pcm_16000", // Raw PCM for AudioWorklet
                    }
                );

                // 4. Stream Audio to Client
                // The audioStream is a Node.js Readable stream
                for await (const chunk of audioStream) {
                    this.server.to(clientId).emit('ai_audio', chunk);
                }
                this.server.to(clientId).emit('ai_audio_end');
            }

        } catch (error) {
            this.logger.error(`Error processing AI response: ${error}`);
        }
    }

    handleDisconnect(clientId: string) {
        // Cleanup Redis or mark as disconnected
        this.sessionStore.delete(`session:${clientId}`);
    }

    handleInterrupt(clientId: string) {
        this.logger.log(`User interrupted bot for client ${clientId}`);
        // Stop TTS stream
    }

    private async generateGreeting(clientId: string, interviewId: string) {
        this.logger.log(`Generating greeting for ${interviewId}`);

        const systemPrompt = "You are a professional AI recruiter conducting an interview. Start with a polite, professional 2-sentence greeting welcoming the candidate and asking them to introduce themselves.";

        try {
            if (!this.openai || !this.elevenlabs) {
                this.logger.warn('AI services not configured for greeting.');
                return;
            }

            // 1. Get LLM Greeting
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini", // Changed from gpt-4-turbo for better availability
                messages: [{ role: "system", content: systemPrompt }],
            });

            const greetingText = completion.choices[0]?.message?.content || "Hello! I am your AI interviewer. Can you please introduce yourself?";

            this.logger.log(`Generated Greeting: ${greetingText}`);
            this.server.to(clientId).emit('ai_text', greetingText);

            // 2. Generate Audio
            if (this.elevenlabs) {
                const audioStream = await this.elevenlabs.textToSpeech.convert(
                    this.configService.get('DEFAULT_VOICE_ID', 'EXAVITQu4vr4xnSDxMaL'),
                    {
                        text: greetingText,
                        model_id: "eleven_turbo_v2_5",
                        output_format: "pcm_16000",
                    }
                );

                for await (const chunk of audioStream) {
                    this.server.to(clientId).emit('ai_audio', chunk);
                }
                this.server.to(clientId).emit('ai_audio_end');
            }

        } catch (error) {
            this.logger.error(`Error generating greeting: ${error}`);
            const fallbackText = "Hello! I am ready to interview you. (Fallback: AI Audio unavailable)";
            this.server.to(clientId).emit('ai_text', fallbackText);
            this.server.to(clientId).emit('enable_local_tts', fallbackText);
        }
    }
}
