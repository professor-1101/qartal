import { notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/projects/ProjectDetailsClient';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { getServerSession } from 'next-auth';

import { Feature, StepType } from '@/types/gherkin';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
        // User not logged in, cannot access the page.
        return notFound();
    }

    const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { 
            id: true,
            isSuper: true 
        },
    });

    if (!user) {
        // User in session does not exist in DB.
        return notFound();
    }

    // --- Fetch Project with Ownership Check ---
    let project;
    
    if (user.isSuper) {
        // Super users can view any project
        project = await prisma.project.findUnique({
            where: {
                id: params.projectId,
            },
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
    } else {
        // Regular users can only view their own projects
        project = await prisma.project.findFirst({
            where: {
                id: params.projectId,
                userId: user.id, // Security: Ensures the project belongs to the current user.
            },
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
    }

    // If no project is found, it's a 404 for this user.
    if (!project) {
        return notFound();
    }

    // If project exists, fetch its features using the pre-defined include structure
    const featuresFromDb = await prisma.feature.findMany({
        where: { projectId: project.id },
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
        orderBy: { order: 'asc' },
    });

    // Transform data for the client component
    const transformedProject = {
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        slang: project.slang,
        isLocked: project.isLocked,
        user: {
            id: (project.user as any)?.id || '',
            firstName: project.user?.firstName || undefined,
            lastName: project.user?.lastName || undefined,
            email: project.user?.email || ''
        }
    };

    const transformedFeatures: Feature[] = featuresFromDb.map((feature: any): Feature => ({
        id: feature.id,
        name: feature.name,
        description: feature.description ?? undefined,
        tags: feature.tags ?? [],
        rules: feature.rulesJson ? JSON.parse(feature.rulesJson) : [],
        scenarios: feature.scenarios.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description ?? undefined,
            type: s.type as "scenario" | "scenario-outline",
            tags: [],
            steps: s.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword as StepType,
                text: step.text
            })),
            examples: s.examples && s.examples.length > 0 ? {
                id: s.examples[0].id,
                headers: Array.isArray(s.examples[0].header) ? s.examples[0].header : [],
                rows: Array.isArray(s.examples[0].body) ? s.examples[0].body.map((row: string[], idx: number) => ({
                    id: `row-${idx}`,
                    values: row
                })) : []
            } : undefined
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
        <ProjectDetailsClient project={transformedProject as any} features={transformedFeatures} />
    );
}