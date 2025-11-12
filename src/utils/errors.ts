export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class PDFProcessingError extends AppError {
  constructor(message: string, details?: any) {
    super(`PDF Processing Error: ${message}`, 500);
    this.details = details;
  }
  details?: any;
}

export class FieldDetectionError extends AppError {
  constructor(message: string) {
    super(`Field Detection Error: ${message}`, 500);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, service: string = 'AI') {
    super(`${service} Service Error: ${message}`, 503);
  }
}

export class TemplateMatchError extends AppError {
  constructor(message: string) {
    super(`Template Match Error: ${message}`, 500);
  }
}

export class DataExtractionError extends AppError {
  constructor(message: string) {
    super(`Data Extraction Error: ${message}`, 500);
  }
}

// Error handler middleware
export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err instanceof ValidationError && { errors: err.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }

  // Unhandled errors
  console.error('Unhandled error:', err);
  
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        originalError: err.message,
        stack: err.stack,
      }),
    },
  });
};
