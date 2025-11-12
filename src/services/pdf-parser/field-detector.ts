import { PDFDocument } from 'pdf-lib';
import { Field, DetectedField, BoundingBox } from '../../models/Field';
import { PDFPage } from './index';
import { logger } from '../../utils/logger';

export class FieldDetector {
  private readonly BLANK_LINE_THRESHOLD = 50; // pixels
  private readonly CHECKBOX_SIZE_THRESHOLD = 20; // pixels

  async detectFields(pdfDoc: PDFDocument, pages: PDFPage[]): Promise<DetectedField[]> {
    logger.info('Starting field detection');

    const allFields: DetectedField[] = [];

    for (const page of pages) {
      const pageFields = await this.detectFieldsOnPage(page);
      allFields.push(...pageFields);
    }

    logger.info(`Detected ${allFields.length} fields across ${pages.length} pages`);
    
    return allFields;
  }

  private async detectFieldsOnPage(page: PDFPage): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];

    // Detect blank lines (common in flat forms)
    const blankLineFields = this.detectBlankLines(page);
    fields.push(...blankLineFields);

    // Detect checkboxes
    const checkboxFields = this.detectCheckboxes(page);
    fields.push(...checkboxFields);

    // Detect labeled fields (text near blank spaces)
    const labeledFields = this.detectLabeledFields(page);
    fields.push(...labeledFields);

    // Detect table structures
    const tableFields = this.detectTableFields(page);
    fields.push(...tableFields);

    return fields;
  }

  private detectBlankLines(page: PDFPage): DetectedField[] {
    const fields: DetectedField[] = [];
    const lines = page.text.split('\n');

    // Simple heuristic: lines with underscores or long spaces
    lines.forEach((line, index) => {
      const underscoreMatch = line.match(/_{3,}/g); // 3 or more underscores
      const colonMatch = line.match(/^([^:]+):\s*$/); // Label followed by colon and space

      if (underscoreMatch) {
        underscoreMatch.forEach((match, matchIndex) => {
          fields.push({
            id: `blank_line_${page.pageNumber}_${index}_${matchIndex}`,
            name: this.generateFieldName(line, index),
            type: 'text',
            label: this.extractLabel(line),
            boundingBox: this.estimateBoundingBox(page, index),
            detectionMethod: 'layout',
            nearbyText: [line],
            confidence: 0.7,
          });
        });
      }

      if (colonMatch) {
        fields.push({
          id: `colon_field_${page.pageNumber}_${index}`,
          name: this.sanitizeFieldName(colonMatch[1]),
          type: 'text',
          label: colonMatch[1].trim(),
          boundingBox: this.estimateBoundingBox(page, index),
          detectionMethod: 'layout',
          nearbyText: [line],
          confidence: 0.8,
        });
      }
    });

    return fields;
  }

  private detectCheckboxes(page: PDFPage): DetectedField[] {
    const fields: DetectedField[] = [];
    
    // Look for common checkbox patterns
    const checkboxPatterns = [
      /\[\s*\]/g,  // [ ]
      /☐/g,        // Unicode checkbox
      /□/g,        // Unicode square
    ];

    checkboxPatterns.forEach((pattern) => {
      const matches = [...page.text.matchAll(pattern)];
      
      matches.forEach((match, index) => {
        const context = this.getContextAroundMatch(page.text, match.index || 0);
        
        fields.push({
          id: `checkbox_${page.pageNumber}_${index}`,
          name: this.generateFieldName(context, index),
          type: 'checkbox',
          label: context.trim(),
          boundingBox: this.estimateBoundingBox(page, index),
          detectionMethod: 'layout',
          nearbyText: [context],
          confidence: 0.8,
        });
      });
    });

    return fields;
  }

  private detectLabeledFields(page: PDFPage): DetectedField[] {
    const fields: DetectedField[] = [];
    const lines = page.text.split('\n');

    // Common label patterns
    const labelPatterns = [
      /^(Name|Email|Phone|Address|City|State|ZIP|Date):\s*(.*)$/i,
      /^(First Name|Last Name|Company|Title):\s*(.*)$/i,
    ];

    lines.forEach((line, index) => {
      labelPatterns.forEach((pattern) => {
        const match = line.match(pattern);
        
        if (match) {
          const label = match[1];
          const value = match[2];
          
          // Determine field type based on label
          const fieldType = this.inferFieldType(label);
          
          fields.push({
            id: `labeled_${page.pageNumber}_${index}`,
            name: this.sanitizeFieldName(label),
            type: fieldType,
            label: label.trim(),
            boundingBox: this.estimateBoundingBox(page, index),
            detectionMethod: 'layout',
            nearbyText: [line],
            confidence: 0.85,
          });
        }
      });
    });

    return fields;
  }

  private detectTableFields(page: PDFPage): DetectedField[] {
    // Simplified table detection - look for aligned text patterns
    // This would be enhanced with more sophisticated layout analysis
    return [];
  }

  private inferFieldType(label: string): Field['type'] {
    const lower = label.toLowerCase();
    
    if (lower.includes('email')) return 'email';
    if (lower.includes('phone') || lower.includes('tel')) return 'phone';
    if (lower.includes('date')) return 'date';
    if (lower.includes('amount') || lower.includes('price') || lower.includes('cost')) return 'number';
    if (lower.includes('description') || lower.includes('comment')) return 'textarea';
    
    return 'text';
  }

  private generateFieldName(context: string, index: number): string {
    // Extract meaningful name from context
    const cleaned = context.replace(/[_:\s]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned.substring(0, 50).toLowerCase() || `field_${index}`;
  }

  private sanitizeFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private extractLabel(line: string): string {
    // Extract the label part before underscores or colons
    const match = line.match(/^([^_:]+)[_:]/);
    return match ? match[1].trim() : '';
  }

  private getContextAroundMatch(text: string, matchIndex: number, contextSize: number = 50): string {
    const start = Math.max(0, matchIndex - contextSize);
    const end = Math.min(text.length, matchIndex + contextSize);
    return text.substring(start, end);
  }

  private estimateBoundingBox(page: PDFPage, lineIndex: number): BoundingBox {
    // Simplified bounding box estimation
    // In production, you'd use more sophisticated PDF layout analysis
    const lineHeight = 20;
    const margin = 50;

    return {
      page: page.pageNumber,
      x: margin,
      y: lineIndex * lineHeight,
      width: page.width - (2 * margin),
      height: lineHeight,
    };
  }
}
