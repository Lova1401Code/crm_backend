import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError, ValidationError } from '../domain/domain-error';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      const status =
        exception.code === 'VALIDATION_ERROR'
          ? HttpStatus.BAD_REQUEST
          : exception.code === 'NOT_FOUND'
            ? HttpStatus.NOT_FOUND
            : exception.code === 'CONFLICT'
              ? HttpStatus.CONFLICT
              : exception.code === 'FORBIDDEN'
                ? HttpStatus.FORBIDDEN
                : HttpStatus.UNAUTHORIZED;
      const payload: Record<string, unknown> = {
        statusCode: status,
        code: exception.code,
        message: exception.message,
      };
      if (exception instanceof ValidationError && exception.details) {
        payload.details = exception.details;
      }
      return res.status(status).json(payload);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const payload =
        typeof response === 'string'
          ? { statusCode: status, message: response }
          : (response as object);
      return res.status(status).json(payload);
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur',
    });
  }
}