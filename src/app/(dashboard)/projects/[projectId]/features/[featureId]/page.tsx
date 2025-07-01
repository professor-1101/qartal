import { notFound } from 'next/navigation';
import { Feature, Project, Scenario, Step } from "@/types/index";
import { GherkinEditor } from "@/components/features/gherkin-editor/gherkin-editor";
import { prisma } from '@/lib/prisma';

export default async function FeaturePage({
    params
}: {
    params: Promise<{ projectId: string; featureId: string }>
}) {
    const { projectId, featureId } = await params;

    // Fetch project and feature from database
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            features: {
                where: { id: featureId },
                include: {
                    scenarios: {
                        include: {
                            steps: true
                        }
                    },
                    background: {
                        include: {
                            steps: true
                        }
                    }
                }
            }
        }
    });

    if (!project || !project.features.length) {
        notFound();
    }

    const feature = project.features[0];

    // Transform feature to match expected format
    const transformedFeature: Feature = {
        id: feature.id,
        name: feature.name,
        description: feature.description ?? "",
        tags: [],
        scenarios: feature.scenarios.map((scenario: any) => ({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description ?? "",
            type: scenario.type,
            tags: [],
            steps: scenario.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text
            }))
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text
            }))
        } : undefined
    };

    return (
        <div className="h-full p-6" dir="rtl">
            <GherkinEditor
                feature={transformedFeature}
                onFeatureChange={() => { }}
            />
        </div>
    );
}