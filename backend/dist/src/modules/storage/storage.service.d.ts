import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    private s3Client;
    private readonly bucketName;
    constructor(configService: ConfigService);
    getPresignedUploadUrl(fileName: string, fileType: string): Promise<{
        presignedUrl: string;
        publicUrl: string;
    }>;
}
