import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[projectId]/features - Create a new feature for a project
export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const { projectId } = params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify project belongs to user
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id
            }
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const { name, description } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Feature name is required" },
                { status: 400 }
            );
        }

        // Find the current max order for this project's features
        const maxOrderFeature = await prisma.feature.findFirst({
            where: { projectId: projectId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        const nextOrder = (maxOrderFeature?.order ?? 0) + 1;

        const feature = await prisma.feature.create({
            data: {
                name,
                description,
                projectId: projectId,
                order: nextOrder,
            },
            include: {
                scenarios: true,
                background: true,
            }
        });

        return NextResponse.json(feature, { status: 201 });
    } catch (error) {
        console.error("Error creating feature:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}