import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateJobSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
  duration: z.string().optional(),
  aspectRatio: z.string().optional(),
  quantity: z.string().optional(),
  tab: z.string().optional(),
  type: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(), // URL ảnh tham chiếu từ người dùng tải lên
});

export class CreateJobDto extends createZodDto(CreateJobSchema) {}
