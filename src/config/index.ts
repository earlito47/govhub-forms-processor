import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },

  // AI Services
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },

  // Security
  security: {
    apiKey: process.env.API_KEY || '',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || '',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Processing
  processing: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
    timeoutMs: parseInt(process.env.PROCESSING_TIMEOUT_MS || '300000'),
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5'),
  },

  // Template Matching
  templateMatching: {
    confidenceThreshold: parseFloat(process.env.TEMPLATE_CONFIDENCE_THRESHOLD || '0.8'),
  },
};

// Validation
export const validateConfig = () => {
  const required = [
    'supabase.url',
    'supabase.serviceKey',
    'ai.geminiApiKey',
    'security.apiKey',
  ];

  const missing: string[] = [];

  required.forEach((path) => {
    const value = path.split('.').reduce((obj: any, key) => obj?.[key], config);
    if (!value) {
      missing.push(path);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return true;
};

export default config;
