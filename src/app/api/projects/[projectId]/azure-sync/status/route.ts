import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";
import { AzureSyncStatus } from "@prisma/client";

// GET /api/projects/[projectId]/azure-sync/status
export async function GET(
  request: NextRequest,
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
      select: { 
        id: true,
        azureApiUrl: true,
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

    const searchParams = request.nextUrl.searchParams;
    const taskIdFilter = searchParams.get('taskId') || undefined;

    const syncJob = await prisma.azureSyncJob.findFirst({
      where: {
        projectId,
        userId: user.id,
        ...(taskIdFilter ? { taskId: taskIdFilter } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!syncJob) {
      return NextResponse.json({ 
        error: "هیچ همگام‌سازی برای این پروژه یافت نشد" 
      }, { status: 404 });
    }

    // If sync is already completed or failed, return stored result
    if (syncJob.status === 'COMPLETED' || syncJob.status === 'FAILED') {
      return NextResponse.json({
        syncJob,
        needsUpdate: false
      });
    }

    // If sync is in progress, check status from Azure
    if (syncJob.taskId && user.azureApiUrl) {
      try {
        const azureResponse = await fetch(
          `${user.azureApiUrl}/import/status/${syncJob.taskId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (azureResponse.ok) {
          const azureResult = await azureResponse.json();
          const errorsArray = Array.isArray(azureResult?.result?.errors) ? azureResult.result.errors : [];
          const hasPartialErrors = (azureResult?.result?.status === 'partial_success') || (errorsArray.length > 0);
          
          // Map Azure status to our status
          let ourStatus: AzureSyncStatus = syncJob.status;
          switch (azureResult.status) {
            case 'running':
              ourStatus = 'RUNNING';
              break;
            case 'completed':
              ourStatus = 'COMPLETED' as AzureSyncStatus;
              break;
            case 'failed':
              ourStatus = 'FAILED' as AzureSyncStatus;
              break;
          }

          // Update sync job with latest data
          const updatedSyncJob = await prisma.azureSyncJob.update({
            where: { id: syncJob.id },
            data: {
              status: ourStatus,
              progress: azureResult.progress || syncJob.progress,
              result: azureResult.result || syncJob.result,
              error: hasPartialErrors
                ? `partial_success: ${errorsArray.length} errors`
                : (azureResult.error || syncJob.error),
              logs: azureResult.logs || syncJob.logs,
              testPlanId: azureResult.result?.test_plan_id || syncJob.testPlanId,
              testSuiteId: azureResult.result?.test_suite_id || syncJob.testSuiteId,
              allSuiteIds: azureResult.result?.all_suite_ids || syncJob.allSuiteIds,
              createdCount: azureResult.result?.created || syncJob.createdCount,
              completedAt: ourStatus === 'COMPLETED' || ourStatus === 'FAILED' 
                ? new Date() 
                : syncJob.completedAt,
              updatedAt: new Date()
            },
            include: {
              project: { select: { name: true } }
            }
          });

          // Create notifications for completed/failed sync
          if (ourStatus === ('COMPLETED' as AzureSyncStatus) && syncJob.status !== ('COMPLETED' as AzureSyncStatus)) {
            await NotificationService.createAzureSyncCompletedNotification(
              user.id,
              projectId,
              updatedSyncJob.project.name,
              updatedSyncJob.createdCount || 0,
              updatedSyncJob.testPlanId || undefined
            );
          } else if (ourStatus === ('FAILED' as AzureSyncStatus) && syncJob.status !== ('FAILED' as AzureSyncStatus)) {
            await NotificationService.createAzureSyncFailedNotification(
              user.id,
              projectId,
              updatedSyncJob.project.name,
              updatedSyncJob.error || 'نامشخص'
            );
          }

          return NextResponse.json({
            syncJob: updatedSyncJob,
            azureResponse: azureResult,
            needsUpdate: true
          });
        } else {
          // Azure API error - maybe task expired
          const updatedSyncJob = await prisma.azureSyncJob.update({
            where: { id: syncJob.id },
            data: {
              status: 'TIMEOUT',
              error: `Azure API error: ${azureResponse.status}`,
              completedAt: new Date(),
              updatedAt: new Date()
            }
          });

          return NextResponse.json({
            syncJob: updatedSyncJob,
            needsUpdate: true
          });
        }
      } catch (azureError) {
        console.error("Error checking Azure status:", azureError);
        
        // Mark as failed if we can't reach Azure
        const updatedSyncJob = await prisma.azureSyncJob.update({
          where: { id: syncJob.id },
          data: {
            status: 'FAILED',
            error: `Connection error: ${azureError instanceof Error ? azureError.message : 'Unknown error'}`,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          syncJob: updatedSyncJob,
          needsUpdate: true
        });
      }
    }

    // Return current sync job if no Azure API available
    return NextResponse.json({
      syncJob,
      needsUpdate: false
    });

  } catch (error) {
    console.error("Error checking sync status:", error);
    return NextResponse.json({ 
      error: "خطا در بررسی وضعیت همگام‌سازی" 
    }, { status: 500 });
  }
}
