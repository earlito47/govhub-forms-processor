import { Field } from '../../models/Field';
import { FieldMapping } from '../../models/Form';

export class RulesMapper {
  mapByRules(fields: Field[], data: Record<string, any>): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    
    fields.forEach(field => {
      // Simple exact name matching as fallback
      const value = data[field.name];
      
      if (value) {
        mappings.push({
          fieldId: field.id,
          fieldName: field.name,
          suggestedValue: String(value),
          confidence: 0.6,
          requiresManualReview: true,
        });
      }
    });
    
    return mappings;
  }
}
