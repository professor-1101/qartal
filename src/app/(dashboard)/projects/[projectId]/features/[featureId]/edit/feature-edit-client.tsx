"use client";

import { useState } from "react";
import { GherkinEditor } from "@/components/features/gherkin-editor/gherkin-editor";
import { Feature, Rule, Scenario, Step, Examples, Background } from "@/types/gherkin";
import { toast } from "sonner";

// Update Scenario type to include keyword
type EditorScenario = Scenario & {
    keyword?: string;
};

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
                    id: `row-${index}-${Date.now()}`,
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
        background
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

interface FeatureEditClientProps {
    project: { id: string };
    feature: Feature;
}

export default function FeatureEditClient({ feature: initialFeature, project }: FeatureEditClientProps) {
    const [feature, setFeature] = useState<Feature>(initialFeature);

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
            console.error("Error saving feature:", error);
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