import { Router } from 'express';
import { dataExtractor } from '../services/data-extractor';
import { logger } from '../utils/logger';

const router = Router();

router.post('/extract-data', async (req, res, next) => {
  try {
    const { formId, libraryDocIds, userId } = req.body;

    if (!formId || !libraryDocIds || !userId) {
      return res.status(400).json({ error: 'formId, libraryDocIds, and userId are required' });
    }

    logger.info('Extracting data from library', { formId, docCount: libraryDocIds.length });

    const candidateData = await dataExtractor.extractFromLibrary(userId, libraryDocIds);

    res.json({
      formId,
      candidateData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
