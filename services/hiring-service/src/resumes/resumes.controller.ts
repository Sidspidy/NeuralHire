
import { Controller, Post, Get, UploadedFile, UseInterceptors, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Helper function for filename
const editFileName = (req, file, callback) => {
    // Sanitize filename to remove special characters
    const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-');
    const fileExtName = extname(file.originalname);
    const randomName = Array(4)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
    callback(null, `${name}-${randomName}${fileExtName}`);
};

@Controller('resumes')
export class ResumesController {
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: editFileName,
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(pdf)$/)) {
                return callback(new HttpException('Only PDF files are allowed!', HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }

        // Return response compatible with what frontend expects
        return {
            filename: file.filename,
            storage_url: file.path.replace(/\\/g, '/'), // Normalize path separators
            message: 'File uploaded successfully',
            status: 'queued', // Mimic AI engine status
            // We return a dummy job_id since actual processing happens later in creating candidate
            job_id: `pending-${Date.now()}`
        };
    }

    @Get(':filename')
    downloadFile(@Param('filename') filename: string, @Res() res: Response) {
        return res.sendFile(filename, { root: './uploads' });
    }
}
