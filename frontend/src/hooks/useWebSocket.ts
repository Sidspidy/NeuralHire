import { useEffect } from 'react';
import { useWebSocketStore } from '@/store/useWebSocketStore';

export function useWebSocket() {
    const { socket, isConnected, connect, disconnect, emit, on, off } = useWebSocketStore();

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        socket,
        isConnected,
        emit,
        on,
        off,
    };
}
