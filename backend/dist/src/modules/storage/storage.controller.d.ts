import { StorageService } from './storage.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    getPresignedUrl(query: GetPresignedUrlDto): Promise<{
        success: boolean;
        url: string;
        publicUrl: string;
    }>;
}
