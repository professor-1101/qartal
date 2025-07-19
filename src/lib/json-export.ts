import { Feature } from '@/types/gherkin';

export interface JSONExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
  includeComments?: boolean;
  exportFormat?: 'gherkin' | 'json' | 'cucumber';
}

export class JSONExportService {
  private defaultOptions: JSONExportOptions = {
    includeMetadata: true,
    prettyPrint: true,
    includeComments: true,
    exportFormat: 'json'
  };

  exportFeatureAsJSON(feature: Feature, options: JSONExportOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    const exportData: any = {
      feature: {
        name: feature.name,
        description: feature.description,
        tags: feature.tags || [],
      }
    };

    // Add metadata if requested
    if (opts.includeMetadata) {
      exportData.metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        format: opts.exportFormat,
        totalScenarios: feature.scenarios.length,
        hasBackground: !!feature.background && feature.background.steps.length > 0
      };
    }

    // Add background if exists
    if (feature.background && feature.background.steps.length > 0) {
      exportData.feature.background = {
        steps: feature.background.steps.map(step => ({
          keyword: step.keyword,
          text: step.text
        }))
      };
    }

    // Add scenarios
    exportData.feature.scenarios = feature.scenarios.map(scenario => {
      const scenarioData: any = {
        name: scenario.name,
        description: scenario.description,
        type: scenario.type,
        tags: scenario.tags || [],
        steps: scenario.steps.map(step => ({
          keyword: step.keyword,
          text: step.text
        }))
      };

      // Add examples for scenario outlines
      if (scenario.type === 'scenario-outline' && scenario.examples) {
        scenarioData.examples = {
          headers: scenario.examples.headers,
          rows: scenario.examples.rows.map(row => ({
            values: row.values
          }))
        };
      }

      return scenarioData;
    });

    // Return formatted JSON
    return opts.prettyPrint 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  }

  exportFeatureAsGherkinJSON(feature: Feature, options: JSONExportOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options, exportFormat: 'gherkin' };
    
    // Convert to Gherkin JSON format (compatible with Cucumber)
    const gherkinData: any = {
      gherkinDocument: {
        feature: {
          name: feature.name,
          description: feature.description ? feature.description : '',
          tags: feature.tags?.map(tag => ({ name: tag })) || [],
          language: 'en',
          children: []
        }
      }
    };

    // Add background
    if (feature.background && feature.background.steps.length > 0) {
      gherkinData.gherkinDocument.feature.children.push({
        background: {
          steps: feature.background.steps.map(step => ({
            keyword: step.keyword,
            text: step.text,
            location: { line: 1, column: 1 }
          }))
        }
      });
    }

    // Add scenarios
    if (Array.isArray(feature.scenarios)) {
      feature.scenarios.forEach(scenario => {
        const scenarioData: any = {
          scenario: {
            name: scenario.name,
            description: scenario.description ? scenario.description : '',
            tags: scenario.tags?.map(tag => ({ name: tag })) || [],
            steps: scenario.steps.map(step => ({
              keyword: step.keyword,
              text: step.text,
              location: { line: 1, column: 1 }
            }))
          }
        };

        // Add examples for scenario outlines
        if (scenario.type === 'scenario-outline' && scenario.examples) {
          scenarioData.scenario.examples = [{
            name: '',
            tags: [],
            line: 1,
            tableHeader: {
              cells: scenario.examples.headers.map(header => ({ value: header }))
            },
            tableBody: scenario.examples.rows.map(row => ({
              cells: row.values.map(value => ({ value }))
            }))
          }];
        }

        gherkinData.gherkinDocument.feature.children.push(scenarioData);
      });
    }

    return opts.prettyPrint 
      ? JSON.stringify(gherkinData, null, 2)
      : JSON.stringify(gherkinData);
  }

  exportFeatureAsCucumberJSON(feature: Feature, options: JSONExportOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options, exportFormat: 'cucumber' };
    
    // Convert to Cucumber JSON format
    const cucumberData: any[] = [{
      id: feature.id || 'feature-1',
      name: feature.name,
      description: feature.description || '',
      keyword: 'Feature',
      line: 1,
      tags: feature.tags?.map(tag => ({ name: tag, line: 1 })) || [],
      elements: []
    }];

    let elementId = 1;

    // Add background as first element
    if (feature.background && feature.background.steps.length > 0) {
      cucumberData[0].elements.push({
        id: `background-${elementId++}`,
        name: 'Background',
        description: '',
        keyword: 'Background',
        line: 1,
        type: 'background',
        steps: feature.background.steps.map(step => ({
          keyword: step.keyword,
          name: step.text,
          line: 1,
          result: { status: 'passed', duration: 0 }
        }))
      });
    }

    // Add scenarios
    if (Array.isArray(feature.scenarios)) {
      feature.scenarios.forEach((scenario, index) => {
        const scenarioData: any = {
          id: scenario.id || `scenario-${index + 1}`,
          name: scenario.name,
          description: scenario.description || '',
          keyword: scenario.type === 'scenario-outline' ? 'Scenario Outline' : 'Scenario',
          line: 1,
          type: scenario.type === 'scenario-outline' ? 'scenario_outline' : 'scenario',
          tags: scenario.tags?.map(tag => ({ name: tag, line: 1 })) || [],
          steps: scenario.steps.map(step => ({
            keyword: step.keyword,
            name: step.text,
            line: 1,
            result: { status: 'passed', duration: 0 }
          }))
        };

        // Add examples for scenario outlines
        if (scenario.type === 'scenario-outline' && scenario.examples) {
          scenarioData.examples = [{
            name: '',
            tags: [],
            line: 1,
            tableHeader: {
              cells: scenario.examples.headers.map(header => ({ value: header }))
            },
            tableBody: scenario.examples.rows.map(row => ({
              cells: row.values.map(value => ({ value }))
            }))
          }];
        }

        cucumberData[0].elements.push(scenarioData);
      });
    }

    return opts.prettyPrint 
      ? JSON.stringify(cucumberData, null, 2)
      : JSON.stringify(cucumberData);
  }
}

export const jsonExportService = new JSONExportService();  