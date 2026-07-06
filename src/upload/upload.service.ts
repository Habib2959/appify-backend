import { Injectable } from '@nestjs/common';

export type UploadedFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

export type UploadedMediaItem = {
  url: string;
  type: 'image' | 'video';
};

@Injectable()
export class UploadService {
  uploadMedia(files: UploadedFile[]) {
    return {
      media: files.map((file) => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      })) satisfies UploadedMediaItem[],
    };
  }
}
