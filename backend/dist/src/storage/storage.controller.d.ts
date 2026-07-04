import { StorageService } from './storage.service';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    getPresignedUrl(fileName: string, fileType: string): Promise<{
        success: boolean;
        message: string;
        url?: undefined;
    } | {
        success: boolean;
        url: string;
        message?: undefined;
    }>;
}
