import { z } from 'zod';
declare const WorkerStatusUpdateDto_base: import("nestjs-zod").ZodDto<z.ZodObject<{
    jobId: z.ZodNumber;
    status: z.ZodString;
}, z.core.$strip>, false>;
export declare class WorkerStatusUpdateDto extends WorkerStatusUpdateDto_base {
}
declare const WorkerJobCompletedDto_base: import("nestjs-zod").ZodDto<z.ZodObject<{
    jobId: z.ZodNumber;
    videoUrl: z.ZodString;
}, z.core.$strip>, false>;
export declare class WorkerJobCompletedDto extends WorkerJobCompletedDto_base {
}
export {};
