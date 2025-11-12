import pdfParse from 'pdf-parse';
import { logger } from '../../utils/logger';

export class TextExtractor {
  async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error: any) {
      logger.error('Text extraction failed:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async extractTextByPage(pdfBuffer: Buffer): Promise<string[]> {
    try {
      const data = await pdfParse(pdfBuffer);
      // Note: pdf-parse doesn't natively support per-page extraction
      // This is a simplified version - production would use a more robust library
      const pages = data.text.split('\f'); // Form feed character often separates pages
      return pages;
    } catch (error: any) {
      logger.error('Per-page text extraction failed:', error);
      throw new Error(`Failed to extract text by page: ${error.message}`);
    }
  }

  extractEntities(text: string): ExtractedEntities {
    return {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      dates: this.extractDates(text),
      addresses: this.extractAddresses(text),
    };
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  private extractPhones(text: string): string[] {
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    return text.match(phoneRegex) || [];
  }

  private extractDates(text: string): string[] {
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g;
    return text.match(dateRegex) || [];
  }

  private extractAddresses(text: string): string[] {
    // Simplified address extraction
    const addressRegex = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)[.,]?\s+[\w\s]+,\s+[A-Z]{2}\s+\d{5}/gi;
    return text.match(addressRegex) || [];
  }
}

export interface ExtractedEntities {
  emails: string[];
  phones: string[];
  dates: string[];
  addresses: string[];
}
