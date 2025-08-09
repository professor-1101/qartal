// no notFound; show friendly message if missing
import { prisma } from '@/lib/prisma';
import { StepType } from '@/types/gherkin';
import ProjectViewClient from '@/components/projects/ProjectViewClient';

export const dynamic = 'force-dynamic';

export default async function ProjectViewPage({ params }: { params: { projectId: string } }) {
    // Public view (no auth)
    const project = await prisma.project.findUnique({
        where: { id: params.projectId },
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            status: true,
            isLocked: true,
            slang: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    if (!project) {
        return (
            <div className="container-fluid" dir="rtl">
                <div className="max-w-xl mx-auto border rounded-lg p-6 text-center">
                    <h1 className="text-xl font-semibold mb-2">این پروژه در دسترس نیست</h1>
                    <p className="text-muted-foreground">ممکن است پروژه حذف شده باشد.</p>
                </div>
            </div>
        );
    }

    // Fetch features
    const featuresFromDb = await prisma.feature.findMany({
        where: { projectId: project.id },
        include: {
            scenarios: {
                include: {
                    steps: true,
                    examples: true
                }
            },
            background: {
                include: {
                    steps: true
                }
            }
        },
        orderBy: { order: 'asc' }
    });

    // Fetch latest approved version
    const latestApprovedVersion = await prisma.projectVersion.findFirst({
        where: {
            projectId: project.id,
            status: 'APPROVED'
        },
        orderBy: { createdAt: 'desc' },
        include: {
            approvedBy: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

    

    // Transform features to match the expected format
    const features: any[] = featuresFromDb.map(feature => ({
        id: feature.id,
        name: feature.name,
        description: feature.description || undefined,
        order: feature.order,
        tags: feature.tags || [],
        scenarios: feature.scenarios.map(scenario => ({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description || undefined,
                        order: (scenario as any).order || 0,
            type: 'scenario',
            tags: [],
            steps: scenario.steps.map(step => ({
                id: step.id,
                type: (step.keyword as StepType),
                text: step.text,
                keyword: step.keyword as StepType,
                order: (step as any).order || 0
            })),
                examples: scenario.examples.map(example => ({
                    id: example.id,
                    headers: Array.isArray(example.header)
                      ? example.header
                      : typeof example.header === 'string'
                        ? (() => { try { return JSON.parse(example.header as unknown as string); } catch { return []; } })()
                        : (example.header ?? []),
                    rows: Array.isArray(example.body)
                      ? example.body
                      : typeof example.body === 'string'
                        ? (() => { try { return JSON.parse(example.body as unknown as string); } catch { return []; } })()
                        : (example.body ?? [])
                }))
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map(step => ({
                id: step.id,
                type: (step.keyword as StepType),
                text: step.text,
                keyword: step.keyword as StepType,
                order: (step as any).order || 0
            }))
        } : undefined
    }));

    return (
        <ProjectViewClient 
            project={project as any} 
            features={features}
            approvedFeatures={features}
            latestApprovedVersion={latestApprovedVersion}
        />
    );
}
