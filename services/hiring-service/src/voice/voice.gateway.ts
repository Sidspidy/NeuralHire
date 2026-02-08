import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceService } from './voice.service';
import { Logger } from '@nestjs/common';

import { OnGatewayInit } from '@nestjs/websockets';

@WebSocketGateway({
    cors: {
        origin: '*', // Configure correctly in production (e.g. process.env.CORS_ORIGIN)
        credentials: true,
    },
    namespace: 'voice',
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(VoiceGateway.name);

    constructor(private readonly voiceService: VoiceService) { }

    afterInit(server: Server) {
        this.voiceService.setServer(server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.voiceService.handleDisconnect(client.id);
    }

    @SubscribeMessage('join_session')
    async handleJoinSession(
        @MessageBody() data: { token: string; interviewId: string; sampleRate?: number },
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.log(`Client ${client.id} joining session ${data.interviewId} with rate ${data.sampleRate}`);
        try {
            const result = await this.voiceService.initializeSession(client.id, data.token, data.interviewId, data.sampleRate);
            return { status: 'OK', sessionId: result.sessionId };
        } catch (error) {
            this.logger.error(`Join failed: ${error.message}`);
            return { status: 'ERROR', message: error.message };
        }
    }

    @SubscribeMessage('audio_chunk')
    handleAudioChunk(
        @MessageBody() chunk: any, // Can be Buffer or ArrayBuffer depending on client
        @ConnectedSocket() client: Socket,
    ) {
        this.voiceService.processAudioChunk(client.id, chunk);
    }

    @SubscribeMessage('interrupt')
    handleInterrupt(@ConnectedSocket() client: Socket) {
        this.voiceService.handleInterrupt(client.id);
    }
}
