import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api.config';

/**
 * WebSocket Manager for Voice Interview
 * Handles real-time communication with the voice interview service
 */
class VoiceWebSocketManager {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    /**
     * Connect to the voice interview WebSocket server
     */
    connect(token: string): Promise<Socket> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve(this.socket);
                return;
            }

            // Create socket connection to voice namespace
            this.socket = io(`${API_CONFIG.WS_URL}/voice`, {
                auth: {
                    token,
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
            });

            // Connection successful
            this.socket.on(API_CONFIG.WS_EVENTS.CONNECT, () => {
                console.log('[VoiceWS] Connected to voice interview server');
                this.reconnectAttempts = 0;
                resolve(this.socket!);
            });

            // Connection error
            this.socket.on('connect_error', (error) => {
                console.error('[VoiceWS] Connection error:', error);
                this.reconnectAttempts++;

                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    reject(new Error('Failed to connect to voice interview server'));
                }
            });

            // Disconnection
            this.socket.on(API_CONFIG.WS_EVENTS.DISCONNECT, (reason) => {
                console.log('[VoiceWS] Disconnected:', reason);
            });

            // Error handling
            this.socket.on(API_CONFIG.WS_EVENTS.ERROR, (error) => {
                console.error('[VoiceWS] Server error:', error);
            });
        });
    }

    /**
     * Join an interview session
     */
    async joinSession(interviewId: string): Promise<{ sessionId: string }> {
        if (!this.socket?.connected) {
            throw new Error('WebSocket not connected');
        }

        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('token');
            if (!token) {
                reject(new Error('No authentication token found'));
                return;
            }

            this.socket!.emit(
                API_CONFIG.WS_EVENTS.JOIN_SESSION,
                { token, interviewId },
                (response: any) => {
                    if (response.status === 'OK') {
                        console.log('[VoiceWS] Joined session:', response.sessionId);
                        resolve({ sessionId: response.sessionId });
                    } else {
                        reject(new Error(response.message || 'Failed to join session'));
                    }
                }
            );
        });
    }

    /**
     * Send audio chunk to server for processing
     */
    sendAudioChunk(audioData: ArrayBuffer | Blob): void {
        if (!this.socket?.connected) {
            console.warn('[VoiceWS] Cannot send audio - not connected');
            return;
        }

        this.socket.emit(API_CONFIG.WS_EVENTS.AUDIO_CHUNK, audioData);
    }

    /**
     * Send interrupt signal to stop AI from speaking
     */
    sendInterrupt(): void {
        if (!this.socket?.connected) {
            console.warn('[VoiceWS] Cannot send interrupt - not connected');
            return;
        }

        this.socket.emit(API_CONFIG.WS_EVENTS.INTERRUPT);
    }

    /**
     * Listen for AI responses
     */
    onAIResponse(callback: (audioData: ArrayBuffer) => void): void {
        if (!this.socket) {
            console.warn('[VoiceWS] Socket not initialized');
            return;
        }

        this.socket.on(API_CONFIG.WS_EVENTS.AI_RESPONSE, callback);
    }

    /**
     * Listen for interview completion
     */
    onInterviewCompleted(callback: (summary: any) => void): void {
        if (!this.socket) {
            console.warn('[VoiceWS] Socket not initialized');
            return;
        }

        this.socket.on(API_CONFIG.WS_EVENTS.INTERVIEW_COMPLETED, callback);
    }

    /**
     * Listen for session initialization
     */
    onSessionInitialized(callback: (data: any) => void): void {
        if (!this.socket) {
            console.warn('[VoiceWS] Socket not initialized');
            return;
        }

        this.socket.on(API_CONFIG.WS_EVENTS.SESSION_INITIALIZED, callback);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: (...args: any[]) => void): void {
        if (!this.socket) {
            return;
        }

        if (callback) {
            this.socket.off(event, callback);
        } else {
            this.socket.off(event);
        }
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            console.log('[VoiceWS] Disconnecting...');
            this.socket.disconnect();
            this.socket = null;
            this.reconnectAttempts = 0;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Get the socket instance (for advanced usage)
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

// Export singleton instance
export const voiceWebSocket = new VoiceWebSocketManager();
export default voiceWebSocket;
