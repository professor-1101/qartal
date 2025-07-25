import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[projectId]/gherkin/[gherkinId] - Get a specific Gherkin file
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ projectId: string; gherkinId: string }> }
) {
    try {
        const { projectId, gherkinId } = await params;
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

        const gherkinFile = await prisma.gherkinFile.findFirst({
            where: {
                id: gherkinId,
                projectId: projectId
            }
        });

        if (!gherkinFile) {
            return NextResponse.json(
                { error: "Gherkin file not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(gherkinFile);
    } catch (error) {
        console.error("Error fetching Gherkin file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/projects/[projectId]/gherkin/[gherkinId] - Update a Gherkin file
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string; gherkinId: string }> }
) {
    try {
        const { projectId, gherkinId } = await params;
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

        const { name, content } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Gherkin file name is required" },
                { status: 400 }
            );
        }

        if (!content) {
            return NextResponse.json(
                { error: "Gherkin content is required" },
                { status: 400 }
            );
        }

        const gherkinFile = await prisma.gherkinFile.findFirst({
            where: {
                id: gherkinId,
                projectId: projectId
            }
        });

        if (!gherkinFile) {
            return NextResponse.json(
                { error: "Gherkin file not found" },
                { status: 404 }
            );
        }

        // Use transaction to update gherkin file and update project updatedAt
        const result = await prisma.$transaction(async (tx) => {
            const updatedGherkinFile = await tx.gherkinFile.update({
                where: { id: gherkinId },
                data: {
                    name,
                    content,
                }
            });
            await tx.project.update({
                where: { id: projectId },
                data: { updatedAt: new Date() }
            });
            return updatedGherkinFile;
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating Gherkin file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[projectId]/gherkin/[gherkinId] - Delete a Gherkin file
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ projectId: string; gherkinId: string }> }
) {
    try {
        const { projectId, gherkinId } = await params;
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

        const gherkinFile = await prisma.gherkinFile.findFirst({
            where: {
                id: gherkinId,
                projectId: projectId
            }
        });

        if (!gherkinFile) {
            return NextResponse.json(
                { error: "Gherkin file not found" },
                { status: 404 }
            );
        }

        // Use transaction to delete gherkin file and update project updatedAt
        await prisma.$transaction(async (tx) => {
            await tx.gherkinFile.delete({
                where: { id: gherkinId }
            });
            await tx.project.update({
                where: { id: projectId },
                data: { updatedAt: new Date() }
            });
        });
        return NextResponse.json({ message: "Gherkin file deleted successfully" });
    } catch (error) {
        console.error("Error deleting Gherkin file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 