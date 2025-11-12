import Redis from 'ioredis';
import { logger } from './logger';

let redis: Redis | null = null;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not configured - caching disabled');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
};

export const getRedis = () => redis;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  async delete(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  async has(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  async clear(pattern: string = '*'): Promise<number> {
    if (!redis) return 0;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      logger.error(`Cache clear error for pattern ${pattern}:`, error);
      return 0;
    }
  },
};

// Cache key generators
export const cacheKeys = {
  form: (formId: string) => `form:${formId}`,
  formFields: (formId: string) => `form:${formId}:fields`,
  template: (templateId: string) => `template:${templateId}`,
  libraryDoc: (docId: string) => `doc:${docId}`,
  userDocs: (userId: string) => `user:${userId}:docs`,
  processingStatus: (formId: string) => `processing:${formId}:status`,
};
