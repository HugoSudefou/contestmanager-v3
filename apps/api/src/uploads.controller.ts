import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';

export const UPLOAD_DIR = 'uploads';

// The stored extension comes from this list, never from the client's file name.
const EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

/** Mission images for the contest editor. Served back as static files under /uploads. */
@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, randomUUID() + EXTENSIONS[file.mimetype]),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, file.mimetype in EXTENSIONS),
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image PNG, JPG, GIF ou WebP de 5 Mo maximum attendue');
    return { url: `/${UPLOAD_DIR}/${file.filename}` };
  }
}
