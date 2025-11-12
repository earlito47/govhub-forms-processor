import { FormTemplate } from '../../models/Template';
import { logger } from '../../utils/logger';
import sf330 from '../../config/templates/sf-330.json';
import sf254 from '../../config/templates/sf-254.json';
import generic from '../../config/templates/generic.json';

export class TemplateRegistry {
  private templates: Map<string, FormTemplate> = new Map();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates() {
    const templates = [sf330, sf254, generic];
    
    templates.forEach((template: any) => {
      this.templates.set(template.id, template as FormTemplate);
    });

    logger.info(\`Loaded \${this.templates.size} templates\`);
  }

  async getAllTemplates(): Promise<FormTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(templateId: string): Promise<FormTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async addTemplate(template: FormTemplate): Promise<void> {
    this.templates.set(template.id, template);
    logger.info(\`Added template: \${template.id}\`);
  }
}
