import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/admin/approved-versions?search=&page=&pageSize=
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const where: any = {
      versions: {
        some: {
          status: 'APPROVED'
        }
      }
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }}
      ];
    }

    const skip = (page - 1) * pageSize;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
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
              status: 'APPROVED'
            },
            orderBy: [
              { major: 'desc' },
              { minor: 'desc' },
              { patch: 'desc' }
            ],
            take: 1
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: pageSize
      }),
      prisma.project.count({ where })
    ]);

    const projectsWithLatestVersion = projects.map(project => {
      const latestVersion = project.versions[0];
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        user: project.user,
        latestApprovedVersion: latestVersion ? {
          id: latestVersion.id,
          version: `${latestVersion.major}.${latestVersion.minor}.${latestVersion.patch}`,
          releaseNotes: latestVersion.releaseNotes,
          approvedAt: latestVersion.approvedAt,
          approvedBy: latestVersion.approvedById
        } : null
      };
    }).filter(project => project.latestApprovedVersion !== null);

    return NextResponse.json({
      projects: projectsWithLatestVersion,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error("Error fetching approved versions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
