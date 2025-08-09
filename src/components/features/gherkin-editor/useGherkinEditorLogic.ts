import { useState, useEffect, useRef, useMemo } from "react";
import { Feature, Scenario, Step, Examples, Background } from "@/types/gherkin";
import { gherkinBusinessLogic } from "@/lib/gherkin-business-logic";
import isEqual from 'lodash/isEqual';
import { nanoid } from 'nanoid';
import { deepNormalizeFeature } from '@/lib/deepNormalize';

// --- BEGIN: Dirty state debug helpers ---
function normalizeFeature(feature: Feature): any {
    return {
        ...feature,
        scenarios: Array.isArray(feature.scenarios) ? feature.scenarios.map(scenario => ({
            ...scenario,
            steps: Array.isArray(scenario.steps) ? scenario.steps.map(step => ({
                ...step,
                dataTable: step.dataTable ? {
                    ...step.dataTable,
                    rows: Array.isArray(step.dataTable.rows) ? step.dataTable.rows.map(row => ({ values: row.values })) : []
                } : undefined,
                docString: step.docString ? { ...step.docString } : undefined
            })) : [],
            examples: scenario.examples ? {
                ...scenario.examples,
                rows: Array.isArray(scenario.examples.rows) ? scenario.examples.rows.map(row => ({ values: row.values })) : []
            } : undefined,
            tags: Array.isArray(scenario.tags) ? scenario.tags : []
        })) : [],
        background: feature.background ? {
            ...feature.background,
            steps: Array.isArray(feature.background.steps) ? feature.background.steps.map(step => ({
                ...step,
                dataTable: step.dataTable ? {
                    ...step.dataTable,
                    rows: Array.isArray(step.dataTable.rows) ? step.dataTable.rows.map(row => ({ values: row.values })) : []
                } : undefined,
                docString: step.docString ? { ...step.docString } : undefined
            })) : []
        } : undefined,
        rules: Array.isArray(feature.rules) ? feature.rules.map(rule => ({
            ...rule,
            scenarios: Array.isArray(rule.scenarios) ? rule.scenarios.map(scenario => ({
                ...scenario,
                steps: Array.isArray(scenario.steps) ? scenario.steps.map(step => ({
                    ...step,
                    dataTable: step.dataTable ? {
                        ...step.dataTable,
                        rows: Array.isArray(step.dataTable.rows) ? step.dataTable.rows.map(row => ({ values: row.values })) : []
                    } : undefined,
                    docString: step.docString ? { ...step.docString } : undefined
                })) : [],
                examples: scenario.examples ? {
                    ...scenario.examples,
                    rows: Array.isArray(scenario.examples.rows) ? scenario.examples.rows.map(row => ({ values: row.values })) : []
                } : undefined,
                tags: Array.isArray(scenario.tags) ? scenario.tags : []
            })) : []
        })) : [],
        tags: Array.isArray(feature.tags) ? feature.tags : [],
    };
}

// --- END: Dirty state debug helpers ---

// --- Helper to ensure all ids are present only at creation ---
function ensureStepIds(steps: Step[]): Step[] {
  return steps.map(st => {
    if (!st.id && process.env.NODE_ENV === 'development') {
      console.warn('Step without id detected!', st);
    }
    return { ...st, id: st.id || nanoid() };
  });
}
function ensureRowIds(rows: any[]): any[] {
  return rows.map(row => {
    if (!row.id && process.env.NODE_ENV === 'development') {
      console.warn('Row without id detected!', row);
    }
    return { ...row, id: row.id || nanoid() };
  });
}
function ensureExamplesIds(examples?: Examples): Examples | undefined {
  if (!examples) return undefined;
  if (!examples.id && process.env.NODE_ENV === 'development') {
    console.warn('Examples without id detected!', examples);
  }
  return {
    ...examples,
    id: examples.id || nanoid(),
    rows: ensureRowIds(examples.rows || [])
  };
}

// Move defaultFeature outside the hook
const defaultFeature: Feature = {
  name: '',
  scenarios: [],
  tags: [],
  rules: [],
  description: '',
  background: undefined,
  id: '',
  order: 0,
};

export function useGherkinEditorLogic(initialFeature: Feature, onFeatureChange?: (feature: Feature) => void) {
  // نرمالایز عمیق داده اولیه
  const normalizedInitial = deepNormalizeFeature(initialFeature);
  const [feature, setFeature] = useState<Feature>(normalizedInitial || defaultFeature);
  const [dirty, setDirty] = useState(false);
  const [showAddScenarioMenu, setShowAddScenarioMenu] = useState(false);
  const addScenarioButtonRef = useRef<HTMLButtonElement>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<{ id?: string; name: string; description: string } | null>(null);

  useEffect(() => {
    if (initialFeature) {
      setFeature(deepNormalizeFeature({ ...defaultFeature, ...initialFeature }));
      setDirty(false);
    }
    // Remove defaultFeature from dependencies
  }, [initialFeature]);

  useEffect(() => {
    const normFeature = normalizeFeature(feature);
    const normInitial = normalizeFeature(initialFeature || defaultFeature);
    const dirtyNow = !isEqual(normFeature, normInitial);
    if (dirty !== dirtyNow) setDirty(dirtyNow);
  }, [feature, initialFeature, dirty]);

  // Notify parent component when feature changes (but avoid initial trigger and loops)
  const isInitialMount = useRef(true);
  const lastNotifiedFeature = useRef<Feature | null>(null);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastNotifiedFeature.current = feature;
      return;
    }
    
    // Only notify if feature actually changed (deep comparison)
    if (onFeatureChange && feature !== lastNotifiedFeature.current) {
      const normCurrent = normalizeFeature(feature);
      const normLast = lastNotifiedFeature.current ? normalizeFeature(lastNotifiedFeature.current) : null;
      
      if (!normLast || !isEqual(normCurrent, normLast)) {
        lastNotifiedFeature.current = feature;
        onFeatureChange(feature);
      }
    }
  }, [feature, onFeatureChange]);

  const gherkinText = useMemo(() => {
    return gherkinBusinessLogic.generateGherkinText(feature);
  }, [feature]);

  // Handlers for rules
  const handleAddOrEditRule = (rule?: { id?: string; name: string; description: string }) => {
    setFeature(prev => {
      const rules = prev.rules ? [...prev.rules] : [];
      if (rule?.id) {
        const idx = rules.findIndex(r => r.id === rule.id);
        if (idx !== -1) rules[idx] = { ...rules[idx], ...rule };
      } else if (rule) {
        rules.push({
          id: `rule-${Date.now()}`,
          name: rule.name,
          description: rule.description,
          tags: [],
          scenarios: [],
        });
      }
      return { ...prev, rules };
    });
    setDirty(true);
    setShowRuleModal(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    setFeature(prev => ({
      ...prev,
      rules: prev.rules?.filter(r => r.id !== ruleId) || [],
    }));
    setDirty(true);
  };

  // Handlers for background
  const handleBackgroundChange = (background: Background | undefined) => {
    setFeature(prev => ({ ...prev, background }));
    setDirty(true);
  };

  const handleAddBackgroundStep = () => {
    setFeature(prev => {
      if (!prev.background) return prev;
      return {
        ...prev,
        background: {
          ...prev.background,
          steps: [
            ...prev.background.steps,
            { id: `step-${Date.now()}`, keyword: 'فرض', text: '' }
          ]
        }
      };
    });
    setDirty(true);
  };

  const handleEditBackgroundStep = (stepId: string, newText: string) => {
    setFeature(prev => {
      if (!prev.background) return prev;
      return {
        ...prev,
        background: {
          ...prev.background,
          steps: prev.background.steps.map(st =>
            st.id === stepId ? { ...st, text: newText } : st
          )
        }
      };
    });
    setDirty(true);
  };

  const handleEditBackgroundStepType = (stepId: string, newType: Step["keyword"]) => {
    setFeature(prev => {
      if (!prev.background) return prev;
      return {
        ...prev,
        background: {
          ...prev.background,
          steps: prev.background.steps.map(st =>
            st.id === stepId ? { ...st, keyword: newType } : st
          )
        }
      };
    });
    setDirty(true);
  };

  const handleDeleteBackgroundStep = (stepId: string) => {
    setFeature(prev => {
      if (!prev.background) return prev;
      return {
        ...prev,
        background: {
          ...prev.background,
          steps: prev.background.steps.filter(st => st.id !== stepId)
        }
      };
    });
    setDirty(true);
  };

  const handleDuplicateBackgroundStep = (stepId: string) => {
    setFeature(prev => {
      if (!prev.background) return prev;
      const stepToDup = prev.background.steps.find(st => st.id === stepId);
      if (!stepToDup) return prev;
      const idx = prev.background.steps.findIndex(st => st.id === stepId);
      const newSteps = [...prev.background.steps];
      newSteps.splice(idx + 1, 0, {
        ...stepToDup,
        id: `step-${Date.now()}`,
        text: stepToDup.text + ' (کپی)'
      });
      return {
        ...prev,
        background: {
          ...prev.background,
          steps: newSteps
        }
      };
    });
    setDirty(true);
  };

  const handleReorderBackgroundSteps = (newSteps: Step[]) => {
    setFeature(prev => {
      if (!prev.background) return prev;
      return {
        ...prev,
        background: {
          ...prev.background,
          steps: newSteps
        }
      };
    });
    setDirty(true);
  };

  // Handlers for scenarios
  const handleAddScenario = (type: "scenario" | "scenario-outline" = "scenario") => {
    const newScenario: Scenario = {
      id: nanoid(),
      type: type,
      name: "سناریوی جدید",
      description: "",
      tags: [],
      steps: [],
      ...(type === "scenario-outline" ? {
        examples: {
          id: nanoid(),
          headers: ["param1"],
          rows: [{ id: nanoid(), values: [""] }]
        }
      } : {})
    };
    setFeature(prev => ({
      ...prev,
      scenarios: [...(prev.scenarios || []), newScenario]
    }));
    setDirty(true);
  };

  const handleRenameScenario = (
    scenarioId: string,
    newTitle: string,
    newType: 'scenario' | 'scenario-outline',
    examples?: Examples,
    newDescription?: string
  ) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s =>
        s.id === scenarioId
          ? {
              ...s,
              name: newTitle,
              type: newType,
              description: newDescription ?? s.description,
              examples: newType === "scenario-outline"
                ? ensureExamplesIds(examples)
                : undefined
            }
          : s
      )
    }));
    setDirty(true);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).filter(s => s.id !== scenarioId)
    }));
    setDirty(true);
  };

  const handleDuplicateScenario = (scenarioId: string) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).flatMap(s =>
        s.id === scenarioId
          ? [
              s,
              {
                ...s,
                id: nanoid(),
                examples: s.examples ? {
                  ...s.examples,
                  id: nanoid(),
                  rows: ensureRowIds(s.examples.rows || [])
                } : undefined,
                steps: ensureStepIds((s.steps || []).map(st => ({ ...st, id: nanoid() })))
              }
            ]
          : [s]
      )
    }));
    setDirty(true);
  };

  // Handlers for steps in scenarios
  const handleAddStep = (scenarioId: string) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s =>
        s.id === scenarioId
          ? {
              ...s,
              steps: [
                ...s.steps,
                { id: nanoid(), keyword: "فرض", text: "" }
              ]
            }
          : s
      )
    }));
    setDirty(true);
  };

  const handleEditStep = (stepId: string, newText: string) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s => ({
        ...s,
        steps: s.steps.map(st =>
          st.id === stepId ? { ...st, text: newText } : st
        )
      }))
    }));
    setDirty(true);
  };

  const handleEditStepType = (stepId: string, newType: Step["keyword"]) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s => ({
        ...s,
        steps: s.steps.map(st =>
          st.id === stepId ? { ...st, keyword: newType } : st
        )
      }))
    }));
    setDirty(true);
  };

  const handleDeleteStep = (stepId: string) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s => ({
        ...s,
        steps: s.steps.filter(st => st.id !== stepId)
      }))
    }));
    setDirty(true);
  };

  const handleDuplicateStep = (stepId: string) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s => ({
        ...s,
        steps: (s.steps || []).flatMap(st =>
          st.id === stepId
            ? [st, { ...st, id: nanoid() }]
            : [st]
        )
      }))
    }));
    setDirty(true);
  };

  const handleReorderSteps = (scenarioId: string, newSteps: Step[]) => {
    setFeature(prev => ({
      ...prev,
      scenarios: (prev.scenarios || []).map(s =>
        s.id === scenarioId
          ? { ...s, steps: newSteps }
          : s
      )
    }));
    setDirty(true);
  };

  // Handler for reordering scenarios (DnD)
  const handleReorderScenarios = (newScenarios: Scenario[]) => {
    setFeature(prev => ({
      ...prev,
      scenarios: newScenarios,
    }));
    setDirty(true);
  };

  // Handler for changing feature name
  const handleFeatureNameChange = (newName: string) => {
    setFeature(prev => ({
      ...prev,
      name: newName,
    }));
    setDirty(true);
  };

  // Handler for changing feature description
  const handleFeatureDescriptionChange = (newDescription: string) => {
    setFeature(prev => ({
      ...prev,
      description: newDescription,
    }));
    setDirty(true);
  };

  return {
    feature,
    setFeature,
    dirty,
    setDirty,
    showAddScenarioMenu,
    setShowAddScenarioMenu,
    addScenarioButtonRef,
    showRuleModal,
    setShowRuleModal,
    editingRule,
    setEditingRule,
    gherkinText,
    handleAddOrEditRule,
    handleDeleteRule,
    handleBackgroundChange,
    handleAddBackgroundStep,
    handleEditBackgroundStep,
    handleEditBackgroundStepType,
    handleDeleteBackgroundStep,
    handleDuplicateBackgroundStep,
    handleReorderBackgroundSteps,
    handleAddScenario,
    handleRenameScenario,
    handleDeleteScenario,
    handleDuplicateScenario,
    handleAddStep,
    handleEditStep,
    handleEditStepType,
    handleDeleteStep,
    handleDuplicateStep,
    handleReorderSteps,
    handleReorderScenarios,
    handleFeatureNameChange,
    handleFeatureDescriptionChange,
  };
} 