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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const db_module_1 = require("../db/db.module");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
let JobsService = JobsService_1 = class JobsService {
    db;
    logger = new common_1.Logger(JobsService_1.name);
    queue = [];
    constructor(db) {
        this.db = db;
    }
    async createJob(data) {
        const [newJob] = await this.db
            .insert(schema.jobs)
            .values({
            userId: 1,
            prompt: data.prompt,
            model: data.model || 'flow-ultra',
            duration: data.duration || '5s',
            aspectRatio: data.aspectRatio || '16:9',
            status: 'WAITING',
        })
            .returning();
        this.logger.log(`Created Job ID: ${newJob.id}`);
        this.queue.push(newJob);
        return newJob;
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
        const [updated] = await this.db
            .update(schema.jobs)
            .set({ status, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.jobs.id, id))
            .returning();
        return updated;
    }
    async getAllJobs() {
        const rows = await this.db
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
            priority: schema.jobs.priority,
            createdAt: schema.jobs.createdAt,
            updatedAt: schema.jobs.updatedAt,
            videoUrl: schema.jobFiles.url,
        })
            .from(schema.jobs)
            .leftJoin(schema.jobFiles, (0, drizzle_orm_1.eq)(schema.jobs.id, schema.jobFiles.jobId))
            .orderBy(schema.jobs.createdAt);
        return rows;
    }
    async saveJobVideoUrl(jobId, url) {
        await this.db.insert(schema.jobFiles).values({
            jobId,
            fileType: 'video/mp4',
            url,
        });
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [node_postgres_1.NodePgDatabase])
], JobsService);
//# sourceMappingURL=jobs.service.js.map