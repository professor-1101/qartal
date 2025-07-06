import { notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/projects/ProjectDetailsClient';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { getServerSession } from 'next-auth';
import { Project } from '@/types';
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
        select: { id: true },
    });

    if (!user) {
        // User in session does not exist in DB.
        return notFound();
    }

    // --- The Correct Way to Fetch by ID and Ownership ---
    // Use `findFirst` to apply multiple `where` conditions.
    const project = await prisma.project.findFirst({
        where: {
            id: params.projectId,
            userId: user.id, // Security: Ensures the project belongs to the current user.
        },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

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
    const transformedProject: Project = {
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        features: featuresFromDb.map((f: any) => f.id),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        status: project.status as "active" | "archived" | "draft",
        authorName: (project.user?.firstName && project.user?.lastName)
            ? `${project.user.firstName} ${project.user.lastName}`
            : (project.user?.firstName || project.user?.lastName || project.user?.email || "بدون نام")
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
        <ProjectDetailsClient project={transformedProject} features={transformedFeatures} />
    );
}