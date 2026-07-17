"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPresignedUrlDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const GetPresignedUrlSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1, 'fileName is required'),
    fileType: zod_1.z.string().min(1, 'fileType is required'),
});
class GetPresignedUrlDto extends (0, nestjs_zod_1.createZodDto)(GetPresignedUrlSchema) {
}
exports.GetPresignedUrlDto = GetPresignedUrlDto;
//# sourceMappingURL=get-presigned-url.dto.js.map