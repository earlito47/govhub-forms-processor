import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from './cache';
import { logger } from './logger';

interface FormProcessingJob {
  formId: string;
  userId: string;
  stage: string;
  metadata?: Record<string, any>;
}

let formProcessingQueue: Queue<FormProcessingJob> | null = null;
let formProcessingWorker: Worker<FormProcessingJob> | null = null;

export const initQueue = () => {
  const redis = getRedis();

  if (!redis) {
    logger.warn('Redis not available - queue disabled');
    return null;
  }

  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };

  formProcessingQueue = new Queue<FormProcessingJob>('form-processing', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  });

  logger.info('Queue initialized successfully');
  return formProcessingQueue;
};

export const getQueue = () => formProcessingQueue;

export const addFormProcessingJob = async (data: FormProcessingJob) => {
  if (!formProcessingQueue) {
    throw new Error('Queue not initialized');
  }

  try {
    const job = await formProcessingQueue.add('process-form', data, {
      jobId: `form-${data.formId}-${Date.now()}`,
    });

    logger.info('Added form processing job', { formId: data.formId, jobId: job.id });
    return job;
  } catch (error) {
    logger.error('Failed to add form processing job', { formId: data.formId, error });
    throw error;
  }
};

export const createFormProcessingWorker = (
  processor: (job: Job<FormProcessingJob>) => Promise<any>
) => {
  const redis = getRedis();

  if (!redis) {
    logger.warn('Redis not available - worker not created');
    return null;
  }

  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };

  formProcessingWorker = new Worker<FormProcessingJob>(
    'form-processing',
    processor,
    {
      connection,
      concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '5'),
    }
  );

  formProcessingWorker.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id, formId: job.data.formId });
  });

  formProcessingWorker.on('failed', (job, error) => {
    logger.error('Job failed', {
      jobId: job?.id,
      formId: job?.data.formId,
      error: error.message,
    });
  });

  formProcessingWorker.on('error', (error) => {
    logger.error('Worker error', { error: error.message });
  });

  logger.info('Worker created successfully');
  return formProcessingWorker;
};

export const getJobStatus = async (jobId: string) => {
  if (!formProcessingQueue) {
    throw new Error('Queue not initialized');
  }

  try {
    const job = await formProcessingQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    logger.error('Failed to get job status', { jobId, error });
    throw error;
  }
};

export const closeQueue = async () => {
  if (formProcessingQueue) {
    await formProcessingQueue.close();
  }

  if (formProcessingWorker) {
    await formProcessingWorker.close();
  }

  logger.info('Queue and worker closed');
};
