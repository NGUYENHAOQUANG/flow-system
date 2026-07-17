import { Controller, Get, Query } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('presigned-url')
  async getPresignedUrl(
    @Query() query: GetPresignedUrlDto,
  ) {
    const { fileName, fileType } = query;
    const result = await this.storageService.getPresignedUploadUrl(fileName, fileType);
    return { 
      success: true, 
      url: result.presignedUrl, 
      publicUrl: result.publicUrl 
    };
  }
}
