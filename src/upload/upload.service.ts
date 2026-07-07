import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Readable } from 'stream';

export type UploadedFile = {
  buffer?: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  stream?: Readable;
};

export type UploadedMediaItem = {
  url: string;
  type: 'image' | 'video';
};

@Injectable()
export class UploadService {
  async uploadMedia(files: UploadedFile[]) {
    return {
      media: await Promise.all(
        files.map((file) => this.uploadToCloudinary(file)),
      ),
    };
  }

  private async uploadToCloudinary(
    file: UploadedFile,
  ): Promise<UploadedMediaItem> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary configuration is missing',
      );
    }

    const fileBuffer = await this.getFileBuffer(file);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'appify-demo';
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(fileBuffer)], { type: file.mimetype }),
      file.originalname,
    );
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Cloudinary upload failed: ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      secure_url?: string;
      resource_type?: string;
    };

    if (!result.secure_url) {
      throw new InternalServerErrorException(
        'Cloudinary did not return a media URL',
      );
    }

    return {
      url: result.secure_url,
      type: result.resource_type === 'video' ? 'video' : 'image',
    };
  }

  private async getFileBuffer(file: UploadedFile): Promise<Buffer> {
    if (file.buffer) {
      return file.buffer;
    }

    if (!file.stream) {
      throw new InternalServerErrorException('Uploaded file buffer is missing');
    }

    const chunks: Buffer[] = [];

    for await (const chunk of file.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (!chunks.length) {
      throw new InternalServerErrorException('Uploaded file buffer is missing');
    }

    return Buffer.concat(chunks);
  }
}
