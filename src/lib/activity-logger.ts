import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export interface ActivityData {
  userId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT' | 'REORDER' | 'LOGIN' | 'LOGOUT';
  action: string;
  description: string;
  metadata?: any;
  projectId?: string;
  featureId?: string;
}

export class ActivityLogger {
  static async log(data: ActivityData) {
    try {
      await prisma.activity.create({
        data: {
          userId: data.userId,
          type: data.type,
          action: data.action,
          description: data.description,
          metadata: data.metadata ?? Prisma.JsonNull,

          projectId: data.projectId,
          featureId: data.featureId,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  // Project Activities
  static async logProjectCreated(userId: string, projectId: string, projectName: string) {
    await this.log({
      userId,
      type: 'CREATE',
      action: 'project_created',
      description: `پروژه "${projectName}" ایجاد شد`,
      metadata: { projectName },
      projectId,
    });
  }

  static async logProjectUpdated(userId: string, projectId: string, projectName: string, changes: any) {
    await this.log({
      userId,
      type: 'UPDATE',
      action: 'project_updated',
      description: `پروژه "${projectName}" بروزرسانی شد`,
      metadata: { projectName, changes },
      projectId,
    });
  }

  static async logProjectDeleted(userId: string, projectId: string, projectName: string) {
    await this.log({
      userId,
      type: 'DELETE',
      action: 'project_deleted',
      description: `پروژه "${projectName}" حذف شد`,
      metadata: { projectName },
      projectId,
    });
  }

  static async logProjectImported(userId: string, projectId: string, projectName: string, featureCount: number) {
    await this.log({
      userId,
      type: 'IMPORT',
      action: 'project_imported',
      description: `پروژه "${projectName}" با ${featureCount} ویژگی ایمپورت شد`,
      metadata: { projectName, featureCount },
      projectId,
    });
  }

  static async logProjectExported(userId: string, projectId: string, projectName: string) {
    await this.log({
      userId,
      type: 'EXPORT',
      action: 'project_exported',
      description: `پروژه "${projectName}" دانلود شد`,
      metadata: { projectName },
      projectId,
    });
  }

  // Feature Activities
  static async logFeatureCreated(userId: string, projectId: string, featureId: string, featureName: string) {
    await this.log({
      userId,
      type: 'CREATE',
      action: 'feature_created',
      description: `ویژگی "${featureName}" ایجاد شد`,
      metadata: { featureName },
      projectId,
      featureId,
    });
  }

  static async logFeatureUpdated(userId: string, projectId: string, featureId: string, featureName: string, changes: any) {
    await this.log({
      userId,
      type: 'UPDATE',
      action: 'feature_updated',
      description: `ویژگی "${featureName}" بروزرسانی شد`,
      metadata: { featureName, changes },
      projectId,
      featureId,
    });
  }

  static async logFeatureDeleted(userId: string, projectId: string, featureId: string, featureName: string) {
    await this.log({
      userId,
      type: 'DELETE',
      action: 'feature_deleted',
      description: `ویژگی "${featureName}" حذف شد`,
      metadata: { featureName },
      projectId,
      featureId,
    });
  }

  static async logFeatureReordered(userId: string, projectId: string, movedFeatureName: string, oldPosition: number, newPosition: number) {
    await this.log({
      userId,
      type: 'REORDER',
      action: 'features_reordered',
      description: `ویژگی "${movedFeatureName}" از موقعیت ${oldPosition} به موقعیت ${newPosition} منتقل شد`,
      metadata: { movedFeatureName, oldPosition, newPosition },
      projectId,
    });
  }

  // Scenario Activities
  static async logScenarioCreated(userId: string, projectId: string, featureId: string, featureName: string, scenarioName: string) {
    await this.log({
      userId,
      type: 'CREATE',
      action: 'scenario_created',
      description: `سناریو "${scenarioName}" در ویژگی "${featureName}" ایجاد شد`,
      metadata: { featureName, scenarioName },
      projectId,
      featureId,
    });
  }

  static async logScenarioUpdated(userId: string, projectId: string, featureId: string, featureName: string, scenarioName: string) {
    await this.log({
      userId,
      type: 'UPDATE',
      action: 'scenario_updated',
      description: `سناریو "${scenarioName}" در ویژگی "${featureName}" بروزرسانی شد`,
      metadata: { featureName, scenarioName },
      projectId,
      featureId,
    });
  }

  static async logScenarioDeleted(userId: string, projectId: string, featureId: string, featureName: string, scenarioName: string) {
    await this.log({
      userId,
      type: 'DELETE',
      action: 'scenario_deleted',
      description: `سناریو "${scenarioName}" از ویژگی "${featureName}" حذف شد`,
      metadata: { featureName, scenarioName },
      projectId,
      featureId,
    });
  }

  // Step Activities
  static async logStepAdded(userId: string, projectId: string, featureId: string, featureName: string, stepCount: number) {
    await this.log({
      userId,
      type: 'CREATE',
      action: 'steps_added',
      description: `${stepCount} مرحله به ویژگی "${featureName}" اضافه شد`,
      metadata: { featureName, stepCount },
      projectId,
      featureId,
    });
  }

  static async logStepUpdated(userId: string, projectId: string, featureId: string, featureName: string, stepCount: number) {
    await this.log({
      userId,
      type: 'UPDATE',
      action: 'steps_updated',
      description: `${stepCount} مرحله در ویژگی "${featureName}" بروزرسانی شد`,
      metadata: { featureName, stepCount },
      projectId,
      featureId,
    });
  }

  // Background Activities
  static async logBackgroundUpdated(userId: string, projectId: string, featureId: string, featureName: string, stepCount: number) {
    await this.log({
      userId,
      type: 'UPDATE',
      action: 'background_updated',
      description: `پس‌زمینه ویژگی "${featureName}" با ${stepCount} مرحله بروزرسانی شد`,
      metadata: { featureName, stepCount },
      projectId,
      featureId,
    });
  }

  // User Activities
  static async logUserLogin(userId: string, userEmail: string) {
    await this.log({
      userId,
      type: 'LOGIN',
      action: 'user_login',
      description: `کاربر ${userEmail} وارد سیستم شد`,
      metadata: { userEmail },
    });
  }

  static async logUserLogout(userId: string, userEmail: string) {
    await this.log({
      userId,
      type: 'LOGOUT',
      action: 'user_logout',
      description: `کاربر ${userEmail} از سیستم خارج شد`,
      metadata: { userEmail },
    });
  }

  // Gherkin File Activities
  static async logGherkinFileCreated(userId: string, projectId: string, projectName: string, fileName: string) {
    await this.log({
      userId,
      type: 'CREATE',
      action: 'gherkin_file_created',
      description: `فایل Gherkin "${fileName}" در پروژه "${projectName}" ایجاد شد`,
      metadata: { projectName, fileName },
      projectId,
    });
  }

  // Bulk Operations
  static async logBulkFeatureUpdate(userId: string, projectId: string, projectName: string, featureCount: number) {
    await this.log({
      userId,
      type: 'UPDATE',
      action: 'bulk_feature_update',
      description: `${featureCount} ویژگی در پروژه "${projectName}" بروزرسانی شد`,
      metadata: { projectName, featureCount },
      projectId,
    });
  }
} 