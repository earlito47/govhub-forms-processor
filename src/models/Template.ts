import { Field, ValidationConstraint } from './Field';

export interface FormTemplate {
  id: string;
  name: string;
  version: string;
  category: 'government' | 'commercial' | 'custom';
  description?: string;
  
  // Template metadata
  formIdentifiers: FormIdentifier[];
  fieldDefinitions: TemplateField[];
  validationRules: TemplateValidationRule[];
  layoutMetadata: LayoutMetadata;
  
  // Learning data
  usageCount: number;
  successRate?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface FormIdentifier {
  type: 'title' | 'form_number' | 'header_text' | 'footer_text' | 'pattern';
  value: string;
  pattern?: string; // Regex pattern
  required: boolean;
}

export interface TemplateField extends Field {
  aliases?: string[]; // Alternative names for the field
  mapping?: {
    commonSources: string[]; // Common sources for this field (e.g., "company_name", "user_profile")
    extractionHints: string[]; // Hints for data extraction
  };
}

export interface TemplateValidationRule {
  id: string;
  type: 'field' | 'cross_field' | 'conditional';
  fields: string[]; // Field IDs involved
  rule: string; // Rule expression
  errorMessage: string;
  severity: 'error' | 'warning';
}

export interface LayoutMetadata {
  pageCount: number;
  pageSize: {
    width: number;
    height: number;
  };
  sections?: Section[];
  fieldGroups?: FieldGroup[];
}

export interface Section {
  id: string;
  name: string;
  page: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fields: string[]; // Field IDs in this section
}

export interface FieldGroup {
  id: string;
  name: string;
  fields: string[];
  type: 'row' | 'column' | 'table' | 'group';
}

export interface TemplateMatchResult {
  templateId: string;
  confidence: number;
  matchedIdentifiers: string[];
  unmatchedIdentifiers: string[];
  fieldMatchScore: number;
}
