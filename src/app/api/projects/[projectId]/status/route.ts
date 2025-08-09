import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { VersioningService } from "@/lib/versioning";
import { VersionDiffGenerator } from "@/lib/versioning-diff";

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
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

    // Get project with features
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

    // Check if user has access to project
    if (project.userId !== user.id && !user.isSuper) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get latest approved version
    const latestVersion = await VersioningService.getLatestVersion(projectId);

    // Check if there are pending versions
    const pendingVersion = await prisma.projectVersion.findFirst({
      where: {
        projectId,
        status: 'PENDING'
      }
    });

    // Get the most recent rejected version (to avoid falling back to 0.0.0 after rejection)
    const lastRejected = await prisma.projectVersion.findFirst({
      where: {
        projectId,
        status: 'REJECTED'
      },
      orderBy: [
        { major: 'desc' },
        { minor: 'desc' },
        { patch: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Determine if there are changes
    let hasChanges = false;
    let changeSummary = {
      addedFeatures: 0,
      removedFeatures: 0,
      modifiedFeatures: 0,
      addedScenarios: 0,
      removedScenarios: 0,
      modifiedScenarios: 0
    };

    if (latestVersion && latestVersion.version !== '0.0.0') {
      // Get last approved version snapshot
      const lastVersionSnapshot = await prisma.projectVersion.findFirst({
        where: { 
          projectId, 
          status: 'APPROVED' 
        },
        orderBy: { createdAt: 'desc' }
      });

      if (lastVersionSnapshot && lastVersionSnapshot.snapshotData) {
        try {
          const lastSnapshot = lastVersionSnapshot.snapshotData as any;
          
          // Create current snapshot for comparison
          const currentSnapshot = await VersioningService.createProjectSnapshot(project);
          
          // Use the same diff logic as versioning
          const diff = VersionDiffGenerator.generateDiff(lastSnapshot, currentSnapshot);
          
          changeSummary = diff.summary;
          
          // Check if any changes were detected
          if (changeSummary.addedFeatures > 0 || 
              changeSummary.removedFeatures > 0 || 
              changeSummary.modifiedFeatures > 0 ||
              changeSummary.addedScenarios > 0 ||
              changeSummary.removedScenarios > 0 ||
              changeSummary.modifiedScenarios > 0) {
            hasChanges = true;
          }
          
        } catch (error) {
          console.error("Error comparing versions:", error);
          // If we can't compare, assume there are changes
          hasChanges = true;
        }
      } else {
        // No previous version, so this is the first version
        hasChanges = project.features.length > 0;
      }
    } else {
      // No approved versions yet
      hasChanges = project.features.length > 0;
    }

    return NextResponse.json({
      projectId,
      isLocked: project.isLocked,
      hasPendingVersion: !!pendingVersion,
      hasChanges,
      changeSummary,
      latestVersion: pendingVersion?.version || lastRejected?.version || latestVersion?.version || '0.0.0',
      featureCount: project.features.length,
      scenarioCount: project.features.reduce((sum, f) => sum + (f.scenarios?.length || 0), 0)
    });
    
  } catch (error) {
    console.error("Error checking project status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 