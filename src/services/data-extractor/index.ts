import { createClient } from '@supabase/supabase-js';
import config from '../../config';
import { logger } from '../../utils/logger';

export interface CandidateData {
  [key: string]: any;
}

export class DataExtractor {
  private supabase;

  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey
    );
  }

  async extractFromLibrary(userId: string, docIds: string[]): Promise<CandidateData> {
    logger.info(\`Extracting data from \${docIds.length} documents\`);

    const candidateData: CandidateData = {};

    // Fetch documents from library
    const { data: docs, error } = await this.supabase
      .from('rfp_documents')
      .select('*')
      .in('id', docIds)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch library documents:', error);
      return candidateData;
    }

    // Extract data from each document
    for (const doc of docs || []) {
      const extracted = this.extractDataFromDocument(doc);
      Object.assign(candidateData, extracted);
    }

    return candidateData;
  }

  private extractDataFromDocument(doc: any): CandidateData {
    const data: CandidateData = {};

    // Extract from structured fields if available
    if (doc.structured_data) {
      Object.assign(data, doc.structured_data);
    }

    // Extract from content
    if (doc.content) {
      const extracted = this.extractEntities(doc.content);
      Object.assign(data, extracted);
    }

    return data;
  }

  private extractEntities(content: string): CandidateData {
    return {
      emails: this.extractEmails(content),
      phones: this.extractPhones(content),
      addresses: this.extractAddresses(content),
    };
  }

  private extractEmails(text: string): string[] {
    const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(regex) || [];
  }

  private extractPhones(text: string): string[] {
    const regex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    return text.match(regex) || [];
  }

  private extractAddresses(text: string): string[] {
    // Simplified
    return [];
  }
}

export const dataExtractor = new DataExtractor();
