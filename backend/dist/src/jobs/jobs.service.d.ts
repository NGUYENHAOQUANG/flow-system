import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
export declare class JobsService {
    private readonly db;
    private readonly logger;
    private queue;
    constructor(db: NodePgDatabase<typeof schema>);
    createJob(data: {
        prompt: string;
        model?: string;
        duration?: string;
        aspectRatio?: string;
    }): Promise<{
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
        priority: number;
        updatedAt: Date;
    }>;
    getNextJob(): Promise<any>;
    updateJobStatus(id: number, status: string): Promise<{
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
    }>;
    getAllJobs(): Promise<{
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
    }[]>;
}
