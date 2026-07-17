"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const config_1 = require("@nestjs/config");
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new common_1.Logger(StorageService_1.name);
    s3Client;
    bucketName;
    constructor(configService) {
        this.configService = configService;
        this.bucketName = this.configService.get('R2_BUCKET_NAME') || 'flow-ultra';
        this.s3Client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: this.configService.get('R2_ENDPOINT'),
            credentials: {
                accessKeyId: this.configService.get('R2_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY') || '',
            },
        });
    }
    async getPresignedUploadUrl(fileName, fileType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            ContentType: fileType,
        });
        try {
            const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 3600 });
            const publicDomain = this.configService.get('R2_PUBLIC_DOMAIN');
            const publicUrl = publicDomain ? `${publicDomain.replace(/\/$/, '')}/${fileName}` : presignedUrl.split('?')[0];
            return { presignedUrl, publicUrl };
        }
        catch (err) {
            this.logger.error('Error generating presigned url', err);
            throw err;
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map