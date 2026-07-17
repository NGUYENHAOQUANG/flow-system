import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetPresignedUrlSchema = z.object({
  fileName: z.string().min(1, 'fileName is required'),
  fileType: z.string().min(1, 'fileType is required'),
});

export class GetPresignedUrlDto extends createZodDto(GetPresignedUrlSchema) {}
