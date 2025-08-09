"use client";

import { useState, useEffect } from "react";
import { GherkinEditor } from "@/components/features/gherkin-editor/gherkin-editor";
import { Feature, Rule } from "@/types/gherkin";
import isEqual from "fast-deep-equal";
import React from 'react';
import { useAutoSave } from "@/components/providers/autosave-context";
import { toast } from "sonner";

// Update Scenario type to include keyword


interface ApiFeature {
    id: string;
    name: string;
    description: string;
    tags: string[];
    rulesJson: string | Rule[] | null;
    scenarios: ApiScenario[];
    background: ApiBackground | null;
    slang: string;
    createdAt: string;
    updatedAt: string;
}

interface ApiScenario {
    id: string;
    name: string;
    description: string;
    type: 'scenario' | 'scenario-outline';
    tags: string[];
    steps: ApiStep[];
    examples: ApiExamples[];
    keyword: string | null;
}

interface ApiExamples {
    id: string;
    header: string[] | null;
    body: string[][] | null;
}

interface ApiStep {
    id: string;
    keyword: string;
    text: string;
    argument: any;
}

interface ApiBackground {
    id: string;
    steps: ApiStep[];
}



function toApiFeature(feature: Feature): ApiFeature {
    const scenarios = (feature.scenarios || []).map(scenario => {
        const examples = scenario.examples ? [{
            id: scenario.examples.id,
            header: scenario.examples.headers || [],
            body: (scenario.examples.rows || []).map(row => row.values || [])
        }] : [];

        return {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description || "",
            type: scenario.type,
            tags: scenario.tags || [],
            steps: (scenario.steps || []).map(step => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text,
                argument: step.dataTable || step.docString || null
            })),
            examples,
            keyword: scenario.type === 'scenario-outline' ? "Scenario Outline" : "Scenario"
        };
    });

    return {
        id: feature.id,
        name: feature.name,
        description: feature.description || "",
        tags: feature.tags || [],
        rulesJson: feature.rules || [],
        scenarios,
        background: feature.background ? {
            id: feature.background.id,
            steps: (feature.background.steps || []).map(step => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text,
                argument: step.dataTable || step.docString || null
            }))
        } : null,
        slang: "gherkin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// تابع کمکی برای حذف idهای غیرمهم و نرمال‌سازی داده جهت مقایسه dirty
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

function isFeatureEmpty(feature: Feature): boolean {
    return (
        (!feature.name || feature.name.trim() === "") &&
        (!feature.description || feature.description.trim() === "") &&
        (!feature.tags || feature.tags.length === 0) &&
        (!feature.rules || feature.rules.length === 0) &&
        (!feature.scenarios || feature.scenarios.length === 0) &&
        (!feature.background || !feature.background.steps || feature.background.steps.length === 0)
    );
}

interface FeatureEditClientProps {
    project: { id: string };
    feature: Feature;
}

// Add error boundary for logging
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_error: unknown): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color:'red'}}>یک خطای غیرمنتظره رخ داد. جزییات در کنسول.</div>;
    }
    return this.props.children;
  }
}

export default function FeatureEditClient({ feature: initialFeature, project }: FeatureEditClientProps) {
    const [feature, setFeature] = useState<Feature>(initialFeature);
    const [dirty, setDirty] = useState(false);
    const [lastSavedFeature, setLastSavedFeature] = useState<Feature>(initialFeature);
    const { scheduleAutoSave, cancelAutoSave, isAutoSaveEnabled, setOnSaveSuccess } = useAutoSave();

    // ردیابی تغییرات dirty
    useEffect(() => {
        const normFeature = normalizeFeature(feature);
        const normLastSaved = normalizeFeature(lastSavedFeature);
        // Special case: if both are empty, never dirty
        if (isFeatureEmpty(normFeature) && isFeatureEmpty(normLastSaved)) {
            setDirty(false);
            return;
        }
        const dirtyNow = !isEqual(normFeature, normLastSaved);
        setDirty(dirtyNow);
        
        // Auto-save when feature changes and auto-save is enabled
        if (dirtyNow && isAutoSaveEnabled) {
            const apiFeature = toApiFeature(normFeature);
            scheduleAutoSave(feature.id, 'feature', apiFeature, project.id);
        } else if (!dirtyNow) {
            // Cancel auto-save if no changes
            cancelAutoSave(feature.id);
        }
        

    }, [feature, lastSavedFeature, isAutoSaveEnabled, scheduleAutoSave, cancelAutoSave, project.id]);

    // هشدار خروج در صورت تغییرات ذخیره‌نشده (فقط زمانی که auto-save غیرفعال است)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (dirty && !isAutoSaveEnabled) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty, isAutoSaveEnabled]);

    // Set up auto-save success callback
    useEffect(() => {
        const handleAutoSaveSuccess = (projectId: string) => {
            if (projectId === project.id) {
                // Update last saved feature to current feature
                setLastSavedFeature(feature);
                setDirty(false);
            }
        };
        
        setOnSaveSuccess(handleAutoSaveSuccess);
        
        return () => {
            setOnSaveSuccess(() => {});
        };
    }, [project.id, feature, setOnSaveSuccess]);

    // Cleanup auto-save on unmount
    useEffect(() => {
        return () => {
            cancelAutoSave(feature.id);
        };
    }, [cancelAutoSave, feature.id]);

    const handleFeatureChange = (updatedFeature: Feature) => {
        // Update the local state - dirty will be handled by useEffect
        setFeature(updatedFeature);
    };

    const handleManualSave = async () => {
        try {
            const normFeature = normalizeFeature(feature);
            const apiFeature = toApiFeature(normFeature);
            
            const response = await fetch(`/api/projects/${project.id}/features/${feature.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiFeature),
            });

            if (response.ok) {
                setLastSavedFeature(feature);
                setDirty(false);
                // Cancel any pending auto-save
                cancelAutoSave(feature.id);
                toast.success("تغییرات با موفقیت ذخیره شد", { duration: 2000 });
            } else if (response.status === 423) {
                const errorData = await response.json();
                toast.warning(errorData.error || "پروژه قفل است", { duration: 4000 });
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "خطا در ذخیره", { duration: 3000 });
            }
        } catch (error) {
            console.error('Manual save failed:', error);
            toast.error("خطا در اتصال به سرور", { duration: 3000 });
        }
    };

    return (
        <ErrorBoundary>
            <GherkinEditor
                feature={feature}
                dirty={dirty}
                onFeatureChange={handleFeatureChange}
                onManualSave={handleManualSave}
            />
        </ErrorBoundary>
    );
}