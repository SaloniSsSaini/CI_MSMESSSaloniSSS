import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
    socket: Socket | null;
    connected: boolean;
    emit: (event: string, data?: any) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback?: (...args: any[]) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Get the API URL from environment or use default
        const apiUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

        // Get auth token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            console.log('No auth token found, WebSocket connection skipped');
            return;
        }

        // Create socket connection
        const newSocket = io(apiUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    const emit = (event: string, data?: any) => {
        if (socket && connected) {
            socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit event:', event);
        }
    };

    const on = (event: string, callback: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, callback);
        }
    };

    const off = (event: string, callback?: (...args: any[]) => void) => {
        if (socket) {
            if (callback) {
                socket.off(event, callback);
            } else {
                socket.off(event);
            }
        }
    };

    const value: WebSocketContextType = {
        socket,
        connected,
        emit,
        on,
        off
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
