import { GoogleGenerativeAI } from '@google/generative-ai';
import { Field } from '../../models/Field';
import { FieldMapping } from '../../models/Form';
import config from '../../config';
import { logger } from '../../utils/logger';
import { AIServiceError } from '../../utils/errors';

export class FieldMapper {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async mapFields(
    fields: Field[],
    candidateData: Record<string, any>
  ): Promise<FieldMapping[]> {
    logger.info(`Mapping ${fields.length} fields`);

    try {
      const prompt = this.buildMappingPrompt(fields, candidateData);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const mappings = this.parseAIResponse(text);
      
      return this.convertToFieldMappings(mappings, fields);
    } catch (error: any) {
      logger.error('AI mapping failed:', error);
      throw new AIServiceError(`Failed to map fields: ${error.message}`, 'Gemini');
    }
  }

  private buildMappingPrompt(fields: Field[], candidateData: Record<string, any>): string {
    return `You are a form-filling assistant. Given the following form fields and candidate data, suggest the best value for each field.

FORM FIELDS:
${JSON.stringify(fields.map(f => ({ id: f.id, name: f.name, type: f.type, label: f.label })), null, 2)}

CANDIDATE DATA:
${JSON.stringify(candidateData, null, 2)}

For each field, provide:
1. The field ID
2. Suggested value (or null if no good match)
3. Confidence score (0-1)
4. Whether manual review is required
5. Source of the value (if applicable)

Respond ONLY with valid JSON in this exact format:
{
  "mappings": [
    {
      "fieldId": "string",
      "suggestedValue": "string or null",
      "confidence": number,
      "requiresManualReview": boolean,
      "sourceField": "string or null"
    }
  ]
}`;
  }

  private parseAIResponse(text: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return { mappings: [] };
    }
  }

  private convertToFieldMappings(aiResponse: any, fields: Field[]): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    aiResponse.mappings?.forEach((mapping: any) => {
      const field = fields.find(f => f.id === mapping.fieldId);
      
      if (field) {
        mappings.push({
          fieldId: mapping.fieldId,
          fieldName: field.name,
          suggestedValue: mapping.suggestedValue || '',
          sourceDocument: mapping.sourceField,
          confidence: mapping.confidence || 0,
          requiresManualReview: mapping.requiresManualReview || mapping.confidence < 0.7,
        });
      }
    });

    return mappings;
  }
}

export const fieldMapper = new FieldMapper();
