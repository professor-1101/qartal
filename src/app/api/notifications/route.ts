import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/notifications
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

    // Get notifications for this user
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id }, // Direct notifications
          ...(user.isSuper ? [{ forQA: true }] : []) // QA notifications if user is super
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      projectId: notification.projectId,
      projectName: notification.project?.name,
      versionId: notification.versionId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString()
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
