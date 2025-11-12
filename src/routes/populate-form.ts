import { Router } from 'express';
import { pdfGenerator } from '../services/pdf-generator';
import { createClient } from '@supabase/supabase-js';
import config from '../config';
import { logger } from '../utils/logger';

const router = Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

router.post('/populate-form', async (req, res, next) => {
  try {
    const { formId, fieldMappings } = req.body;

    if (!formId || !fieldMappings) {
      return res.status(400).json({ error: 'formId and fieldMappings are required' });
    }

    logger.info('Populating form', { formId });

    // Get form details
    const { data: form } = await supabase
      .from('opportunity_forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get PDF from storage
    const { data: signedUrl } = await supabase.storage
      .from(form.bucket)
      .createSignedUrl(form.storage_path, 3600);

    if (!signedUrl) {
      throw new Error('Failed to get PDF');
    }

    const pdfResponse = await fetch(signedUrl.signedUrl);
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Populate PDF
    const filledPdf = await pdfGenerator.populateForm(pdfBuffer, fieldMappings);

    // Save filled PDF
    const filledPath = form.storage_path.replace('.pdf', '_filled.pdf');
    await supabase.storage
      .from(form.bucket)
      .upload(filledPath, filledPdf, { upsert: true });

    res.json({
      formId,
      success: true,
      filledPath,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
