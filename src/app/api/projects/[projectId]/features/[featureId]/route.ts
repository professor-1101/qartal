import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// DELETE /api/projects/[projectId]/features/[featureId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { projectId: string, featureId: string } }
) {
    try {
        const { projectId, featureId } = params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const project = await prisma.project.findFirst({
            where: { id: projectId, userId: user.id }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const feature = await prisma.feature.findFirst({
            where: { id: featureId, projectId }
        });

        if (!feature) {
            return NextResponse.json({ error: "Feature not found" }, { status: 404 });
        }

        await prisma.feature.delete({
            where: { id: featureId }
        });

        return NextResponse.json({ message: "Feature deleted successfully" });
    } catch (error) {
        console.error("Error deleting feature:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/projects/[projectId]/features/[featureId]
export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string; featureId: string } }
) {
    try {
        const { projectId, featureId } = params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const feature = await prisma.feature.findFirst({
            where: {
                id: featureId,
                projectId,
                project: { userId: user.id },
            },
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
                project: {
                    select: { id: true },
                },
            },
        });

        if (!feature) {
            return NextResponse.json({ error: "Feature not found" }, { status: 404 });
        }

        let rules = undefined;
        if (feature.rulesJson) {
            try {
                rules = JSON.parse(feature.rulesJson as any);
            } catch { }
        }

        const featureWithRules = { ...feature, rules };

        return NextResponse.json(featureWithRules);
    } catch (error) {
        console.error("Error fetching feature:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/projects/[projectId]/features/[featureId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { projectId: string; featureId: string } }
) {
    try {
        const { projectId, featureId } = params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const project = await prisma.project.findFirst({
            where: { id: projectId, userId: user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const data = await request.json();

        await prisma.scenario.deleteMany({ where: { featureId } });
        await prisma.background.deleteMany({ where: { featureId } });

        for (const scenario of data.scenarios || []) {
            await prisma.scenario.create({
                data: {
                    featureId,
                    name: scenario.name,
                    description: scenario.description,
                    type: scenario.type,
                    keyword: scenario.keyword,
                    tags: scenario.tags,
                    steps: {
                        create: scenario.steps?.map((st: any) => ({
                            keyword: st.keyword,
                            text: st.text,
                            argument: st.argument,
                        })) || [],
                    },
                    examples: {
                        create: scenario.examples
                            ? [{
                                name: scenario.examples.name,
                                description: scenario.examples.description,
                                tags: scenario.examples.tags,
                                header: scenario.examples.headers,
                                body: scenario.examples.rows,
                            }]
                            : [],
                    },
                },
            });
        }

        if (data.background?.steps?.length > 0) {
            await prisma.background.create({
                data: {
                    featureId,
                    steps: {
                        create: data.background.steps.map((st: any) => ({
                            keyword: st.keyword,
                            text: st.text,
                            argument: st.argument,
                        })),
                    },
                },
            });
        }

        const rulesJson: Prisma.JsonValue | Prisma.NullTypes.JsonNull | undefined =
            data.rules ? JSON.stringify(data.rules) : Prisma.JsonNull;

        const updatedFeature = await prisma.feature.update({
            where: { id: featureId, projectId },
            data: {
                name: data.name,
                description: data.description,
                tags: data.tags,
                rulesJson,
            },
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
                project: {
                    select: { id: true },
                },
            },
        });

        let rules = undefined;
        if (updatedFeature.rulesJson) {
            try {
                rules = JSON.parse(updatedFeature.rulesJson as any);
            } catch { }
        }

        const featureWithRules = { ...updatedFeature, rules };

        return NextResponse.json(featureWithRules);
    } catch (error) {
        console.error("Error updating feature:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
