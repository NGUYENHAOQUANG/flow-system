import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'flow-ultra';
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async getPresignedUploadUrl(fileName: string, fileType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: fileType,
    });

    try {
      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      const publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN');
      // Nếu có R2_PUBLIC_DOMAIN thì ghép với fileName, nếu không thì fallback về URL gốc bỏ query params
      const publicUrl = publicDomain ? `${publicDomain.replace(/\/$/, '')}/${fileName}` : presignedUrl.split('?')[0];
      return { presignedUrl, publicUrl };
    } catch (err) {
      this.logger.error('Error generating presigned url', err);
      throw err;
    }
  }
}
