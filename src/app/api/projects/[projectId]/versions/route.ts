import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { prisma } from '@/lib/prisma';
import { VersioningService } from '@/lib/versioning';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Get all versions for the project
    const versions = await prisma.projectVersion.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvals: {
          where: {
            status: 'REJECTED'
          },
          select: {
            message: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        { major: 'desc' },
        { minor: 'desc' },
        { patch: 'desc' }
      ]
    });

    // Add rejection reason to versions
    const versionsWithRejectionReason = versions.map(version => ({
      ...version,
      rejectionReason: version.approvals?.[0]?.message || null
    }));

    return NextResponse.json({ versions: versionsWithRejectionReason });
  } catch (error) {
    console.error('Error fetching versions:', error);
    console.error('Stack trace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { type: versionType, message } = body;

    // Get project data with features
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        features: {
          include: {
            scenarios: {
              include: {
                steps: true,
                examples: true
              }
            },
            background: {
              include: {
                steps: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        user: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is project owner
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Only project owner can create versions' }, { status: 403 });
    }

    // If there is an existing PENDING version (e.g., after import v1.0.0), update it instead of creating a new semantic version
    const existingPending = await prisma.projectVersion.findFirst({
      where: { projectId, status: 'PENDING' },
      orderBy: [
        { major: 'desc' },
        { minor: 'desc' },
        { patch: 'desc' }
      ]
    });

    // Get latest approved version for diff base
    const latestVersion = await VersioningService.getLatestVersion(projectId);
    
    // Generate next version
    const nextVersion = VersioningService.getNextVersion(latestVersion.version, versionType);

    // Create project snapshot
    const currentSnapshot = VersioningService.createProjectSnapshot(project);

    // Get previous snapshot for comparison
    let changesSummary = null;
    let releaseNotes = null;

    if (latestVersion.version !== '0.0.0') {
      const previousVersion = await prisma.projectVersion.findFirst({
        where: { 
          projectId,
          version: latestVersion.version,
          status: 'APPROVED'
        }
      });

      if (previousVersion?.snapshotData) {
        const previousSnapshot = previousVersion.snapshotData as any;
        changesSummary = VersioningService.compareSnapshots(previousSnapshot, currentSnapshot);
        releaseNotes = VersioningService.generateReleaseNotes(changesSummary, nextVersion.version);
      }
    }

    // If no changes detected, don't create version
    if (changesSummary && changesSummary.metadata.changeCount === 0) {
      return NextResponse.json({ 
        error: 'No changes detected since last version' 
      }, { status: 400 });
    }

    // If a pending version exists (common after import -> v1.0.0 PENDING), update it in-place
    if (existingPending) {
      const updatedPending = await prisma.projectVersion.update({
        where: { id: existingPending.id },
        data: {
          snapshotData: currentSnapshot as any,
          changesSummary: changesSummary as any,
          // keep same version number; append message if provided
          releaseNotes: (existingPending.releaseNotes ? existingPending.releaseNotes + (message ? `\n\n${message}` : '') : (message || existingPending.releaseNotes)) || undefined,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
      return NextResponse.json({ version: updatedPending });
    }

    // Otherwise, create a new pending version based on latest approved
    const newVersion = await prisma.projectVersion.create({
      data: {
        version: nextVersion.version,
        major: nextVersion.major,
        minor: nextVersion.minor,
        patch: nextVersion.patch,
        projectId,
        createdById: session.user.id,
        snapshotData: currentSnapshot as any,
        changesSummary: changesSummary as any,
        releaseNotes: releaseNotes || `نسخه ${nextVersion.version}${message ? `\n\n${message}` : ''}`,
        status: 'PENDING'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ version: newVersion });
  } catch (error) {
    console.error('Error creating version:', error);
    console.error('Stack trace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}