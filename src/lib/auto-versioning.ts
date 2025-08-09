import { prisma } from '@/lib/prisma';
import { VersioningService } from './versioning';

export interface VersioningContext {
  action: 'feature_edit' | 'feature_add' | 'feature_delete' | 'project_edit';
  featureName?: string;
  userId: string;
  projectId: string;
}

export class AutoVersioning {
  static async createVersionForAction(context: VersioningContext): Promise<void> {
    try {

      // تعیین نوع نسخه بر اساس عمل انجام شده
      let versionType: 'patch' | 'minor' | 'major';
      let message: string;

      switch (context.action) {
        case 'feature_edit':
          versionType = 'minor';
          message = `ویرایش ویژگی: ${context.featureName || 'نامشخص'}`;
          break;
        case 'feature_add':
          versionType = 'major';
          message = `افزودن ویژگی جدید: ${context.featureName || 'نامشخص'}`;
          break;
        case 'feature_delete':
          versionType = 'major';
          message = `حذف ویژگی: ${context.featureName || 'نامشخص'}`;
          break;
        case 'project_edit':
          versionType = 'patch';
          message = 'ویرایش تنظیمات پروژه';
          break;
        default:
          versionType = 'patch';
          message = 'تغییرات عمومی';
      }

      // بررسی وجود پروژه
      const project = await prisma.project.findUnique({
        where: { id: context.projectId },
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
            }
          }
        }
      });

      if (!project) {
        console.error('[AUTO-VERSIONING] پروژه پیدا نشد:', context.projectId);
        return;
      }

      // ایجاد snapshot از وضعیت فعلی پروژه
      const currentSnapshot = VersioningService.createProjectSnapshot(project);

      // محاسبه نسخه جدید
      const latestVersion = await VersioningService.getLatestVersion(context.projectId);
      const newVersion = VersioningService.getNextVersion(latestVersion.version, versionType);

      // بررسی وجود نسخه Pending قبلی
      const existingPendingVersion = await prisma.projectVersion.findFirst({
        where: {
          projectId: context.projectId,
          status: 'PENDING'
        }
      });

      // اگر نسخه pending وجود دارد، آن را به‌روزرسانی کن، وگرنه نسخه جدید ایجاد کن
      if (existingPendingVersion) {
        // به‌روزرسانی نسخه موجود
        await prisma.projectVersion.update({
          where: { id: existingPendingVersion.id },
          data: {
            snapshotData: currentSnapshot as any,
            releaseNotes: message
          }
        });

        console.log(`[AUTO-VERSIONING] نسخه pending به‌روزرسانی شد: ${existingPendingVersion.version}`);
      } else {
        // ایجاد نسخه جدید
        await prisma.projectVersion.create({
          data: {
            projectId: context.projectId,
            version: newVersion.version,
            major: newVersion.major,
            minor: newVersion.minor,
            patch: newVersion.patch,
            status: 'PENDING',
            releaseNotes: message,
            snapshotData: currentSnapshot as any,
            createdById: context.userId
          }
        });

        console.log(`[AUTO-VERSIONING] نسخه جدید ایجاد شد: ${newVersion.version} (${versionType})`);
      }

    } catch (error) {
      console.error('[AUTO-VERSIONING] خطا در ایجاد نسخه خودکار:', error);
    }
  }
}