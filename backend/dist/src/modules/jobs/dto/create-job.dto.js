"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateJobDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const CreateJobSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1, 'Prompt is required'),
    model: zod_1.z.string().optional(),
    duration: zod_1.z.string().optional(),
    aspectRatio: zod_1.z.string().optional(),
    quantity: zod_1.z.string().optional(),
    tab: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    imageUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
});
class CreateJobDto extends (0, nestjs_zod_1.createZodDto)(CreateJobSchema) {
}
exports.CreateJobDto = CreateJobDto;
//# sourceMappingURL=create-job.dto.js.map