"use client";

import { useState, useEffect } from "react";
import { GherkinEditor } from "@/components/features/gherkin-editor/gherkin-editor";
import { Feature, Rule, Scenario, Step, Examples, Background } from "@/types/gherkin";
import { toast } from "sonner";
import isEqual from "fast-deep-equal";

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

function transformFeature(apiFeature: ApiFeature): Feature {
    let rules: Rule[] = [];
    if (apiFeature.rulesJson) {
        try {
            rules = typeof apiFeature.rulesJson === 'string'
                ? JSON.parse(apiFeature.rulesJson)
                : apiFeature.rulesJson;
        } catch (error) {
            console.error("Error parsing rules JSON:", error);
            rules = [];
        }
    }

    const scenarios: Scenario[] = apiFeature.scenarios.map(apiScenario => {
        const steps: Step[] = apiScenario.steps.map(apiStep => ({
            id: apiStep.id,
            keyword: apiStep.keyword as Step["keyword"],
            text: apiStep.text,
            argument: apiStep.argument
        }));

        let examples: Examples | undefined;
        if (apiScenario.examples && apiScenario.examples.length > 0) {
            const firstExample = apiScenario.examples[0];
            examples = {
                id: firstExample.id,
                headers: firstExample.header || [],
                rows: (firstExample.body || []).map((row, index) => ({
                    id: `row-${index}`,
                    values: row
                }))
            };
        }

        return {
            id: apiScenario.id,
            name: apiScenario.name,
            description: apiScenario.description || "",
            type: apiScenario.type,
            tags: apiScenario.tags || [],
            steps,
            examples
        };
    });

    let background: Background | undefined;
    if (apiFeature.background) {
        background = {
            id: apiFeature.background.id,
            steps: apiFeature.background.steps.map(apiStep => ({
                id: apiStep.id,
                keyword: apiStep.keyword as Step["keyword"],
                text: apiStep.text,
                argument: apiStep.argument
            }))
        };
    }

    return {
        id: apiFeature.id,
        name: apiFeature.name,
        description: apiFeature.description || "",
        tags: apiFeature.tags || [],
        rules,
        scenarios,
        background,
        order: (apiFeature as any).order ?? 0,
    };
}

function toApiFeature(feature: Feature): any {
    const scenarios = feature.scenarios.map(scenario => {
        const examples = scenario.examples ? [{
            id: scenario.examples.id,
            header: scenario.examples.headers,
            body: scenario.examples.rows.map(row => row.values)
        }] : [];

        return {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            type: scenario.type,
            tags: scenario.tags || [],
            steps: scenario.steps,
            examples,
            // Add keyword to API scenario
            keyword: scenario.type === 'scenario-outline' ? "Scenario Outline" : "Scenario"
        };
    });

    return {
        ...feature,
        rulesJson: JSON.stringify(feature.rules),
        scenarios,
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps
        } : null
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

// تابع diff ساده برای مقایسه objectها و نمایش تفاوت‌ها
function diffObjects(obj1: any, obj2: any, path = ""): string[] {
    const diffs: string[] = [];
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    for (const key of Array.from(allKeys)) {
        const val1 = obj1 ? obj1[key] : undefined;
        const val2 = obj2 ? obj2[key] : undefined;
        const currentPath = path ? `${path}.${key}` : key;
        if (Array.isArray(val1) && Array.isArray(val2)) {
            if (val1.length !== val2.length) {
                diffs.push(`${currentPath}: length ${val1.length} !== ${val2.length}`);
            } else {
                for (let i = 0; i < val1.length; i++) {
                    diffs.push(...diffObjects(val1[i], val2[i], `${currentPath}[${i}]`));
                }
            }
        } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
            diffs.push(...diffObjects(val1, val2, currentPath));
        } else if (val1 !== val2) {
            diffs.push(`${currentPath}: ${JSON.stringify(val1)} !== ${JSON.stringify(val2)}`);
        }
    }
    return diffs;
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

export default function FeatureEditClient({ feature: initialFeature, project }: FeatureEditClientProps) {
    const [feature, setFeature] = useState<Feature>(initialFeature);
    const [dirty, setDirty] = useState(false);

    // ردیابی تغییرات dirty
    useEffect(() => {
        const normFeature = normalizeFeature(feature);
        const normInitial = normalizeFeature(initialFeature);
        // Special case: if both are empty, never dirty
        if (isFeatureEmpty(normFeature) && isFeatureEmpty(normInitial)) {
            setDirty(false);
            return;
        }
        const dirtyNow = !isEqual(normFeature, normInitial);
        setDirty(dirtyNow);
        if (dirtyNow) {
            // eslint-disable-next-line no-console
            const diffs = diffObjects(normFeature, normInitial);
            if (diffs.length === 0) {
                console.log('[DIRTY DEBUG] تفاوتی پیدا نشد ولی dirty=true!');
            } else {
                console.log('[DIRTY DEBUG] لیست دقیق تغییرات (unsaved changes):');
                diffs.forEach((d, i) => {
                    console.log(`  ${i + 1}. ${d}`);
                });
            }
            // برای بررسی بیشتر، آبجکت کامل را هم چاپ کن
            console.log('[DIRTY DEBUG] feature فعلی:', normFeature);
            console.log('[DIRTY DEBUG] feature اولیه:', normInitial);
        }
    }, [feature, initialFeature]);

    // هشدار خروج در صورت تغییرات ذخیره‌نشده
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty]);

    const handleFeatureChange = async (updatedFeature: Feature) => {
        try {
            const apiFeature = toApiFeature(updatedFeature);

            const response = await fetch(`/api/projects/${project.id}/features/${feature.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiFeature),
            });

            if (!response.ok) {
                throw new Error('Failed to save feature');
            }

            const savedFeature: ApiFeature = await response.json();
            setFeature(transformFeature(savedFeature));
            toast.success("ویژگی با موفقیت ذخیره شد!");
        } catch (error) {
            toast.error("ذخیره ویژگی با خطا مواجه شد.");
        }
    };

    return (
        <GherkinEditor
            feature={feature}
            onFeatureChange={handleFeatureChange}
        />
    );
}