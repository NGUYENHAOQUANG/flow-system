import { JobsService } from './jobs.service';
import { JobsGateway } from './jobs.gateway';
export declare class JobsController {
    private readonly jobsService;
    private readonly jobsGateway;
    constructor(jobsService: JobsService, jobsGateway: JobsGateway);
    createJob(body: {
        prompt: string;
        model?: string;
        duration?: string;
        aspectRatio?: string;
    }): Promise<{
        success: boolean;
        data: {
            duration: string;
            id: number;
            createdAt: Date;
            userId: number;
            status: string;
            workerId: number | null;
            prompt: string;
            negativePrompt: string | null;
            model: string;
            aspectRatio: string;
            priority: number;
            updatedAt: Date;
        };
    }>;
    getJobs(): Promise<{
        success: boolean;
        data: {
            id: number;
            userId: number;
            workerId: number | null;
            status: string;
            prompt: string;
            negativePrompt: string | null;
            model: string;
            duration: string;
            aspectRatio: string;
            priority: number;
            createdAt: Date;
            updatedAt: Date;
            videoUrl: string | null;
        }[];
    }>;
}
