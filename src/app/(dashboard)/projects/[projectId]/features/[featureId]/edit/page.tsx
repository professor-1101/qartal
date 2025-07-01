import { notFound } from 'next/navigation';
import { Feature as TransformedFeature } from "@/types/index";
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import FeatureEditClient from './feature-edit-client';

export const dynamic = 'force-dynamic';

export default async function FeatureEditPage({
    params
}: {
    params: { projectId: string; featureId: string }
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return notFound();
    }

    const { projectId, featureId } = params;

    const feature = await prisma.feature.findFirst({
        where: {
            id: featureId,
            projectId: projectId,
            project: {
                userId: session.user.id,
            },
        },
        include: {
            scenarios: {
                include: {
                    steps: true,
                    examples: true,
                }
            },
            background: {
                include: {
                    steps: true
                }
            },
            project: {
                select: {
                    id: true,
                }
            }
        }
    });

    if (!feature) {
        return notFound();
    }

    const transformedFeature: TransformedFeature = {
        id: feature.id,
        name: feature.name,
        description: feature.description ?? "",
        tags: feature.tags,
        scenarios: feature.scenarios.map((scenario: any) => ({
            id: scenario.id,
            name: scenario.name,
            description: scenario.description ?? "",
            type: scenario.type,
            keyword: scenario.keyword ?? (scenario.type === 'scenario-outline' ? "Scenario Outline" : "Scenario"),
            tags: scenario.tags,
            steps: scenario.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text,
                argument: step.argument,
            })),
            examples: scenario.examples ? scenario.examples.map((example: any) => ({
                id: example.id,
                name: example.name ?? "",
                description: example.description ?? "",
                tags: example.tags,
                header: example.header,
                body: example.body
            })) : []
        })),
        background: feature.background ? {
            id: feature.background.id,
            steps: feature.background.steps.map((step: any) => ({
                id: step.id,
                keyword: step.keyword,
                text: step.text,
                argument: step.argument,
            })),
        } : undefined
    };

    return (
        <div className="h-full" dir="rtl">
            <FeatureEditClient feature={transformedFeature} project={feature.project} />
        </div>
    );
} 