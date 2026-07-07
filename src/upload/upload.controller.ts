import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../user/auth.guard';
import { UploadService, type UploadedFile } from './upload.service';
import { memoryStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('media')
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const isAllowed =
          file.mimetype.startsWith('image/') ||
          /video\/(mp4|webm|quicktime)/.test(file.mimetype);

        if (!isAllowed) {
          return cb(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        files: 10,
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  uploadMedia(@UploadedFiles() files: UploadedFile[]) {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerErrorException(
        'Cloudinary configuration is missing',
      );
    }

    if (!files || !files.length) {
      throw new BadRequestException('At least one file is required');
    }

    return this.uploadService.uploadMedia(files);
  }
}
