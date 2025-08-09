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

    // Get all approved/rejected versions
    const recentApprovals = await prisma.projectVersion.findMany({
      where: {
        status: {
          in: ['APPROVED', 'REJECTED']
        }
      },
      include: {
        project: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        approvals: {
          where: { status: { in: ['APPROVED', 'REJECTED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: [
        {
          approvedAt: 'desc'
        },
        {
          rejectedAt: 'desc'
        }
      ],
      take: 100 // Limit to last 100 approvals
    });

    // Format the response
    const formattedApprovals = recentApprovals.map(version => ({
      id: version.id,
      projectId: version.projectId,
      projectName: version.project.name,
      projectDescription: version.project.description,
      version: version.version,
      status: version.status,
      releaseNotes: version.releaseNotes || '',
      rejectionReason: version.status === 'REJECTED' ? (version.approvals?.[0]?.message || '') : '',
      approvedAt: (version.approvedAt || version.rejectedAt || version.createdAt).toISOString(),
      projectOwner: {
        id: version.project.user.id,
        firstName: version.project.user.firstName,
        lastName: version.project.user.lastName,
        email: version.project.user.email
      }
    }));

    return NextResponse.json({
      approvals: formattedApprovals
    });

  } catch (error) {
    console.error("Error fetching recent approvals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
