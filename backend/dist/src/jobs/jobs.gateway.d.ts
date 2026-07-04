import { Server, Socket } from 'socket.io';
import { JobsService } from './jobs.service';
export declare class JobsGateway {
    private readonly jobsService;
    server: Server;
    private readonly logger;
    constructor(jobsService: JobsService);
    private activeWorkers;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    handleWorkerReady(client: Socket): Promise<void>;
    handleWorkerStatusUpdate(data: {
        jobId: number;
        status: string;
    }): Promise<void>;
    handleJobCompleted(client: Socket, data: {
        jobId: number;
        videoUrl: string;
    }): Promise<void>;
}
