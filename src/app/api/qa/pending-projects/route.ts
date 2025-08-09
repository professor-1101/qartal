import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isSuper: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is super user
    const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
    const isSuper = superUserEmails.includes(session.user.email!) || user.isSuper || false;

    if (!isSuper) {
      return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
    }

    // Get projects with pending versions
    const projectsWithPendingVersions = await prisma.project.findMany({
      where: {
        versions: {
          some: {
            status: 'PENDING'
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        versions: {
          where: {
            status: 'PENDING'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format the response
    const formattedProjects = projectsWithPendingVersions.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      user: project.user,
      pendingVersion: project.versions[0] ? {
        id: project.versions[0].id,
        version: project.versions[0].version,
        releaseNotes: project.versions[0].releaseNotes || '',
        createdAt: project.versions[0].createdAt.toISOString()
      } : null
    })).filter(project => project.pendingVersion !== null);

    return NextResponse.json({
      projects: formattedProjects
    });

  } catch (error) {
    console.error("Error fetching pending projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
