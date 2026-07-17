import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const WorkerStatusUpdateSchema = z.object({
  jobId: z.number().int().positive(),
  status: z.string().min(1),
});

export class WorkerStatusUpdateDto extends createZodDto(WorkerStatusUpdateSchema) {}

const WorkerJobCompletedSchema = z.object({
  jobId: z.number().int().positive(),
  videoUrl: z.string().min(1),
});

export class WorkerJobCompletedDto extends createZodDto(WorkerJobCompletedSchema) {}
