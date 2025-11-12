import { Router } from 'express';
import { validator } from '../services/validator';
import { logger } from '../utils/logger';

const router = Router();

router.post('/validate-form', async (req, res, next) => {
  try {
    const { formId, fields } = req.body;

    if (!formId || !fields) {
      return res.status(400).json({ error: 'formId and fields are required' });
    }

    logger.info('Validating form', { formId });

    const errors = validator.validate(fields);

    res.json({
      formId,
      errors,
      isValid: errors.length === 0,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
