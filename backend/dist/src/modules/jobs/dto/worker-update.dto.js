"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerJobCompletedDto = exports.WorkerStatusUpdateDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const WorkerStatusUpdateSchema = zod_1.z.object({
    jobId: zod_1.z.number().int().positive(),
    status: zod_1.z.string().min(1),
});
class WorkerStatusUpdateDto extends (0, nestjs_zod_1.createZodDto)(WorkerStatusUpdateSchema) {
}
exports.WorkerStatusUpdateDto = WorkerStatusUpdateDto;
const WorkerJobCompletedSchema = zod_1.z.object({
    jobId: zod_1.z.number().int().positive(),
    videoUrl: zod_1.z.string().min(1),
});
class WorkerJobCompletedDto extends (0, nestjs_zod_1.createZodDto)(WorkerJobCompletedSchema) {
}
exports.WorkerJobCompletedDto = WorkerJobCompletedDto;
//# sourceMappingURL=worker-update.dto.js.map