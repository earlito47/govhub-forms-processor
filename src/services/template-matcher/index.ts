import { FormTemplate, TemplateMatchResult } from '../../models/Template';
import { Field } from '../../models/Field';
import { TemplateRegistry } from './template-registry';
import { PatternMatcher } from './pattern-matcher';
import { logger } from '../../utils/logger';

export class TemplateMatcher {
  private registry: TemplateRegistry;
  private patternMatcher: PatternMatcher;

  constructor() {
    this.registry = new TemplateRegistry();
    this.patternMatcher = new PatternMatcher();
  }

  async findMatchingTemplate(
    pdfText: string,
    detectedFields: Field[]
  ): Promise<TemplateMatchResult | null> {
    logger.info('Searching for matching template');

    const templates = await this.registry.getAllTemplates();
    let bestMatch: TemplateMatchResult | null = null;
    let highestScore = 0;

    for (const template of templates) {
      const matchResult = await this.matchTemplate(template, pdfText, detectedFields);
      
      if (matchResult.confidence > highestScore) {
        highestScore = matchResult.confidence;
        bestMatch = matchResult;
      }
    }

    const threshold = 0.8;
    if (bestMatch && bestMatch.confidence >= threshold) {
      logger.info(`Template matched: ${bestMatch.templateId} (confidence: ${bestMatch.confidence})`);
      return bestMatch;
    }

    logger.info('No matching template found');
    return null;
  }

  private async matchTemplate(
    template: FormTemplate,
    pdfText: string,
    detectedFields: Field[]
  ): Promise<TemplateMatchResult> {
    // Check form identifiers
    const identifierScore = this.patternMatcher.matchIdentifiers(
      template.formIdentifiers,
      pdfText
    );

    // Check field similarity
    const fieldScore = this.patternMatcher.matchFields(
      template.fieldDefinitions,
      detectedFields
    );

    const confidence = (identifierScore * 0.7) + (fieldScore * 0.3);

    return {
      templateId: template.id,
      confidence,
      matchedIdentifiers: [], // Would track which identifiers matched
      unmatchedIdentifiers: [],
      fieldMatchScore: fieldScore,
    };
  }
}

export const templateMatcher = new TemplateMatcher();
