import { JobsService } from './jobs.service';
import { JobsGateway } from './gateways/jobs.gateway';
import { CreateJobDto } from './dto/create-job.dto';
export declare class JobsController {
    private readonly jobsService;
    private readonly jobsGateway;
    constructor(jobsService: JobsService, jobsGateway: JobsGateway);
    createJob(body: CreateJobDto): Promise<{
        success: boolean;
        data: {
            imageUrls: string[];
            duration: string;
            id: number;
            createdAt: Date;
            status: string;
            userId: number;
            workerId: number | null;
            prompt: string;
            negativePrompt: string | null;
            model: string;
            aspectRatio: string;
            quantity: string;
            tab: string;
            type: string;
            priority: number;
            updatedAt: Date;
        };
    }>;
    getJobs(): Promise<{
        success: boolean;
        data: {
            videoUrl: string | null;
            id: number;
            userId: number;
            workerId: number | null;
            status: string;
            prompt: string;
            negativePrompt: string | null;
            model: string;
            duration: string;
            aspectRatio: string;
            quantity: string;
            tab: string;
            type: string;
            priority: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
}
