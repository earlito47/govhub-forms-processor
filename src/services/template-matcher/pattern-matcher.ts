import { FormIdentifier, TemplateField } from '../../models/Template';
import { Field } from '../../models/Field';

export class PatternMatcher {
  matchIdentifiers(identifiers: FormIdentifier[], text: string): number {
    if (identifiers.length === 0) return 0;

    let matchCount = 0;
    
    identifiers.forEach((identifier) => {
      if (identifier.pattern) {
        const regex = new RegExp(identifier.pattern, 'i');
        if (regex.test(text)) matchCount++;
      } else {
        if (text.toLowerCase().includes(identifier.value.toLowerCase())) {
          matchCount++;
        }
      }
    });

    return matchCount / identifiers.length;
  }

  matchFields(templateFields: TemplateField[], detectedFields: Field[]): number {
    if (templateFields.length === 0 || detectedFields.length === 0) return 0;

    let matchCount = 0;

    templateFields.forEach((templateField) => {
      const found = detectedFields.some((detected) => {
        return (
          this.similarFieldNames(templateField.name, detected.name) ||
          (templateField.aliases && templateField.aliases.some(alias => 
            this.similarFieldNames(alias, detected.name)
          ))
        );
      });

      if (found) matchCount++;
    });

    return matchCount / templateFields.length;
  }

  private similarFieldNames(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  }
}
