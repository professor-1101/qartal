import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { ActivityLogger } from "@/lib/activity-logger";

// GET /api/projects/[projectId] - Get a specific project
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

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id
            },
            include: {
                gherkinFiles: true,
                _count: {
                    select: {
                        gherkinFiles: true
                    }
                }
            }
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/projects/[projectId] - Update a project
export async function PUT(
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

                const { name, description } = await request.json();

        if (!name) {
          return NextResponse.json(
            { error: "Project name is required" },
            { status: 400 }
          );
        }

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

        // Track changes for activity logging
        const changes: any = {};
        if (name !== project.name) changes.name = { old: project.name, new: name };
        if (description !== project.description) changes.description = { old: project.description, new: description };

        const updatedProject = await prisma.project.update({
          where: { id: projectId },
          data: {
            name,
            description,
            updatedAt: new Date(), // Force update the timestamp
          },
          include: {
            gherkinFiles: true,
            _count: {
              select: {
                features: true,
                gherkinFiles: true
              }
            }
          }
        });

        // Log project update activity if there were changes
        if (Object.keys(changes).length > 0) {
          await ActivityLogger.logProjectUpdated(user.id, projectId, updatedProject.name, changes);
        }

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(
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

        // Log project deletion activity
        await ActivityLogger.logProjectDeleted(user.id, projectId, project.name);

        await prisma.project.delete({
          where: { id: projectId }
        });

        return NextResponse.json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 