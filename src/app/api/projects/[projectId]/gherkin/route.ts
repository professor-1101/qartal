import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[projectId]/gherkin - Get all Gherkin files for a project
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
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

        const gherkinFiles = await prisma.gherkinFile.findMany({
            where: { projectId: projectId },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(gherkinFiles);
    } catch (error) {
        console.error("Error fetching Gherkin files:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[projectId]/gherkin - Create a new Gherkin file
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
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

        // Use transaction to create gherkin file and update project updatedAt
        const result = await prisma.$transaction(async (tx) => {
            const gherkinFile = await tx.gherkinFile.create({
                data: {
                    name,
                    content,
                    projectId: projectId,
                }
            });
            await tx.project.update({
                where: { id: projectId },
                data: { updatedAt: new Date() }
            });
            return gherkinFile;
        });
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating Gherkin file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 