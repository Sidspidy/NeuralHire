import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { Mic, Square, X, Radio, Volume2, Bot } from 'lucide-react';

const VoiceInterviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // TODO: Retrieve real token from auth store
    const {
        isConnected,
        isRecording,
        aiState,
        transcript,
        lastAiText,
        startSession,
        stopSession,
        interrupt
    } = useVoiceAgent(id || 'test-session', 'dummy-token');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const getStateColor = () => {
        switch (aiState) {
            case 'listening': return 'bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]';
            case 'processing': return 'bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)]';
            case 'speaking': return 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]';
            default: return 'bg-gray-600';
        }
    };

    const getStateLabel = () => {
        switch (aiState) {
            case 'listening': return 'Listening...';
            case 'processing': return 'Thinking...';
            case 'speaking': return 'Speaking...';
            default: return 'Ready';
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="p-6 flex justify-between items-center border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Radio className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                    <h1 className="text-xl font-semibold tracking-tight">AI Interview Session</h1>
                </div>
                <button
                    onClick={() => {
                        stopSession();
                        navigate('/dashboard');
                    }}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center relative p-6">

                {/* Avatar / Visualizer */}
                <div className="relative mb-12">
                    {/* Pulsing Rings */}
                    {aiState !== 'idle' && (
                        <>
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${getStateColor()}`}></div>
                            <div className={`absolute -inset-4 rounded-full border border-gray-700 opacity-50 animate-pulse`}></div>
                        </>
                    )}

                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${getStateColor()}`}>
                        {aiState === 'speaking' ? (
                            <Volume2 className="w-12 h-12 text-white animate-bounce" />
                        ) : (
                            <Bot className="w-12 h-12 text-white" />
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-2xl font-light text-gray-200">{getStateLabel()}</p>
                        <p className="text-sm text-gray-500 mt-1">{isConnected ? 'Connected' : 'Disconnected'}</p>
                    </div>
                </div>

                {/* Dynamic Subtitles / Transcript Snippet */}
                <div className="max-w-2xl w-full text-center space-y-4 mb-12 min-h-[100px]">
                    {lastAiText && (
                        <p className="text-lg text-green-300 font-medium animate-fade-in">
                            "{lastAiText}"
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    {!isRecording ? (
                        <button
                            onClick={startSession}
                            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-all hover:scale-105 shadow-xl"
                        >
                            <Mic className="w-6 h-6" />
                            Start Interview
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={interrupt}
                                className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors tooltip"
                                title="Interrupt"
                            >
                                <Volume2 className="w-6 h-6 text-yellow-400" />
                            </button>

                            <button
                                onClick={stopSession}
                                className="flex items-center gap-3 bg-red-500 text-white px-8 py-4 rounded-full font-bold hover:bg-red-600 transition-all hover:scale-105 shadow-xl shadow-red-900/20"
                            >
                                <Square className="w-6 h-6 fill-current" />
                                End Session
                            </button>
                        </>
                    )}
                </div>
            </main>

            {/* Transcript Log (Collapsible or scrollable at bottom) */}
            <div className="h-48 border-t border-gray-800 bg-gray-900/80 p-6 overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Live Transcript</h3>
                <div className="space-y-2 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {transcript || <span className="text-gray-600 italic">No transcript yet...</span>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};

export default VoiceInterviewPage;
