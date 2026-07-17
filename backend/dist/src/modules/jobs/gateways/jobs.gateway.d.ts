import { Server, Socket } from 'socket.io';
import { JobsService } from "../jobs.service";
import { WorkerStatusUpdateDto, WorkerJobCompletedDto } from "../dto/worker-update.dto";
import { ConfigService } from '@nestjs/config';
export declare class JobsGateway {
    private readonly jobsService;
    private readonly configService;
    server: Server;
    private readonly logger;
    constructor(jobsService: JobsService, configService: ConfigService);
    private activeWorkers;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    handleWorkerReady(client: Socket): Promise<void>;
    handleWorkerStatusUpdate(data: WorkerStatusUpdateDto): Promise<void>;
    handleJobCompleted(client: Socket, data: WorkerJobCompletedDto): Promise<void>;
    handleFileUploaded(client: Socket, data: WorkerJobCompletedDto): Promise<void>;
}
