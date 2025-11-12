import { PDFDocument } from 'pdf-lib';
import pdfParse from 'pdf-parse';
import { FieldDetector } from './field-detector';
import { TextExtractor } from './text-extractor';
import { LayoutAnalyzer } from './layout-analyzer';
import { logger } from '../../utils/logger';
import { PDFProcessingError } from '../../utils/errors';
import { Field } from '../../models/Field';

export interface PDFParseResult {
  pages: PDFPage[];
  fields: Field[];
  metadata: PDFMetadata;
  rawText: string;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  layout: any;
}

export interface PDFMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
}

export class PDFParser {
  private fieldDetector: FieldDetector;
  private textExtractor: TextExtractor;
  private layoutAnalyzer: LayoutAnalyzer;

  constructor() {
    this.fieldDetector = new FieldDetector();
    this.textExtractor = new TextExtractor();
    this.layoutAnalyzer = new LayoutAnalyzer();
  }

  async parsePDF(pdfBuffer: Buffer): Promise<PDFParseResult> {
    try {
      logger.info('Starting PDF parsing');

      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      
      // Extract basic metadata
      const metadata = await this.extractMetadata(pdfDoc, pdfBuffer);
      
      // Extract raw text
      const rawText = await this.textExtractor.extractText(pdfBuffer);
      
      // Analyze layout and structure
      const pages = await this.layoutAnalyzer.analyzeLayout(pdfDoc, rawText);
      
      // Detect form fields
      const fields = await this.fieldDetector.detectFields(pdfDoc, pages);

      logger.info(`PDF parsed successfully: ${pages.length} pages, ${fields.length} fields detected`);

      return {
        pages,
        fields,
        metadata,
        rawText,
      };
    } catch (error: any) {
      logger.error('PDF parsing failed:', error);
      throw new PDFProcessingError(`Failed to parse PDF: ${error.message}`);
    }
  }

  private async extractMetadata(pdfDoc: PDFDocument, pdfBuffer: Buffer): Promise<PDFMetadata> {
    try {
      // Use pdf-parse for metadata extraction
      const data = await pdfParse(pdfBuffer);

      return {
        pageCount: pdfDoc.getPageCount(),
        title: data.info?.Title,
        author: data.info?.Author,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      };
    } catch (error) {
      logger.warn('Failed to extract full metadata, using basic info');
      return {
        pageCount: pdfDoc.getPageCount(),
      };
    }
  }

  async checkIfFillable(pdfBuffer: Buffer): Promise<boolean> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      return fields.length > 0;
    } catch (error) {
      return false;
    }
  }

  async extractFillableFields(pdfBuffer: Buffer): Promise<Field[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      return fields.map((field, index) => {
        const name = field.getName();
        
        return {
          id: `fillable_${index}`,
          name,
          type: this.mapPDFFieldType(field),
          label: name,
          boundingBox: {
            page: 0, // Would need to calculate actual page
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
          required: false,
          confidence: 1.0,
        };
      });
    } catch (error: any) {
      throw new PDFProcessingError(`Failed to extract fillable fields: ${error.message}`);
    }
  }

  private mapPDFFieldType(field: any): Field['type'] {
    const typeName = field.constructor.name;
    
    if (typeName.includes('Text')) return 'text';
    if (typeName.includes('CheckBox')) return 'checkbox';
    if (typeName.includes('Radio')) return 'radio';
    if (typeName.includes('Dropdown')) return 'dropdown';
    
    return 'text';
  }
}

export const pdfParser = new PDFParser();
