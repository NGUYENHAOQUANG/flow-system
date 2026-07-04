import { Controller, Get, Query } from '@nestjs/common';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('presigned-url')
  async getPresignedUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ) {
    if (!fileName || !fileType) {
      return { success: false, message: 'fileName and fileType are required' };
    }
    const signedUrl = await this.storageService.getPresignedUploadUrl(fileName, fileType);
    return { success: true, url: signedUrl };
  }
}
