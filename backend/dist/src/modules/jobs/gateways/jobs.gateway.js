"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jobs_service_1 = require("../jobs.service");
const common_1 = require("@nestjs/common");
const worker_update_dto_1 = require("../dto/worker-update.dto");
const config_1 = require("@nestjs/config");
let JobsGateway = JobsGateway_1 = class JobsGateway {
    jobsService;
    configService;
    server;
    logger = new common_1.Logger(JobsGateway_1.name);
    constructor(jobsService, configService) {
        this.jobsService = jobsService;
        this.configService = configService;
    }
    activeWorkers = new Map();
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    async handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const jobId = this.activeWorkers.get(client.id);
        if (jobId) {
            this.logger.warn(`Worker crashed while processing Job ${jobId}. Re-queuing job...`);
            await this.jobsService.updateJobStatus(jobId, 'WAITING');
            this.activeWorkers.delete(client.id);
            const jobs = await this.jobsService.getAllJobs();
            const crashedJob = jobs.find((j) => j.id === jobId);
            if (crashedJob) {
                this.server.emit('job:update_status', {
                    jobId: crashedJob.id,
                    status: 'WAITING',
                });
            }
        }
    }
    async handleWorkerReady(client) {
        this.logger.log(`Worker ${client.id} is ready for a job`);
        const job = await this.jobsService.getNextJob();
        if (job) {
            this.activeWorkers.set(client.id, job.id);
            client.emit('job:dispatch', job);
            this.server.emit('job:update_status', {
                jobId: job.id,
                status: 'RUNNING',
            });
        }
    }
    async handleWorkerStatusUpdate(data) {
        this.logger.log(`Job ${data.jobId} status updated to ${data.status}`);
        await this.jobsService.updateJobStatus(data.jobId, data.status);
        this.server.emit('job:update_status', data);
    }
    async handleJobCompleted(client, data) {
        this.logger.log(`Job ${data.jobId} completed. URL: ${data.videoUrl}`);
        await this.jobsService.updateJobStatus(data.jobId, 'COMPLETED');
        this.activeWorkers.delete(client.id);
        await this.jobsService.saveJobVideoUrl(data.jobId, data.videoUrl);
        const domain = this.configService.get('R2_PUBLIC_DOMAIN') || '';
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        let finalVideoUrl = data.videoUrl;
        if (finalVideoUrl && !finalVideoUrl.startsWith('http')) {
            finalVideoUrl = `${baseUrl.replace(/\/$/, '')}/${finalVideoUrl}`;
        }
        this.server.emit('job:update_status', {
            jobId: data.jobId,
            status: 'COMPLETED',
            videoUrl: finalVideoUrl,
        });
    }
    async handleFileUploaded(client, data) {
        this.logger.log(`Job ${data.jobId} file uploaded. URL: ${data.videoUrl}`);
        await this.jobsService.saveJobVideoUrl(data.jobId, data.videoUrl);
        const domain = this.configService.get('R2_PUBLIC_DOMAIN') || '';
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        let finalVideoUrl = data.videoUrl;
        if (finalVideoUrl && !finalVideoUrl.startsWith('http')) {
            finalVideoUrl = `${baseUrl.replace(/\/$/, '')}/${finalVideoUrl}`;
        }
        this.server.emit('job:file_uploaded', {
            jobId: data.jobId,
            videoUrl: finalVideoUrl,
        });
    }
};
exports.JobsGateway = JobsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], JobsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('worker:ready'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], JobsGateway.prototype, "handleWorkerReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('worker:status_update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [worker_update_dto_1.WorkerStatusUpdateDto]),
    __metadata("design:returntype", Promise)
], JobsGateway.prototype, "handleWorkerStatusUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('worker:job_completed'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        worker_update_dto_1.WorkerJobCompletedDto]),
    __metadata("design:returntype", Promise)
], JobsGateway.prototype, "handleJobCompleted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('worker:file_uploaded'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        worker_update_dto_1.WorkerJobCompletedDto]),
    __metadata("design:returntype", Promise)
], JobsGateway.prototype, "handleFileUploaded", null);
exports.JobsGateway = JobsGateway = JobsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [jobs_service_1.JobsService,
        config_1.ConfigService])
], JobsGateway);
//# sourceMappingURL=jobs.gateway.js.map