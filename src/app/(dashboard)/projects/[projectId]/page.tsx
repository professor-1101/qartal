import { notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/projects/ProjectDetailsClient';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { getServerSession } from 'next-auth';
import { Project } from '@/types';
import { Feature, Scenario, Step, StepType } from '@/types/gherkin';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Define a type for the data returned from Prisma for type safety
const featureWithDetails = Prisma.validator<Prisma.FeatureDefaultArgs>()({
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
});

type FeatureWithDetails = Prisma.FeatureGetPayload<typeof featureWithDetails>;


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
    });

    // If no project is found, it's a 404 for this user.
    if (!project) {
        return notFound();
    }

    // If project exists, fetch its features using the pre-defined include structure
    const featuresFromDb = await prisma.feature.findMany({
        where: { projectId: project.id },
        include: featureWithDetails.include,
    });

    // Transform data for the client component
    const transformedProject: Project = {
        id: project.id,
        name: project.name,
        description: project.description ?? '',
        features: featuresFromDb.map(f => f.id),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        status: project.status as "active" | "archived" | "draft",
        teamSize: 1, // Placeholder
    };

    const transformedFeatures: Feature[] = featuresFromDb.map((feature: FeatureWithDetails): Feature => ({
        ...feature,
        tags: [], // Add empty tags array
        description: feature.description ?? undefined, // Handle null description
        scenarios: (feature.scenarios || []).map((s): Scenario => ({
            ...s,
            type: s.type as "scenario" | "scenario-outline",
            tags: [], // Add empty tags array
            description: s.description ?? undefined, // Handle null description
            steps: s.steps.map((step): Step => ({
                ...step,
                keyword: step.keyword as StepType,
            })),
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map((step): Step => ({
                ...step,
                keyword: step.keyword as StepType,
            })),
        } : undefined,
    }));

    return (
        <ProjectDetailsClient project={transformedProject} features={transformedFeatures} />
    );
}