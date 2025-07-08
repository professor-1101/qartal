import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { nanoid } from 'nanoid';

// GET /api/projects - Get all projects for the current user
export async function GET(_request: NextRequest) {
  try {
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

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: {
        features: true,
        gherkinFiles: true,
        _count: {
          select: {
            features: true,
            gherkinFiles: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
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

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Attempt to create a project with a unique slang
    let project;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const slang = nanoid(6);
        project = await prisma.project.create({
          data: {
            name,
            description,
            userId: user.id,
            slang
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
        break; // success
      } catch (error: any) {
        // Prisma error code P2002 = unique constraint failed
        if (error.code === "P2002" && error.meta?.target?.includes("slang")) {
          attempts++;
          continue; // try again
        }
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: "Failed to generate unique project slang" },
        { status: 500 }
      );
    }

    return NextResponse.json(project, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}