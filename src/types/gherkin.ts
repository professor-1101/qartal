// FILE: src/types/gherkin.ts
// This file centralizes all types related to the Gherkin domain model.

export type StepType = "فرض" | "وقتی" | "آنگاه" | "و" | "اما";

export interface DataTable {
  id: string;
  headers: string[];
  rows: Array<{ id: string; values: string[] }>;
}

export interface DocString {
  id: string;
  contentType?: string;
  content: string;
}

export interface Step {
  id: string;
  keyword: StepType;
  text: string;
  dataTable?: DataTable;
  docString?: DocString;
  isValid?: boolean;
  validationMessage?: string;
}

export interface Examples {
  id: string;
  headers: string[];
  rows: Array<{ id: string; values: string[] }>;
  isValid?: boolean;
  validationMessage?: string;
}

export interface Background {
  id: string;
  steps: Step[];
  isValid?: boolean;
  validationMessage?: string;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  scenarios: Scenario[];
  isValid?: boolean;
  validationMessage?: string;
}

export interface Scenario {
  id: string;
  type: "scenario" | "scenario-outline";
  name: string;
  description?: string;
  tags: string[];
  steps: Step[];
  examples?: Examples;
  isValid?: boolean;
  validationMessage?: string;
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  background?: Background;
  rules?: Rule[];
  scenarios: Scenario[];
  order: number;
  isValid?: boolean;
  validationMessage?: string;
}

export interface GherkinValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'syntax' | 'structure' | 'logic' | 'content';
  message: string;
  location?: {
    line?: number;
    column?: number;
    element?: 'feature' | 'background' | 'scenario' | 'step' | 'examples' | 'rule' | 'datatable' | 'docstring';
    elementId?: string;
  };
}

export interface ValidationWarning {
  type: 'style' | 'best_practice' | 'suggestion';
  message: string;
  location?: {
    line?: number;
    column?: number;
    element?: 'feature' | 'background' | 'scenario' | 'step' | 'examples' | 'rule' | 'datatable' | 'docstring';
    elementId?: string;
  };
}

export interface GherkinBusinessLogic {
  validateFeature: (feature: Feature) => GherkinValidation;
  validateScenario: (scenario: Scenario) => GherkinValidation;
  validateStep: (step: Step, previousSteps?: Step[]) => GherkinValidation;
  validateBackground: (background: Background) => GherkinValidation;
  validateExamples: (examples: Examples) => GherkinValidation;
  validateRule: (rule: Rule) => GherkinValidation;
  validateDataTable: (dataTable: DataTable) => GherkinValidation;
  validateDocString: (docString: DocString) => GherkinValidation;
  generateGherkinText: (feature: Feature) => string;
  parseGherkinText: (text: string) => Feature;
}

export type FeatureAction =
  | { type: "UPDATE_FEATURE_HEADER"; payload: { title?: string; description?: string } }
  | { type: "ADD_FEATURE_TAG"; payload: string }
  | { type: "REMOVE_FEATURE_TAG"; payload: number }
  | { type: "ADD_BACKGROUND_STEP" }
  | { type: "DELETE_BACKGROUND_STEP"; payload: { stepId: string } }
  | { type: "UPDATE_BACKGROUND_STEP"; payload: { stepId: string; data: Partial<Step> } }
  | { type: "REORDER_BACKGROUND_STEPS"; payload: { activeId: string; overId: string } }
  | { type: "ADD_RULE"; payload: { name: string; description?: string } }
  | { type: "DELETE_RULE"; payload: { ruleId: string } }
  | { type: "UPDATE_RULE"; payload: { ruleId: string; data: Partial<Pick<Rule, 'name' | 'description'>> } }
  | { type: "ADD_RULE_TAG"; payload: { ruleId: string; tag: string } }
  | { type: "REMOVE_RULE_TAG"; payload: { ruleId: string; tagIndex: number } }
  | { type: "ADD_SCENARIO"; payload: { type: "scenario" | "outline"; ruleId?: string } }
  | { type: "DELETE_SCENARIO"; payload: { scenarioId: string } }
  | { type: "UPDATE_SCENARIO"; payload: { scenarioId: string; data: Partial<Pick<Scenario, 'name' | 'description'>> } }
  | { type: "ADD_SCENARIO_TAG"; payload: { scenarioId: string; tag: string } }
  | { type: "REMOVE_SCENARIO_TAG"; payload: { scenarioId: string; tagIndex: number } }
  | { type: "ADD_STEP"; payload: { scenarioId: string } }
  | { type: "DELETE_STEP"; payload: { scenarioId: string; stepId: string } }
  | { type: "UPDATE_STEP"; payload: { scenarioId: string; stepId: string; data: Partial<Step> } }
  | { type: "REORDER_STEPS"; payload: { scenarioId: string; activeId: string; overId: string } }
  | { type: "ADD_STEP_DATA_TABLE"; payload: { scenarioId: string; stepId: string } }
  | { type: "DELETE_STEP_DATA_TABLE"; payload: { scenarioId: string; stepId: string } }
  | { type: "UPDATE_DATA_TABLE_CELL"; payload: { scenarioId: string; stepId: string; rowIndex: number; colIndex: number; value: string } }
  | { type: "UPDATE_DATA_TABLE_HEADER"; payload: { scenarioId: string; stepId: string; colIndex: number; value: string } }
  | { type: "ADD_DATA_TABLE_ROW"; payload: { scenarioId: string; stepId: string } }
  | { type: "DELETE_DATA_TABLE_ROW"; payload: { scenarioId: string; stepId: string; rowIndex: number } }
  | { type: "ADD_DATA_TABLE_COL"; payload: { scenarioId: string; stepId: string } }
  | { type: "DELETE_DATA_TABLE_COL"; payload: { scenarioId: string; stepId: string; colIndex: number } }
  | { type: "ADD_STEP_DOC_STRING"; payload: { scenarioId: string; stepId: string } }
  | { type: "DELETE_STEP_DOC_STRING"; payload: { scenarioId: string; stepId: string } }
  | { type: "UPDATE_DOC_STRING"; payload: { scenarioId: string; stepId: string; content: string; contentType?: string } }
  | { type: "UPDATE_EXAMPLE_CELL"; payload: { scenarioId: string; rowIndex: number; colIndex: number; value: string } }
  | { type: "UPDATE_EXAMPLE_HEADER"; payload: { scenarioId: string; colIndex: number; value: string } }
  | { type: "ADD_EXAMPLE_ROW"; payload: { scenarioId: string } }
  | { type: "DELETE_EXAMPLE_ROW"; payload: { scenarioId: string; rowIndex: number } }
  | { type: "ADD_EXAMPLE_COL"; payload: { scenarioId: string } }
  | { type: "DELETE_EXAMPLE_COL"; payload: { scenarioId: string; colIndex: number } };
