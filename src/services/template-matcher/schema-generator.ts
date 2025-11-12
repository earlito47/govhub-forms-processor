import { FormTemplate, TemplateField } from '../../models/Template';
import { Field } from '../../models/Field';

export class SchemaGenerator {
  generateTemplate(formId: string, fields: Field[], metadata: any): FormTemplate {
    return {
      id: formId,
      name: `Custom Template - ${formId}`,
      version: '1.0',
      category: 'custom',
      fieldDefinitions: fields.map(f => this.convertToTemplateField(f)),
      validationRules: [],
      layoutMetadata: metadata,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      formIdentifiers: [],
    };
  }

  private convertToTemplateField(field: Field): TemplateField {
    return {
      ...field,
      aliases: [],
      mapping: {
        commonSources: [],
        extractionHints: [],
      },
    };
  }
}
