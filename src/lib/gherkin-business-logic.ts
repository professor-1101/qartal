import {
  Feature,
  Scenario,
  Step,
  Background,
  Examples,
  Rule,
  DataTable,
  DocString,
  GherkinValidation,
  ValidationError,
  ValidationWarning,
  GherkinBusinessLogic
} from '@/types/gherkin';
import { nanoid } from 'nanoid';

export class GherkinBusinessLogicService implements GherkinBusinessLogic {

  /**
   * Validates a complete feature according to Gherkin standards
   */
  validateFeature(feature: Feature): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check feature name
    if (!feature.name || feature.name.trim() === '') {
      errors.push({
        type: 'content',
        message: 'Feature must have a name',
        location: { element: 'feature', elementId: feature.id }
      });
    }

    // Check feature description (optional but recommended)
    if (!feature.description || feature.description.trim() === '') {
      warnings.push({
        type: 'best_practice',
        message: 'Consider adding a description to explain the feature\'s purpose',
        location: { element: 'feature', elementId: feature.id }
      });
    }

    // Validate background if present
    if (feature.background) {
      const backgroundValidation = this.validateBackground(feature.background);
      errors.push(...backgroundValidation.errors);
      warnings.push(...backgroundValidation.warnings);
    }

    // Validate rules if present
    if (feature.rules) {
      feature.rules.forEach((rule, index) => {
        const ruleValidation = this.validateRule(rule);
        errors.push(...ruleValidation.errors.map(error => ({
          ...error,
          location: { ...error.location, line: index + 1 }
        })));
        warnings.push(...ruleValidation.warnings.map(warning => ({
          ...warning,
          location: { ...warning.location, line: index + 1 }
        })));
      });
    }

    // Validate scenarios (both direct and in rules)
    const allScenarios = [
      ...feature.scenarios,
      ...(feature.rules?.flatMap(rule => rule.scenarios) || [])
    ];

    if (allScenarios.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Feature must contain at least one scenario',
        location: { element: 'feature', elementId: feature.id }
      });
    } else {
      allScenarios.forEach((scenario, index) => {
        const scenarioValidation = this.validateScenario(scenario);
        errors.push(...scenarioValidation.errors.map(error => ({
          ...error,
          location: { ...error.location, line: index + 1 }
        })));
        warnings.push(...scenarioValidation.warnings.map(warning => ({
          ...warning,
          location: { ...warning.location, line: index + 1 }
        })));
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a scenario according to Gherkin standards
   */
  validateScenario(scenario: Scenario): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check scenario name
    if (!scenario.name || scenario.name.trim() === '') {
      errors.push({
        type: 'content',
        message: 'Scenario must have a name',
        location: { element: 'scenario', elementId: scenario.id }
      });
    }

    // Check scenario steps
    if (!scenario.steps || scenario.steps.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Scenario must contain at least one step',
        location: { element: 'scenario', elementId: scenario.id }
      });
    } else {
      // Validate step sequence
      let hasGiven = false;
      let hasWhen = false;
      let hasThen = false;
      let previousKeyword: Step['keyword'] | null = null;

      scenario.steps.forEach((step, index) => {
        const stepValidation = this.validateStep(step, scenario.steps.slice(0, index));
        errors.push(...stepValidation.errors);
        warnings.push(...stepValidation.warnings);

        // Check for proper Given/When/Then sequence
        if (step.keyword === 'فرض' || (step.keyword === 'و' && previousKeyword === 'فرض')) {
          hasGiven = true;
        } else if (step.keyword === 'وقتی' || (step.keyword === 'و' && previousKeyword === 'وقتی')) {
          hasWhen = true;
          if (!hasGiven) {
            errors.push({
              type: 'logic',
              message: 'مرحله وقتی باید بعد از مرحله فرض بیاید',
              location: { element: 'step', elementId: step.id }
            });
          }
        } else if (step.keyword === 'آنگاه' || (step.keyword === 'و' && previousKeyword === 'آنگاه')) {
          hasThen = true;
          if (!hasWhen) {
            errors.push({
              type: 'logic',
              message: 'مرحله آنگاه باید بعد از مرحله وقتی بیاید',
              location: { element: 'step', elementId: step.id }
            });
          }
        }

        previousKeyword = step.keyword;
      });

      // Check for required step types
      if (!hasGiven) {
        errors.push({
          type: 'structure',
          message: 'سناریو باید با مرحله فرض شروع شود',
          location: { element: 'scenario', elementId: scenario.id }
        });
      }
      if (!hasWhen) {
        errors.push({
          type: 'structure',
          message: 'سناریو باید حداقل یک مرحله وقتی داشته باشد',
          location: { element: 'scenario', elementId: scenario.id }
        });
      }
      if (!hasThen) {
        errors.push({
          type: 'structure',
          message: 'سناریو باید حداقل یک مرحله آنگاه داشته باشد',
          location: { element: 'scenario', elementId: scenario.id }
        });
      }
    }

    // Validate examples for scenario outlines
    if (scenario.type === 'scenario-outline') {
      if (!scenario.examples) {
        errors.push({
          type: 'structure',
          message: 'Scenario Outline must contain Examples',
          location: { element: 'scenario', elementId: scenario.id }
        });
      } else {
        const examplesValidation = this.validateExamples(scenario.examples);
        errors.push(...examplesValidation.errors);
        warnings.push(...examplesValidation.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a step according to Gherkin standards
   */
  validateStep(step: Step, previousSteps: Step[] = []): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check step text
    if (!step.text || step.text.trim() === '') {
      errors.push({
        type: 'content',
        message: 'Step must have text',
        location: { element: 'step', elementId: step.id }
      });
    }

    // Check for proper keyword usage
    if (step.keyword === 'و' || step.keyword === 'اما') {
      if (previousSteps.length === 0) {
        errors.push({
          type: 'syntax',
          message: 'مراحل و/اما باید بعد از فرض/وقتی/آنگاه بیایند',
          location: { element: 'step', elementId: step.id }
        });
      }
    }

    // Check for step text quality
    if (step.text && step.text.length < 10) {
      warnings.push({
        type: 'style',
        message: 'متن مرحله باید توصیفی و واضح باشد',
        location: { element: 'step', elementId: step.id }
      });
    }

    // Check for common anti-patterns
    if (step.text && step.text.toLowerCase().includes('should')) {
      warnings.push({
        type: 'best_practice',
        message: 'Avoid using "should" in step text - use present tense',
        location: { element: 'step', elementId: step.id }
      });
    }

    // Validate data table if present
    if (step.dataTable) {
      const dataTableValidation = this.validateDataTable(step.dataTable);
      errors.push(...dataTableValidation.errors);
      warnings.push(...dataTableValidation.warnings);
    }

    // Validate doc string if present
    if (step.docString) {
      const docStringValidation = this.validateDocString(step.docString);
      errors.push(...docStringValidation.errors);
      warnings.push(...docStringValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates background according to Gherkin standards
   */
  validateBackground(background: Background): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check background steps
    if (!background.steps || background.steps.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Background must contain at least one step',
        location: { element: 'background', elementId: background.id }
      });
    } else {
      // Background should only contain Given steps
      background.steps.forEach((step, index) => {
        if (step.keyword !== 'فرض' && step.keyword !== 'و') {
          errors.push({
            type: 'logic',
            message: 'پس‌زمینه فقط باید شامل مراحل فرض باشد',
            location: { element: 'step', elementId: step.id }
          });
        }

        const stepValidation = this.validateStep(step, background.steps.slice(0, index));
        errors.push(...stepValidation.errors);
        warnings.push(...stepValidation.warnings);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates examples table according to Gherkin standards
   */
  validateExamples(examples: Examples): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check headers
    if (!examples.headers || examples.headers.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Examples must have headers',
        location: { element: 'examples', elementId: examples.id }
      });
    }

    // Check rows
    if (!examples.rows || examples.rows.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Examples must have at least one data row',
        location: { element: 'examples', elementId: examples.id }
      });
    }

    // Check row consistency
    if (examples.headers && examples.rows) {
      const headerCount = examples.headers.length;
      examples.rows.forEach((row, index) => {
        if (row.values.length !== headerCount) {
          errors.push({
            type: 'structure',
            message: `Row ${index + 1} has ${row.values.length} values but should have ${headerCount}`,
            location: { element: 'examples', elementId: examples.id, line: index + 1 }
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generates proper Gherkin text from a feature
   */
  generateGherkinText(feature: Feature, language: string = 'fa'): string {
    // Import فارسی‌سازی کلیدواژه‌ها
    const { feature: featureKey, background, scenario, scenarioOutline, examples, given, when, then, and, but, rule } = require('./gherkin-keywords').getGherkinKeywords(language);
    let text = '';

    // Feature header
    text += `${featureKey}: ${feature.name}\n`;

    // Feature description
    if (feature.description) {
      text += feature.description.split('\n').map(line => `  ${line}`).join('\n') + '\n';
    }

    // Feature tags
    if (feature.tags && feature.tags.length > 0) {
      text += `${feature.tags.join(' ')}\n`;
    }

    text += '\n';

    // Background
    if (feature.background && feature.background.steps.length > 0) {
      text += `${background}:\n`;
      feature.background.steps.forEach(step => {
        let keyword = { فرض: given, وقتی: when, آنگاه: then, و: and, اما: but }[step.keyword] || step.keyword;
        text += `  ${keyword} ${step.text}\n`;

        // SAFE CHECK: Add data table if present and valid
        if (step.dataTable) {
          if (step.dataTable.headers?.length) {
            text += `    | ${step.dataTable.headers.join(' | ')} |\n`;
          }
          if (step.dataTable.rows) {
            step.dataTable.rows.forEach(row => {
              text += `    | ${row.values?.join(' | ') || ''} |\n`;
            });
          }
        }

        // Add doc string if present
        if (step.docString) {
          text += `    """${step.docString.contentType ? step.docString.contentType : ''}\n`;
          text += step.docString.content.split('\n').map(line => `    ${line}`).join('\n') + '\n';
          text += `    """\n`;
        }
      });
      text += '\n';
    }

    // Rules
    if (Array.isArray(feature.rules)) {
      feature.rules.forEach(ruleObj => {
        // Rule tags
        if (ruleObj.tags && ruleObj.tags.length > 0) {
          text += `  ${ruleObj.tags.join(' ')}\n`;
        }

        // Rule header
        const ruleName = ruleObj.name || 'قانون';
        text += `  ${rule || 'قانون'}: ${ruleName}\n`;

        // Rule description
        if (ruleObj.description) {
          text += ruleObj.description.split('\n').map(line => `    ${line}`).join('\n') + '\n';
        }

        // Scenarios in rule
        ruleObj.scenarios.forEach(scenarioObj => {
          // Scenario tags
          if (scenarioObj.tags && scenarioObj.tags.length > 0) {
            text += `    ${scenarioObj.tags.join(' ')}\n`;
          }

          // Scenario header
          text += `    ${scenarioObj.type === 'scenario-outline' ? scenarioOutline : scenario}: ${scenarioObj.name}\n`;

          // Scenario description
          if (scenarioObj.description) {
            text += scenarioObj.description.split('\n').map(line => `      ${line}`).join('\n') + '\n';
          }

          // Scenario steps
          scenarioObj.steps.forEach(step => {
            let keyword = { فرض: given, وقتی: when, آنگاه: then, و: and, اما: but }[step.keyword] || step.keyword;
            text += `      ${keyword} ${step.text}\n`;

            // SAFE CHECK: Add data table if present and valid
            if (step.dataTable) {
              if (step.dataTable.headers?.length) {
                text += `        | ${step.dataTable.headers.join(' | ')} |\n`;
              }
              if (step.dataTable.rows) {
                step.dataTable.rows.forEach(row => {
                  text += `        | ${row.values?.join(' | ') || ''} |\n`;
                });
              }
            }

            // Add doc string if present
            if (step.docString) {
              text += `        """${step.docString.contentType ? step.docString.contentType : ''}\n`;
              text += step.docString.content.split('\n').map(line => `        ${line}`).join('\n') + '\n';
              text += `        """\n`;
            }
          });

          // SAFE CHECK: Examples for scenario outlines
          if (scenarioObj.type === 'scenario-outline' && scenarioObj.examples) {
            text += `\n        ${examples}:\n`;
            if (scenarioObj.examples.headers?.length) {
              text += `          | ${scenarioObj.examples.headers.join(' | ')} |\n`;
            }
            if (scenarioObj.examples.rows) {
              scenarioObj.examples.rows.forEach(row => {
                text += `          | ${row.values?.join(' | ') || ''} |\n`;
              });
            }
          }

          text += '\n';
        });
      });
    }

    // Direct scenarios (not in rules)
    feature.scenarios.forEach(scenarioObj => {
      // Scenario tags
      if (scenarioObj.tags && scenarioObj.tags.length > 0) {
        text += `  ${scenarioObj.tags.join(' ')}\n`;
      }

      // Scenario header
      text += `  ${scenarioObj.type === 'scenario-outline' ? scenarioOutline : scenario}: ${scenarioObj.name}\n`;

      // Scenario description
      if (scenarioObj.description) {
        text += scenarioObj.description.split('\n').map(line => `    ${line}`).join('\n') + '\n';
      }

      // Scenario steps
      scenarioObj.steps.forEach(step => {
        let keyword = { فرض: given, وقتی: when, آنگاه: then, و: and, اما: but }[step.keyword] || step.keyword;
        text += `    ${keyword} ${step.text}\n`;

        // SAFE CHECK: Add data table if present and valid
        if (step.dataTable) {
          if (step.dataTable.headers?.length) {
            text += `      | ${step.dataTable.headers.join(' | ')} |\n`;
          }
          if (step.dataTable.rows) {
            step.dataTable.rows.forEach(row => {
              text += `      | ${row.values?.join(' | ') || ''} |\n`;
            });
          }
        }

        // Add doc string if present
        if (step.docString) {
          text += `      """${step.docString.contentType ? step.docString.contentType : ''}\n`;
          text += step.docString.content.split('\n').map(line => `      ${line}`).join('\n') + '\n';
          text += `      """\n`;
        }
      });

      // SAFE CHECK: Examples for scenario outlines
      if (scenarioObj.type === 'scenario-outline' && scenarioObj.examples) {
        text += `\n    ${examples}:\n`;
        if (scenarioObj.examples.headers?.length) {
          text += `      | ${scenarioObj.examples.headers.join(' | ')} |\n`;
        }
        if (scenarioObj.examples.rows) {
          scenarioObj.examples.rows.forEach(row => {
            text += `      | ${row.values?.join(' | ') || ''} |\n`;
          });
        }
      }

      text += '\n';
    });

    return text.trim();
  }

  /**
   * Parses Gherkin text into a feature object
   */
  parseGherkinText(text: string): Feature {
    // This is a simplified parser - in a real implementation, you'd want a more robust parser
    const lines = text.split('\n');
    const feature: Feature = {
      id: nanoid(),
      name: '',
      description: '',
      tags: [],
      scenarios: [],
      isValid: true,
      order: 0,
    };

    let currentSection: 'feature' | 'background' | 'scenario' | 'examples' = 'feature';
    let currentScenario: Scenario | null = null;
    let currentBackground: Background | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('Feature:')) {
        feature.name = line.substring(8).trim();
      } else if (line.startsWith('Background:')) {
        currentSection = 'background';
        currentBackground = {
          id: nanoid(),
          steps: [],
          isValid: true
        };
      } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
        currentSection = 'scenario';
        if (currentScenario) {
          feature.scenarios.push(currentScenario);
        }
        currentScenario = {
          id: nanoid(),
          type: line.startsWith('Scenario Outline:') ? 'scenario-outline' : 'scenario',
          name: line.includes(':') ? line.substring(line.indexOf(':') + 1).trim() : '',
          description: '',
          tags: [],
          steps: [],
          isValid: true
        };
      } else if (line.startsWith('Examples:')) {
        currentSection = 'examples';
        if (currentScenario) {
          currentScenario.examples = {
            id: nanoid(),
            headers: [],
            rows: [],
            isValid: true
          };
        }
      } else if (line.startsWith('|') && currentSection === 'examples' && currentScenario?.examples) {
        const values = line.split('|').map(v => v.trim()).filter(v => v);
        if (currentScenario.examples.headers.length === 0) {
          currentScenario.examples.headers = values;
        } else {
          currentScenario.examples.rows.push({
            id: nanoid(),
            values
          });
        }
      } else if (line.match(/^(فرض|وقتی|آنگاه|و|اما)\s/)) {
        const match = line.match(/^(فرض|وقتی|آنگاه|و|اما)\s(.+)/);
        if (match) {
          const step: Step = {
            id: nanoid(),
            keyword: match[1] as Step['keyword'],
            text: match[2].trim(),
            isValid: true
          };

          if (currentSection === 'background' && currentBackground) {
            currentBackground.steps.push(step);
          } else if (currentSection === 'scenario' && currentScenario) {
            currentScenario.steps.push(step);
          }
        }
      } else if (line.startsWith('@') && !line.includes(':')) {
        // Tags
        const tags = line.split(/\s+/).filter(tag => tag.startsWith('@'));
        if (currentScenario) {
          currentScenario.tags.push(...tags);
        } else {
          feature.tags.push(...tags);
        }
      } else if (line && !line.startsWith('#') && currentSection === 'feature') {
        // Feature description
        if (feature.description) {
          feature.description += '\n' + line;
        } else {
          feature.description = line;
        }
      } else if (line && !line.startsWith('#') && currentSection === 'scenario' && currentScenario) {
        // Scenario description
        if (currentScenario.description) {
          currentScenario.description += '\n' + line;
        } else {
          currentScenario.description = line;
        }
      }
    }

    // Add the last scenario
    if (currentScenario) {
      feature.scenarios.push(currentScenario);
    }

    // Add background
    if (currentBackground) {
      feature.background = currentBackground;
    }

    return feature;
  }

  /**
   * Suggests the next step keyword based on current steps
   */
  suggestNextStepKeyword(steps: Step[]): Step['keyword'] {
    if (steps.length === 0) return 'فرض';

    const lastStep = steps[steps.length - 1];

    // If the last step was Given, suggest When
    if (lastStep.keyword === 'فرض') return 'وقتی';

    // If the last step was When, suggest Then
    if (lastStep.keyword === 'وقتی') return 'آنگاه';

    // If the last step was Then, suggest another Then or And
    if (lastStep.keyword === 'آنگاه') return 'و';

    // For And/But, continue with the same type as the previous non-And/But step
    const previousMainStep = steps.slice().reverse().find(step =>
      step.keyword !== 'و' && step.keyword !== 'اما'
    );

    if (previousMainStep) {
      if (previousMainStep.keyword === 'فرض') return 'و';
      if (previousMainStep.keyword === 'وقتی') return 'و';
      if (previousMainStep.keyword === 'آنگاه') return 'و';
    }

    return 'فرض';
  }

  /**
   * Validates a rule according to Gherkin standards
   */
  validateRule(rule: Rule): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check rule name
    if (!rule.name || rule.name.trim() === '') {
      errors.push({
        type: 'content',
        message: 'Rule must have a name',
        location: { element: 'rule', elementId: rule.id }
      });
    }

    // Check rule description (optional but recommended)
    if (!rule.description || rule.description.trim() === '') {
      warnings.push({
        type: 'best_practice',
        message: 'Consider adding a description to explain the rule\'s purpose',
        location: { element: 'rule', elementId: rule.id }
      });
    }

    // Validate scenarios in rule
    if (!rule.scenarios || rule.scenarios.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Rule must contain at least one scenario',
        location: { element: 'rule', elementId: rule.id }
      });
    } else {
      rule.scenarios.forEach((scenario, index) => {
        const scenarioValidation = this.validateScenario(scenario);
        errors.push(...scenarioValidation.errors.map(error => ({
          ...error,
          location: { ...error.location, line: index + 1 }
        })));
        warnings.push(...scenarioValidation.warnings.map(warning => ({
          ...warning,
          location: { ...warning.location, line: index + 1 }
        })));
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a data table according to Gherkin standards
   */
  validateDataTable(dataTable: DataTable): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check headers
    if (!dataTable.headers || dataTable.headers.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Data table must have headers',
        location: { element: 'datatable', elementId: dataTable.id }
      });
    }

    // Check rows
    if (!dataTable.rows || dataTable.rows.length === 0) {
      errors.push({
        type: 'structure',
        message: 'Data table must have at least one data row',
        location: { element: 'datatable', elementId: dataTable.id }
      });
    }

    // Check row consistency
    if (dataTable.headers && dataTable.rows) {
      const headerCount = dataTable.headers.length;
      dataTable.rows.forEach((row, index) => {
        if (row.values.length !== headerCount) {
          errors.push({
            type: 'structure',
            message: `Row ${index + 1} has ${row.values.length} values but should have ${headerCount}`,
            location: { element: 'datatable', elementId: dataTable.id, line: index + 1 }
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a doc string according to Gherkin standards
   */
  validateDocString(docString: DocString): GherkinValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check content
    if (!docString.content || docString.content.trim() === '') {
      errors.push({
        type: 'content',
        message: 'Doc string must have content',
        location: { element: 'docstring', elementId: docString.id }
      });
    }

    // Check content length
    if (docString.content && docString.content.length < 10) {
      warnings.push({
        type: 'style',
        message: 'Doc string content should be descriptive',
        location: { element: 'docstring', elementId: docString.id }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const gherkinBusinessLogic = new GherkinBusinessLogicService();