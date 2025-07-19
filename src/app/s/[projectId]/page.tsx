import { notFound } from 'next/navigation';
import { generateShortCode } from '@/lib/utils';
import { SharedProjectView } from '@/components/projects/shared-view';
import { prisma } from '@/lib/prisma';
import { Feature, Project,  StepType } from '@/types';
import { deepNormalizeFeature } from '@/lib/deepNormalize';

const projectWithDetailsInclude = {
    features: {
        include: {
            scenarios: {
                include: {
                    steps: true,
                    examples: true,
                },
            },
            background: {
                include: {
                    steps: true,
                },
            },
        },
    },
};

export default async function SharePage({
    params
}: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;

    const allProjects = await prisma.project.findMany({ 
        include: { 
            ...projectWithDetailsInclude, 
            user: true,
            features: {
                ...projectWithDetailsInclude.features,
                orderBy: { order: 'asc' }
            }
        } 
    });

    const project = allProjects.find((p: any) => {
        const shortCode = generateShortCode(p.id);
        return shortCode === projectId;
    });

    if (!project) {
        notFound();
    }

    // Transform project to match expected format
    const transformedProject: Project = {
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        features: project.features.map((f: any) => f.id),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        status: (project.status as any) ?? "active",
        authorName: (project.user?.firstName && project.user?.lastName)
            ? `${project.user.firstName} ${project.user.lastName}`
            : (project.user?.firstName || project.user?.lastName || project.user?.email || "بدون نام")
    };

    // Transform features to match expected format
    const transformedFeatures: Feature[] = project.features.map((feature: any) => deepNormalizeFeature({
        id: feature.id,
        name: feature.name,
        description: feature.description ?? undefined,
        tags: [],
        rules: feature.rulesJson ? JSON.parse(feature.rulesJson) : [],
        scenarios: feature.scenarios.map((scenario: any) => ({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description ?? undefined,
            type: scenario.type as "scenario" | "scenario-outline",
            tags: [],
            steps: scenario.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword as StepType,
                text: step.text
            })),
            examples: scenario.examples && Array.isArray(scenario.examples) && scenario.examples.length > 0
                ? {
                    id: scenario.examples[0].id,
                    headers: Array.isArray(scenario.examples[0].header) ? scenario.examples[0].header : [],
                    rows: Array.isArray(scenario.examples[0].body) ? scenario.examples[0].body.map((row: string[], idx: number) => ({
                        id: `row-${idx}`,
                        values: row
                    })) : []
                }
                : (scenario.examples && typeof scenario.examples === 'object' && scenario.examples.headers && scenario.examples.rows
                    ? scenario.examples
                    : undefined)
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword as StepType,
                text: step.text
            }))
        } : undefined,
        order: feature.order ?? 0,
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-8">
                <SharedProjectView project={transformedProject} features={transformedFeatures} />
            </div>
        </div>
    );
}