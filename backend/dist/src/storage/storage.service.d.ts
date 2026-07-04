export declare class StorageService {
    private readonly logger;
    private s3Client;
    private readonly bucketName;
    constructor();
    getPresignedUploadUrl(fileName: string, fileType: string): Promise<string>;
}
