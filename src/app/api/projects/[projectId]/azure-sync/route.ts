import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { getProjectWithFeatures } from "@/lib/export-utils";
import { deepNormalizeProject } from "@/lib/deepNormalize";

// POST /api/projects/[projectId]/azure-sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { versionId, azureProjectName } = body as { versionId?: string; azureProjectName?: string };
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with Azure settings
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        azureApiUrl: true,
        azureTfsUrl: true,
        azureToken: true,
        isSuper: true
      }
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

    // Check if Azure settings are configured
    if (!user.azureApiUrl || !user.azureTfsUrl || !user.azureToken) {
      return NextResponse.json({ 
        error: "تنظیمات Azure DevOps تکمیل نشده است. لطفاً ابتدا در تنظیمات، اطلاعات Azure را وارد کنید." 
      }, { status: 400 });
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        // Allow superusers to access any project, regular users only their own
        ...(isSuper ? {} : { userId: user.id })
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build export JSON exactly like project export logic
    let projectExport: any = null;
    let versionInfo: any = null;
    if (versionId) {
      const version = await prisma.projectVersion.findFirst({
        where: {
          id: versionId,
          projectId: projectId,
          status: 'APPROVED'
        }
      });

      if (!version) {
        return NextResponse.json({ 
          error: "نسخه تایید شده یافت نشد" 
        }, { status: 404 });
      }

      // Use snapshot data from approved version
      const snapshot = version.snapshotData as any;
      const projectFromSnapshot = snapshot?.project || {};
      const featuresFromSnapshot = Array.isArray(snapshot?.features) ? snapshot.features : [];
      projectExport = {
        ...projectFromSnapshot,
        features: featuresFromSnapshot,
      };
      versionInfo = {
        version: version.version,
        status: version.status,
        releaseNotes: version.releaseNotes,
      };
    } else {
      // Fallback to current project data using the same export helper
      const current = await getProjectWithFeatures(projectId);
      if (!current) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      projectExport = { ...current };
    }

    // Check if there's already a pending sync for this project
    const existingSync = await prisma.azureSyncJob.findFirst({
      where: {
        projectId,
        userId: user.id,
        status: {
          in: ['PENDING', 'STARTED', 'RUNNING']
        }
      }
    });

    if (existingSync) {
      return NextResponse.json({ 
        error: "همگام‌سازی برای این پروژه در حال انجام است. لطفاً منتظر بمانید.",
        syncJob: existingSync
      }, { status: 409 });
    }

    // versionInfo is populated above if versionId provided

    // Attach exportInfo exactly like export ZIP structure expects
    const projectWithFeatures = {
      ...projectExport,
      exportInfo: {
        exportDate: new Date().toISOString(),
        version: versionInfo?.version || '1.0.0',
        versionStatus: versionInfo?.status || 'UNKNOWN',
        releaseNotes: versionInfo?.releaseNotes || 'اطلاعات نسخه موجود نیست'
      }
    };

    // Deep normalize to match export JSON robustness
    const normalizedProject = deepNormalizeProject(projectWithFeatures);

    // Create JSON file buffer
    const jsonBuffer = Buffer.from(JSON.stringify(normalizedProject, null, 2), 'utf-8');

    // Prepare form data for Azure API
    const formData = new FormData();
    formData.append('project_name', (azureProjectName && azureProjectName.trim()) ? azureProjectName.trim() : project.name);
    formData.append('token', user.azureToken);
    const versionString = (versionInfo?.version as string) || '1.0.0';
    formData.append('version', versionString);
    
    // Create file blob
    const fileBlob = new Blob([jsonBuffer], { type: 'application/json' });
    formData.append('file', fileBlob, `${(azureProjectName && azureProjectName.trim()) ? azureProjectName.trim() : (projectWithFeatures?.name || project.name)}.json`);

    // Send request to Azure API
    const azureResponse = await fetch(`${user.azureApiUrl}/import/async`, {
      method: 'POST',
      body: formData
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      throw new Error(`Azure API error: ${azureResponse.status} - ${errorText}`);
    }

    const azureResult = await azureResponse.json();

    // Create sync job record
    const syncJob = await prisma.azureSyncJob.create({
      data: {
        taskId: azureResult.task_id,
        status: azureResult.status === 'started' ? 'STARTED' : 'PENDING',
        projectName: (azureProjectName && azureProjectName.trim()) ? azureProjectName.trim() : project.name,
        version: versionString,
        userId: user.id,
        projectId: project.id,
        logs: azureResult.message ? [azureResult.message] : []
      }
    });

    return NextResponse.json({
      message: "همگام‌سازی با Azure DevOps شروع شد",
      syncJob,
      azureResponse: azureResult
    });

  } catch (error) {
    console.error("Error starting Azure sync:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "خطا در شروع همگام‌سازی" 
    }, { status: 500 });
  }
}

// GET /api/projects/[projectId]/azure-sync
// Returns list of sync jobs for the current user and project (latest first)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
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

    // Only return jobs for this user and project
    const jobs = await prisma.azureSyncJob.findMany({
      where: { projectId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error listing Azure sync jobs:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست همگام‌سازی' }, { status: 500 });
  }
}
