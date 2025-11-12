import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Helper methods for structured logging
export const logProcessing = {
  start: (formId: string, stage: string) => {
    logger.info(`Starting ${stage}`, { formId, stage, event: 'processing_start' });
  },
  
  complete: (formId: string, stage: string, duration?: number) => {
    logger.info(`Completed ${stage}`, { formId, stage, duration, event: 'processing_complete' });
  },
  
  error: (formId: string, stage: string, error: Error) => {
    logger.error(`Error in ${stage}`, {
      formId,
      stage,
      error: error.message,
      stack: error.stack,
      event: 'processing_error',
    });
  },
};

export default logger;
