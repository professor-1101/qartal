import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { VersioningService } from "@/lib/versioning";
import { NotificationService } from "@/lib/notification-service";

export async function POST(
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

    // Check if user is project owner
    if (project.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Only project owner can publish versions' 
      }, { status: 403 });
    }

    // Check if project is already locked
    if (project.isLocked) {
      return NextResponse.json({ 
        error: 'پروژه در حالت انتظار تایید است' 
      }, { status: 400 });
    }

    // Check if there are pending versions already
    const existingPendingVersion = await prisma.projectVersion.findFirst({
      where: {
        projectId,
        status: 'PENDING'
      }
    });

    if (existingPendingVersion) {
      return NextResponse.json({ 
        error: 'نسخه‌ای در انتظار تایید وجود دارد' 
      }, { status: 400 });
    }

    // Get latest approved version
    const latestVersion = await VersioningService.getLatestVersion(projectId);
    
    // Determine version type automatically based on changes
    let versionType: 'major' | 'minor' | 'patch' = 'patch';
    let releaseMessage = 'به‌روزرسانی خودکار';
    
    // Debug log for imported projects
    console.log('Publishing project:', projectId, 'Latest version:', latestVersion);

    // Check for major changes (new/deleted features)
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
        const currentFeatureCount = project.features.length;
        const lastFeatureCount = lastSnapshot.features?.length || 0;
        
        // Check if there are any actual changes
        let hasChanges = false;
        
        // Compare feature counts first
        if (currentFeatureCount !== lastFeatureCount) {
          hasChanges = true;
          versionType = 'major';
          if (currentFeatureCount > lastFeatureCount) {
            releaseMessage = `افزودن ${currentFeatureCount - lastFeatureCount} ویژگی جدید`;
          } else {
            releaseMessage = `حذف ${lastFeatureCount - currentFeatureCount} ویژگی`;
          }
        } else {
          // Compare actual feature content
          const currentFeatures = project.features;
          const lastFeatures = lastSnapshot.features || [];
          
          for (let i = 0; i < currentFeatures.length; i++) {
            const currentFeature = currentFeatures[i];
            const lastFeature = lastFeatures.find((f: any) => f.id === currentFeature.id);
            
            if (!lastFeature) {
              // New feature
              hasChanges = true;
              versionType = 'major';
              releaseMessage = 'افزودن ویژگی جدید';
              break;
            }
            
            // Compare feature properties
            if (currentFeature.name !== lastFeature.name || 
                currentFeature.description !== lastFeature.description) {
              hasChanges = true;
              versionType = 'minor';
              releaseMessage = 'تغییرات ویژگی‌ها';
              break;
            }
            
            // Compare scenarios
            const currentScenarios = currentFeature.scenarios || [];
            const lastScenarios = lastFeature.scenarios || [];
            
            if (currentScenarios.length !== lastScenarios.length) {
              hasChanges = true;
              versionType = 'minor';
              releaseMessage = 'تغییرات سناریوها';
              break;
            }
            
            // Compare scenario content
            for (let j = 0; j < currentScenarios.length; j++) {
              const currentScenario = currentScenarios[j];
              const lastScenario = lastScenarios.find((s: any) => s.id === currentScenario.id);
              
              if (!lastScenario) {
                hasChanges = true;
                versionType = 'minor';
                releaseMessage = 'تغییرات سناریوها';
                break;
              }
              
              if (currentScenario.name !== lastScenario.name || 
                  currentScenario.description !== lastScenario.description) {
                hasChanges = true;
                versionType = 'minor';
                releaseMessage = 'تغییرات سناریوها';
                break;
              }
              
              // Compare steps
              const currentSteps = currentScenario.steps || [];
              const lastSteps = lastScenario.steps || [];
              
              if (currentSteps.length !== lastSteps.length) {
                hasChanges = true;
                versionType = 'minor';
                releaseMessage = 'تغییرات مراحل';
                break;
              }
              
              for (let k = 0; k < currentSteps.length; k++) {
                const currentStep = currentSteps[k];
                const lastStep = lastSteps[k];
                
                if (currentStep.keyword !== lastStep.keyword || 
                    currentStep.text !== lastStep.text) {
                  hasChanges = true;
                  versionType = 'minor';
                  releaseMessage = 'تغییرات مراحل';
                  break;
                }
              }
              
              if (hasChanges) break;
            }
            
            if (hasChanges) break;
          }
        }
        
        // If no changes detected, prevent publishing
        if (!hasChanges) {
          return NextResponse.json({ 
            error: 'هیچ تغییری در پروژه وجود ندارد. برای انتشار نسخه جدید، ابتدا تغییراتی در ویژگی‌ها یا سناریوها ایجاد کنید.' 
          }, { status: 400 });
        }
        
      } catch (snapshotError) {
        console.error("Error parsing last snapshot:", snapshotError);
        // Fall back to major version for safety
        versionType = 'major';
        releaseMessage = 'به‌روزرسانی عمده';
      }
    } else {
      // First version or no previous approved versions
      if (project.features.length === 0) {
        return NextResponse.json({ 
          error: 'هیچ ویژگی‌ای در پروژه وجود ندارد. ابتدا ویژگی‌ای اضافه کنید.' 
        }, { status: 400 });
      }
      
      versionType = 'major';
      releaseMessage = project.features.length > 0 ? 
        `نسخه اولیه با ${project.features.length} ویژگی` : 
        'نسخه اولیه';
    }

    // Generate next version
    const nextVersion = VersioningService.getNextVersion(latestVersion.version, versionType);
    
    console.log('Base version:', latestVersion.version, 'Next version:', nextVersion);

    // Check if version already exists
    const existingVersion = await prisma.projectVersion.findFirst({
      where: {
        projectId,
        version: nextVersion.version
      }
    });

    // If the exact version exists but was REJECTED, recycle it by updating to a fresh PENDING
    if (existingVersion && existingVersion.status === 'REJECTED') {
      // Create project snapshot with error handling (again to ensure we have it)
      let recycledSnapshot;
      try {
        recycledSnapshot = VersioningService.createProjectSnapshot(project);
      } catch (snapshotError) {
        console.error("Error creating snapshot for recycled version:", snapshotError);
        return NextResponse.json(
          { error: "خطا در ایجاد snapshot پروژه برای نسخه ردشده" },
          { status: 500 }
        );
      }

      // Transaction: Lock project and update the rejected version to pending
      const recycled = await prisma.$transaction(async (tx) => {
        await tx.project.update({ where: { id: projectId }, data: { isLocked: true } });
        const updated = await tx.projectVersion.update({
          where: { id: existingVersion.id },
          data: {
            status: 'PENDING',
            snapshotData: recycledSnapshot as any,
            releaseNotes: releaseMessage,
            approvedAt: null,
            approvedById: null,
            rejectedById: null,
            rejectedAt: null
          }
        });
        return updated;
      });

      await NotificationService.createProjectSubmissionNotification(
        projectId,
        project.name,
        recycled.id,
        user.id
      );

      return NextResponse.json({
        success: true,
        version: recycled.version,
        message: 'نسخه قبلاً رد شده بود و اکنون با تغییرات جدید برای تایید ارسال شد'
      });
    }

    // If version exists and is not REJECTED, block duplicate
    if (existingVersion) {
      return NextResponse.json({ 
        error: `نسخه ${nextVersion.version} قبلاً وجود دارد. لطفاً دوباره تلاش کنید.` 
      }, { status: 400 });
    }

    // Create project snapshot with error handling
    let currentSnapshot;
    try {
      // Make sure we have all the data we need for snapshot
      if (!project.features) {
        project.features = [];
      }
      
      currentSnapshot = VersioningService.createProjectSnapshot(project);
      console.log('Created snapshot successfully:', {
        features: currentSnapshot.features?.length || 0,
        totalFeatures: currentSnapshot.metadata?.totalFeatures || 0
      });
    } catch (snapshotError) {
      console.error("Error creating project snapshot:", snapshotError);
      return NextResponse.json(
        { error: "خطا در ایجاد snapshot پروژه: " + (snapshotError instanceof Error ? snapshotError.message : String(snapshotError)) },
        { status: 500 }
      );
    }

    // Transaction: Lock project and create pending version
    const result = await prisma.$transaction(async (tx) => {
      // Lock the project
      await tx.project.update({
        where: { id: projectId },
        data: { isLocked: true }
      });

      // Create pending version
      const version = await tx.projectVersion.create({
        data: {
          projectId,
          version: nextVersion.version,
          major: nextVersion.major,
          minor: nextVersion.minor,
          patch: nextVersion.patch,
          status: 'PENDING',
          releaseNotes: releaseMessage,
          snapshotData: currentSnapshot as any,
          createdById: user.id
        }
      });

      return version;
    });

    // Create notification for QA team
    await NotificationService.createProjectSubmissionNotification(
      projectId,
      project.name,
      result.id,
      user.id
    );

    return NextResponse.json({
      success: true,
      version: result.version,
      message: 'پروژه برای انتشار آماده شد و منتظر تایید QA Manager است'
    });

  } catch (error) {
    console.error("Error publishing project:", error);
    
    // Log more detailed error info for debugging
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}