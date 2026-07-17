import { z } from 'zod';
declare const CreateJobDto_base: import("nestjs-zod").ZodDto<z.ZodObject<{
    prompt: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    aspectRatio: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodString>;
    tab: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    imageUrls: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, false>;
export declare class CreateJobDto extends CreateJobDto_base {
}
export {};
