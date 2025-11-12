import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config, { validateConfig } from './config';
import { initRedis } from './utils/cache';
import { initQueue } from './utils/queue';
import { logger } from './utils/logger';
import { errorHandler, UnauthorizedError } from './utils/errors';

// Import routes
import detectFieldsRoute from './routes/detect-fields';
import extractDataRoute from './routes/extract-data';
import mapFieldsRoute from './routes/map-fields';
import populateFormRoute from './routes/populate-form';
import validateFormRoute from './routes/validate-form';

// Validate configuration
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error: any) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

// Initialize app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.security.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// API Key authentication middleware
const authenticateApiKey = (req: Request, res: Response, next: any) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.security.apiKey) {
    return next(new UnauthorizedError('Invalid or missing API key'));
  }
  
  next();
};

// Apply auth to all API routes
app.use('/api/', authenticateApiKey);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      redis: !!initRedis(),
      database: !!config.supabase.url,
      ai: !!config.ai.geminiApiKey,
    },
  });
});

// API routes
app.use('/api', detectFieldsRoute);
app.use('/api', extractDataRoute);
app.use('/api', mapFieldsRoute);
app.use('/api', populateFormRoute);
app.use('/api', validateFormRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Initialize services
const initServices = async () => {
  try {
    // Initialize Redis
    initRedis();
    
    // Initialize queue
    initQueue();
    
    logger.info('All services initialized successfully');
  } catch (error: any) {
    logger.error('Service initialization failed:', error);
  }
};

// Start server
const PORT = config.port;

const startServer = async () => {
  await initServices();
  
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
};

// Handle unhandled rejections
process.on('unhandledRejection', (error: any) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
