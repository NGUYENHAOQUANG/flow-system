import { z } from 'zod';
declare const GetPresignedUrlDto_base: import("nestjs-zod").ZodDto<z.ZodObject<{
    fileName: z.ZodString;
    fileType: z.ZodString;
}, z.core.$strip>, false>;
export declare class GetPresignedUrlDto extends GetPresignedUrlDto_base {
}
export {};
