import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { pdfParser } from '../services/pdf-parser';
import { templateMatcher } from '../services/template-matcher';
import config from '../config';
import { logger } from '../utils/logger';
import { cache, cacheKeys } from '../utils/cache';

const router = Router();

router.post('/detect-fields', async (req, res, next) => {
  try {
    const { formId, pdfUrl } = req.body;

    if (!formId || !pdfUrl) {
      return res.status(400).json({ error: 'formId and pdfUrl are required' });
    }

    logger.info('Detecting fields', { formId });

    // Check cache
    const cached = await cache.get(cacheKeys.formFields(formId));
    if (cached) {
      logger.info('Returning cached field detection');
      return res.json(cached);
    }

    // Fetch PDF from URL
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Parse PDF and detect fields
    const parseResult = await pdfParser.parsePDF(pdfBuffer);

    // Try to match template
    const templateMatch = await templateMatcher.findMatchingTemplate(
      parseResult.rawText,
      parseResult.fields
    );

    const response = {
      formId,
      fields: parseResult.fields,
      metadata: parseResult.metadata,
      templateMatch: templateMatch ? {
        templateId: templateMatch.templateId,
        confidence: templateMatch.confidence,
      } : null,
    };

    // Cache results
    await cache.set(cacheKeys.formFields(formId), response, 3600);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
