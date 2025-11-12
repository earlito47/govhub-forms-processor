import { Router } from 'express';
import { fieldMapper } from '../services/field-mapper';
import { logger } from '../utils/logger';

const router = Router();

router.post('/map-fields', async (req, res, next) => {
  try {
    const { formId, fields, candidateData } = req.body;

    if (!formId || !fields || !candidateData) {
      return res.status(400).json({ error: 'formId, fields, and candidateData are required' });
    }

    logger.info('Mapping fields', { formId, fieldCount: fields.length });

    const mappings = await fieldMapper.mapFields(fields, candidateData);

    const autoFilled: Record<string, any> = {};
    const manualRequired: any[] = [];

    mappings.forEach(mapping => {
      if (mapping.requiresManualReview || mapping.confidence < 0.7) {
        manualRequired.push(mapping);
      } else {
        autoFilled[mapping.fieldName] = mapping.suggestedValue;
      }
    });

    res.json({
      formId,
      mappings,
      autoFilled,
      manualRequired,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
