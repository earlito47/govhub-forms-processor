export type FieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'checkbox' | 'radio' | 'dropdown' | 'textarea' | 'signature';

export interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  label?: string;
  boundingBox: BoundingBox;
  required?: boolean;
  defaultValue?: string;
  options?: string[]; // For dropdown, radio, checkbox
  validation?: ValidationConstraint;
  confidence?: number; // Detection confidence score
}

export interface ValidationConstraint {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number; // For numeric fields
  max?: number;
  customRule?: string;
}

export interface DetectedField extends Field {
  detectionMethod: 'layout' | 'template' | 'ml' | 'manual';
  nearbyText?: string[]; // Text found near the field (helps with labeling)
}

export interface FilledField extends Field {
  value: string | boolean | number;
  sourceDocument?: string; // Which document provided this value
  aiConfidence?: number; // AI's confidence in the mapping
  manuallyEdited?: boolean;
  validationErrors?: string[];
}
