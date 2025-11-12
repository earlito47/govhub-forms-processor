import { Field, FilledField } from './Field';

export type ProcessingStatus = 
  | 'pending'
  | 'uploading'
  | 'detecting_fields'
  | 'extracting_data'
  | 'mapping_fields'
  | 'validating'
  | 'completed'
  | 'needs_review'
  | 'failed';

export type ProcessingStage = 
  | 'upload'
  | 'field_detection'
  | 'template_matching'
  | 'data_extraction'
  | 'field_mapping'
  | 'validation'
  | 'finalization'
  | 'export';

export interface Form {
  id: string;
  userId: string;
  rfpDocumentId?: string;
  originalFilename: string;
  formType: 'pdf' | 'docx';
  fileSizeMb: number;
  bucket: string;
  storagePath: string;
  
  // Form structure
  detectedFields?: Field[];
  formTemplateId?: string;
  formTemplateVersion?: string;
  
  // Data
  autoFilledData?: Record<string, any>;
  manualOverrides?: Record<string, any>;
  fieldMappings?: FieldMapping[];
  
  // Validation
  validationErrors?: ValidationError[];
  completionPercentage: number;
  
  // Processing
  processingStatus: ProcessingStatus;
  processingStage?: ProcessingStage;
  processingError?: string;
  lastProcessedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
}

export interface FieldMapping {
  fieldId: string;
  fieldName: string;
  suggestedValue: string;
  sourceDocument?: string;
  sourceDocumentId?: string;
  confidence: number;
  requiresManualReview: boolean;
  acceptedByUser?: boolean;
  finalValue?: string;
}

export interface ValidationError {
  fieldId: string;
  fieldName: string;
  errorType: 'required' | 'format' | 'range' | 'custom' | 'overflow';
  message: string;
  severity: 'error' | 'warning';
}

export interface FormProcessingResult {
  formId: string;
  status: ProcessingStatus;
  completionPercentage: number;
  detectedFields: Field[];
  autoFilledFields: FilledField[];
  manualRequiredFields: Field[];
  validationErrors: ValidationError[];
  templateMatch?: {
    templateId: string;
    confidence: number;
  };
}
