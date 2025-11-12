import { FieldType } from './Field';

export interface ValidationRule {
  id: string;
  name: string;
  fieldTypes: FieldType[];
  validator: (value: any, context?: ValidationContext) => ValidationResult;
  errorMessage: string;
}

export interface ValidationContext {
  fieldName: string;
  fieldType: FieldType;
  formData: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export const CommonValidationRules = {
  // Required field
  REQUIRED: {
    id: 'required',
    name: 'Required Field',
    fieldTypes: ['text', 'number', 'date', 'email', 'phone', 'checkbox', 'dropdown', 'textarea'],
    validator: (value: any) => ({
      isValid: value !== null && value !== undefined && value !== '',
      errors: value ? [] : ['This field is required'],
    }),
    errorMessage: 'This field is required',
  },

  // Email format
  EMAIL: {
    id: 'email',
    name: 'Email Format',
    fieldTypes: ['email', 'text'],
    validator: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: !value || emailRegex.test(value),
        errors: emailRegex.test(value) ? [] : ['Invalid email format'],
      };
    },
    errorMessage: 'Please enter a valid email address',
  },

  // Phone format
  PHONE: {
    id: 'phone',
    name: 'Phone Format',
    fieldTypes: ['phone', 'text'],
    validator: (value: string) => {
      const phoneRegex = /^[\d\s\-\(\)]+$/;
      return {
        isValid: !value || (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10),
        errors: phoneRegex.test(value) ? [] : ['Invalid phone number format'],
      };
    },
    errorMessage: 'Please enter a valid phone number',
  },

  // Date format
  DATE: {
    id: 'date',
    name: 'Date Format',
    fieldTypes: ['date', 'text'],
    validator: (value: string) => {
      const date = new Date(value);
      return {
        isValid: !value || !isNaN(date.getTime()),
        errors: !isNaN(date.getTime()) ? [] : ['Invalid date format'],
      };
    },
    errorMessage: 'Please enter a valid date',
  },

  // Number format
  NUMBER: {
    id: 'number',
    name: 'Number Format',
    fieldTypes: ['number', 'text'],
    validator: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return {
        isValid: !value || !isNaN(num),
        errors: !isNaN(num) ? [] : ['Must be a valid number'],
      };
    },
    errorMessage: 'Please enter a valid number',
  },

  // Length constraints
  MAX_LENGTH: (maxLength: number) => ({
    id: 'max_length',
    name: 'Maximum Length',
    fieldTypes: ['text', 'textarea'],
    validator: (value: string) => ({
      isValid: !value || value.length <= maxLength,
      errors: value?.length <= maxLength ? [] : [`Maximum ${maxLength} characters allowed`],
    }),
    errorMessage: `Maximum ${maxLength} characters allowed`,
  }),

  MIN_LENGTH: (minLength: number) => ({
    id: 'min_length',
    name: 'Minimum Length',
    fieldTypes: ['text', 'textarea'],
    validator: (value: string) => ({
      isValid: !value || value.length >= minLength,
      errors: value?.length >= minLength ? [] : [`Minimum ${minLength} characters required`],
    }),
    errorMessage: `Minimum ${minLength} characters required`,
  }),

  // Numeric range
  MIN_VALUE: (min: number) => ({
    id: 'min_value',
    name: 'Minimum Value',
    fieldTypes: ['number'],
    validator: (value: number) => ({
      isValid: value === null || value === undefined || value >= min,
      errors: value >= min ? [] : [`Value must be at least ${min}`],
    }),
    errorMessage: `Value must be at least ${min}`,
  }),

  MAX_VALUE: (max: number) => ({
    id: 'max_value',
    name: 'Maximum Value',
    fieldTypes: ['number'],
    validator: (value: number) => ({
      isValid: value === null || value === undefined || value <= max,
      errors: value <= max ? [] : [`Value must be at most ${max}`],
    }),
    errorMessage: `Value must be at most ${max}`,
  }),
};

export interface CrossFieldValidation {
  id: string;
  name: string;
  fields: string[];
  validator: (values: Record<string, any>) => ValidationResult;
  errorMessage: string;
}

export const CommonCrossFieldRules = {
  DATE_RANGE: (startField: string, endField: string) => ({
    id: 'date_range',
    name: 'Date Range Validation',
    fields: [startField, endField],
    validator: (values: Record<string, any>) => {
      const start = new Date(values[startField]);
      const end = new Date(values[endField]);
      return {
        isValid: !values[startField] || !values[endField] || start <= end,
        errors: start <= end ? [] : ['End date must be after start date'],
      };
    },
    errorMessage: 'End date must be after start date',
  }),
};
