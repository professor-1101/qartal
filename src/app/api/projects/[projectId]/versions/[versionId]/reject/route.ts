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

    console.log('VERSION REJECT API - ENV superuser emails:', superUserEmails);
    console.log('VERSION REJECT API - User email:', user?.email);
    console.log('VERSION REJECT API - Is super?', isSuper);

    if (!isSuper) {
      return NextResponse.json({ error: 'Only QA Managers can reject versions' }, { status: 403 });
    }

    const { versionId } = await params;
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

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
      // If already rejected, ensure project is unlocked and return idempotent success
      if (version.status === 'REJECTED') {
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
        status: 'REJECTED',
        rejectedById: session.user.id,
        rejectedAt: new Date()
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
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create/Update rejection record and unlock project (idempotent)
    try {
      await prisma.versionApproval.create({
        data: {
          versionId,
          reviewerId: session.user.id,
          status: 'REJECTED',
          message
        }
      });
    } catch (e) {
      // If duplicate (same reviewer already acted), update the existing approval
      try {
        await prisma.versionApproval.updateMany({
          where: { versionId, reviewerId: session.user.id },
          data: { status: 'REJECTED', message }
        });
      } catch (e2) {
        console.warn('VersionApproval upsert (reject) failed, continuing:', e2);
      }
    }

    // Unlock the project when rejected (so owner can make changes)
    try {
      await prisma.project.update({
        where: { id: updatedVersion.projectId },
        data: { isLocked: false }
      });
    } catch {}

    // Log activity for the reviewer
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'REJECT',
        action: 'version_rejected',
        description: `نسخه ${version.version} پروژه "${version.project.name}" رد شد`,
        projectId: version.projectId,
        metadata: {
          version: version.version,
          reviewer: session.user.firstName + ' ' + session.user.lastName,
          reason: message
        }
      }
    });

    // Log activity for the project owner (notification)
    await prisma.activity.create({
      data: {
        userId: version.createdById,
        type: 'NOTIFICATION',
        action: 'version_rejected_notification',
        description: `نسخه ${version.version} پروژه "${version.project.name}" رد شد: ${message}`,
        projectId: version.projectId,
        metadata: {
          version: version.version,
          reviewer: session.user.firstName + ' ' + session.user.lastName,
          reason: message,
          isNotification: true
        }
      }
    });

    // Create notification for project owner
    await NotificationService.createProjectRejectionNotification(
      version.project.userId,
      version.projectId,
      version.project.name,
      version.id,
      session.user.firstName + ' ' + session.user.lastName,
      message
    );

    return NextResponse.json({ version: updatedVersion });
  } catch (error) {
    console.error('Error rejecting version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}