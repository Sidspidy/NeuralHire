import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface WebSocketState {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string) => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    socket: null,
    isConnected: false,

    connect: () => {
        const { socket } = get();
        if (socket?.connected) return;

        const newSocket = io(WS_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            set({ isConnected: true });
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            set({ isConnected: false });
        });

        newSocket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        set({ socket: newSocket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    emit: (event, data) => {
        const { socket } = get();
        if (socket?.connected) {
            socket.emit(event, data);
        } else {
            console.warn('WebSocket not connected. Cannot emit event:', event);
        }
    },

    on: (event, callback) => {
        const { socket } = get();
        if (socket) {
            socket.on(event, callback);
        }
    },

    off: (event) => {
        const { socket } = get();
        if (socket) {
            socket.off(event);
        }
    },
}));
