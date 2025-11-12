import { PDFDocument } from 'pdf-lib';
import { FieldMapping } from '../../models/Form';
import { logger } from '../../utils/logger';

export class PDFGenerator {
  async populateForm(pdfBuffer: Buffer, mappings: FieldMapping[]): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();
      
      // Attempt to fill existing form fields
      mappings.forEach(mapping => {
        try {
          const field = form.getTextField(mapping.fieldName);
          field.setText(mapping.suggestedValue);
        } catch (error) {
          // Field might not exist or be wrong type
          logger.warn(\`Could not fill field: \${mapping.fieldName}\`);
        }
      });
      
      const filledPdfBytes = await pdfDoc.save();
      return Buffer.from(filledPdfBytes);
    } catch (error: any) {
      logger.error('PDF population failed:', error);
      throw error;
    }
  }

  async flattenForm(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();
      form.flatten();
      
      const flattenedPdfBytes = await pdfDoc.save();
      return Buffer.from(flattenedPdfBytes);
    } catch (error: any) {
      logger.error('PDF flattening failed:', error);
      throw error;
    }
  }
}

export const pdfGenerator = new PDFGenerator();
