"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("../../db/client");
const schema = __importStar(require("../../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
let JobsService = JobsService_1 = class JobsService {
    configService;
    logger = new common_1.Logger(JobsService_1.name);
    queue = [];
    constructor(configService) {
        this.configService = configService;
    }
    async createJob(data) {
        const [newJob] = await client_1.db
            .insert(schema.jobs)
            .values({
            userId: 1,
            prompt: data.prompt,
            model: data.model || 'Veo 3.1 - Lite',
            duration: data.duration || '8s',
            aspectRatio: data.aspectRatio || '16:9',
            quantity: data.quantity || '1x',
            tab: data.tab || 'khung_hinh',
            type: data.type || 'video',
            status: 'WAITING',
        })
            .returning();
        this.logger.log(`Created Job ID: ${newJob.id}`);
        const jobWithImages = { ...newJob, imageUrls: data.imageUrls || [] };
        this.queue.push(jobWithImages);
        return jobWithImages;
    }
    async getNextJob() {
        if (this.queue.length === 0) {
            return null;
        }
        const job = this.queue.shift();
        if (!job)
            return null;
        this.logger.log(`Dispatched Job ID: ${job.id}`);
        await this.updateJobStatus(job.id, 'RUNNING');
        return job;
    }
    async updateJobStatus(id, status) {
        const [updated] = await client_1.db
            .update(schema.jobs)
            .set({ status, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.jobs.id, id))
            .returning();
        return updated;
    }
    async getAllJobs() {
        const rows = await client_1.db
            .select({
            id: schema.jobs.id,
            userId: schema.jobs.userId,
            workerId: schema.jobs.workerId,
            status: schema.jobs.status,
            prompt: schema.jobs.prompt,
            negativePrompt: schema.jobs.negativePrompt,
            model: schema.jobs.model,
            duration: schema.jobs.duration,
            aspectRatio: schema.jobs.aspectRatio,
            quantity: schema.jobs.quantity,
            tab: schema.jobs.tab,
            type: schema.jobs.type,
            priority: schema.jobs.priority,
            createdAt: schema.jobs.createdAt,
            updatedAt: schema.jobs.updatedAt,
            videoUrl: schema.jobFiles.url,
        })
            .from(schema.jobs)
            .leftJoin(schema.jobFiles, (0, drizzle_orm_1.eq)(schema.jobs.id, schema.jobFiles.jobId))
            .orderBy((0, drizzle_orm_1.desc)(schema.jobs.createdAt));
        const domain = this.configService.get('R2_PUBLIC_DOMAIN') || '';
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        return rows.map((row) => {
            let finalUrl = row.videoUrl;
            if (finalUrl && !finalUrl.startsWith('http')) {
                finalUrl = `${baseUrl.replace(/\/$/, '')}/${finalUrl}`;
            }
            return { ...row, videoUrl: finalUrl };
        });
    }
    async saveJobVideoUrl(jobId, url) {
        const ext = url.split('.').pop()?.toLowerCase();
        let fileType = 'video/mp4';
        if (ext === 'png')
            fileType = 'image/png';
        else if (ext === 'webp')
            fileType = 'image/webp';
        else if (ext === 'jpg' || ext === 'jpeg')
            fileType = 'image/jpeg';
        await client_1.db.insert(schema.jobFiles).values({
            jobId,
            fileType,
            url,
        });
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map