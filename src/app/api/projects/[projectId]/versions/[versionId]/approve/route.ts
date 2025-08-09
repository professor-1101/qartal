import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/config';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super user (check ENV first, then database)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuper: true, email: true }
    });

    // Check ENV-based superuser status
    const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
    const isSuper = superUserEmails.includes(user?.email!) || user?.isSuper || false;

    console.log('VERSION APPROVE API - ENV superuser emails:', superUserEmails);
    console.log('VERSION APPROVE API - User email:', user?.email);
    console.log('VERSION APPROVE API - Is super?', isSuper);

    if (!isSuper) {
      return NextResponse.json({ error: 'Only QA Managers can approve versions' }, { status: 403 });
    }

    const { versionId } = await params;
    const { message } = await request.json();

    // Check if version exists and is pending
    const version = await prisma.projectVersion.findUnique({
      where: { id: versionId },
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
        }
      }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    if (version.status !== 'PENDING') {
      // If already approved, return idempotent success and ensure unlock
      if (version.status === 'APPROVED') {
        try {
          await prisma.project.update({ where: { id: version.projectId }, data: { isLocked: false } });
        } catch {}
        return NextResponse.json({ version });
      }
      return NextResponse.json({ error: 'Version is not pending approval' }, { status: 400 });
    }

    // Update version status
    const updatedVersion = await prisma.projectVersion.update({
      where: { id: versionId },
      data: {
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date()
      },
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
        }
      }
    });

    // Create/Update approval record and unlock project (idempotent)
    try {
      await prisma.versionApproval.create({
        data: {
          versionId,
          reviewerId: session.user.id,
          status: 'APPROVED',
          message: message || 'تایید شد'
        }
      });
    } catch (e) {
      // If duplicate (same reviewer already acted), update existing record
      try {
        await prisma.versionApproval.updateMany({
          where: { versionId, reviewerId: session.user.id },
          data: { status: 'APPROVED', message: message || 'تایید شد' }
        });
      } catch (e2) {
        console.warn('VersionApproval upsert (approve) failed, continuing:', e2);
      }
    }

    // Unlock the project when approved
    try {
      await prisma.project.update({
        where: { id: updatedVersion.projectId },
        data: { isLocked: false }
      });
    } catch {}

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'APPROVE',
        action: 'version_approved',
        description: `نسخه ${version.version} پروژه "${version.project.name}" تایید شد`,
        projectId: version.projectId,
        metadata: {
          version: version.version,
          approver: session.user.firstName + ' ' + session.user.lastName,
          message
        }
      }
    });

    // Create notification for project owner
    await NotificationService.createProjectApprovalNotification(
      version.project.userId,
      version.projectId,
      version.project.name,
      version.id,
      session.user.firstName + ' ' + session.user.lastName
    );

    // Create notification for QA visibility
    await NotificationService.createProjectApprovedForQANotification(
      version.projectId,
      version.project.name,
      version.id,
      session.user.firstName + ' ' + session.user.lastName
    );

    return NextResponse.json({ version: updatedVersion });
  } catch (error) {
    console.error('Error approving version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}