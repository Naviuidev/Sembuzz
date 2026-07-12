import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    let message = 'Upload failed.';
    if (exception.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size is 2MB.';
    } else if (exception.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field. Use the file input provided.';
    }
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
    });
  }
}
