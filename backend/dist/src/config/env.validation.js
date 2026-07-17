"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    R2_ACCOUNT_ID: zod_1.z.string().optional(),
    R2_ACCESS_KEY_ID: zod_1.z.string().optional(),
    R2_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    R2_BUCKET_NAME: zod_1.z.string().default('flow-ultra'),
    R2_ENDPOINT: zod_1.z.string().optional(),
    R2_PUBLIC_DOMAIN: zod_1.z.string().optional(),
});
function validate(config) {
    const parsed = exports.envSchema.safeParse(config);
    if (!parsed.success) {
        throw new Error(`Config validation error: ${parsed.error.message}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.validation.js.map