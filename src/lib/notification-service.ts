import { prisma } from "@/lib/prisma";

export class NotificationService {
  
  // Create notification for project submission (for QA)
    static async createProjectSubmissionNotification(
    projectId: string,
    projectName: string, 
    versionId: string,
    _submitterUserId: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_SUBMITTED',
          title: 'پروژه جدید برای بررسی',
          message: `پروژه "${projectName}" برای بررسی و تایید ارسال شده است.`,
          forQA: true, // This goes to all QA users
          projectId,
          versionId
        }
      });
    } catch (error) {
      console.error('Error creating project submission notification:', error);
    }
  }

  // Create notification for project approval (for project owner)
  static async createProjectApprovalNotification(
    userId: string,
    projectId: string,
    projectName: string,
    versionId: string,
    approverName: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_APPROVED',
          title: 'پروژه تایید شد',
          message: `پروژه "${projectName}" توسط ${approverName} تایید شده است و آماده ارسال به Azure DevOps می‌باشد.`,
          userId,
          projectId,
          versionId
        }
      });
    } catch (error) {
      console.error('Error creating project approval notification:', error);
    }
  }

  // Create notification for project approval (for QA visibility)
  static async createProjectApprovedForQANotification(
    projectId: string,
    projectName: string,
    versionId: string,
    approverName: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_APPROVED',
          title: 'نسخه تایید شد',
          message: `نسخه پروژه "${projectName}" توسط ${approverName} تایید شد.`,
          forQA: true,
          projectId,
          versionId
        }
      });
    } catch (error) {
      console.error('Error creating QA approved notification:', error);
    }
  }

  // Create notification for project rejection (for project owner)
  static async createProjectRejectionNotification(
    userId: string,
    projectId: string,
    projectName: string,
    versionId: string,
    rejectorName: string,
    reason?: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_REJECTED',
          title: 'پروژه رد شد',
          message: `پروژه "${projectName}" توسط ${rejectorName} رد شده است.${reason ? ` دلیل: ${reason}` : ''}`,
          userId,
          projectId,
          versionId
        }
      });
    } catch (error) {
      console.error('Error creating project rejection notification:', error);
    }
  }

  // Create notification for project rejection (for QA visibility)
  static async createProjectRejectedForQANotification(
    projectId: string,
    projectName: string,
    versionId: string,
    rejectorName: string,
    reason?: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'PROJECT_REJECTED',
          title: 'نسخه رد شد',
          message: `نسخه پروژه "${projectName}" توسط ${rejectorName} رد شد.${reason ? ` دلیل: ${reason}` : ''}`,
          forQA: true,
          projectId,
          versionId
        }
      });
    } catch (error) {
      console.error('Error creating QA rejected notification:', error);
    }
  }

  // Create notification for Azure sync completion
  static async createAzureSyncCompletedNotification(
    userId: string,
    projectId: string,
    projectName: string,
    createdTestCases: number,
    testPlanId?: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'AZURE_SYNC_COMPLETED',
          title: 'همگام‌سازی Azure DevOps تکمیل شد',
          message: `پروژه "${projectName}" با موفقیت به Azure DevOps ارسال شد. ${createdTestCases} تست کیس ایجاد شده است.${testPlanId ? ` شناسه Test Plan: ${testPlanId}` : ''}`,
          userId,
          projectId
        }
      });
    } catch (error) {
      console.error('Error creating Azure sync completed notification:', error);
    }
  }

  // Create notification for Azure sync failure
  static async createAzureSyncFailedNotification(
    userId: string,
    projectId: string,
    projectName: string,
    errorMessage: string
  ) {
    try {
      await prisma.notification.create({
        data: {
          type: 'AZURE_SYNC_FAILED',
          title: 'همگام‌سازی Azure DevOps ناموفق',
          message: `همگام‌سازی پروژه "${projectName}" با Azure DevOps ناموفق بود. خطا: ${errorMessage}`,
          userId,
          projectId
        }
      });
    } catch (error) {
      console.error('Error creating Azure sync failed notification:', error);
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId: string, isSuper: boolean = false): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          OR: [
            { userId },
            ...(isSuper ? [{ forQA: true }] : [])
          ],
          isRead: false
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string, isSuper: boolean = false) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          OR: [
            { userId },
            ...(isSuper ? [{ forQA: true }] : [])
          ]
        }
      });

      if (notification) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Clean old notifications (keep last 100 per user)
  static async cleanOldNotifications() {
    try {
      // This would run as a cron job to clean old notifications
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days

      await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
    }
  }
}
