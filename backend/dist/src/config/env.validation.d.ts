import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    R2_ACCOUNT_ID: z.ZodOptional<z.ZodString>;
    R2_ACCESS_KEY_ID: z.ZodOptional<z.ZodString>;
    R2_SECRET_ACCESS_KEY: z.ZodOptional<z.ZodString>;
    R2_BUCKET_NAME: z.ZodDefault<z.ZodString>;
    R2_ENDPOINT: z.ZodOptional<z.ZodString>;
    R2_PUBLIC_DOMAIN: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare function validate(config: Record<string, unknown>): {
    PORT: number;
    DATABASE_URL: string;
    R2_BUCKET_NAME: string;
    R2_ACCOUNT_ID?: string | undefined;
    R2_ACCESS_KEY_ID?: string | undefined;
    R2_SECRET_ACCESS_KEY?: string | undefined;
    R2_ENDPOINT?: string | undefined;
    R2_PUBLIC_DOMAIN?: string | undefined;
};
