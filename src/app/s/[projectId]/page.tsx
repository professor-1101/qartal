import { notFound } from 'next/navigation';
import { generateShortCode } from '@/lib/utils';
import { SharedProjectView } from '@/components/projects/shared-view';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Feature, Project, Step, Scenario, StepType } from '@/types';

const projectWithDetails = Prisma.validator<Prisma.ProjectDefaultArgs>()({
    include: {
        features: {
            include: {
                scenarios: {
                    include: {
                        steps: true,
                    },
                },
                background: {
                    include: {
                        steps: true,
                    },
                },
            },
        },
    },
});

type ProjectWithDetails = Prisma.ProjectGetPayload<typeof projectWithDetails>;

export default async function SharePage({
    params
}: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;

    const allProjects = await prisma.project.findMany(projectWithDetails);

    const project = allProjects.find((p: ProjectWithDetails) => {
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
        features: project.features.map(f => f.id),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        status: (project.status as any) ?? "active",
        teamSize: 1
    };

    // Transform features to match expected format
    const transformedFeatures: Feature[] = project.features.map(feature => ({
        id: feature.id,
        name: feature.name,
        description: feature.description ?? undefined,
        tags: [],
        scenarios: feature.scenarios.map(scenario => ({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description ?? undefined,
            type: scenario.type as "scenario" | "scenario-outline",
            tags: [],
            steps: scenario.steps.map(step => ({
                id: step.id,
                keyword: step.keyword as StepType,
                text: step.text
            }))
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map(step => ({
                id: step.id,
                keyword: step.keyword as StepType,
                text: step.text
            }))
        } : undefined
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-8">
                <SharedProjectView project={transformedProject} features={transformedFeatures} />
            </div>
        </div>
    );
}