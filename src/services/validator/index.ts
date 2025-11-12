import { Field, FilledField } from '../../models/Field';
import { ValidationError } from '../../models/Form';
import { CommonValidationRules } from '../../models/ValidationRule';
import { logger } from '../../utils/logger';

export class Validator {
  validate(fields: FilledField[]): ValidationError[] {
    const errors: ValidationError[] = [];

    fields.forEach(field => {
      const fieldErrors = this.validateField(field);
      errors.push(...fieldErrors);
    });

    return errors;
  }

  private validateField(field: FilledField): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required validation
    if (field.required && !field.value) {
      errors.push({
        fieldId: field.id,
        fieldName: field.name,
        errorType: 'required',
        message: 'This field is required',
        severity: 'error',
      });
    }

    // Type-specific validation
    if (field.value) {
      const typeError = this.validateFieldType(field);
      if (typeError) errors.push(typeError);
    }

    return errors;
  }

  private validateFieldType(field: FilledField): ValidationError | null {
    const value = String(field.value);

    switch (field.type) {
      case 'email':
        if (!CommonValidationRules.EMAIL.validator(value).isValid) {
          return {
            fieldId: field.id,
            fieldName: field.name,
            errorType: 'format',
            message: 'Invalid email format',
            severity: 'error',
          };
        }
        break;
      case 'phone':
        if (!CommonValidationRules.PHONE.validator(value).isValid) {
          return {
            fieldId: field.id,
            fieldName: field.name,
            errorType: 'format',
            message: 'Invalid phone format',
            severity: 'error',
          };
        }
        break;
      case 'date':
        if (!CommonValidationRules.DATE.validator(value).isValid) {
          return {
            fieldId: field.id,
            fieldName: field.name,
            errorType: 'format',
            message: 'Invalid date format',
            severity: 'error',
          };
        }
        break;
    }

    return null;
  }
}

export const validator = new Validator();
