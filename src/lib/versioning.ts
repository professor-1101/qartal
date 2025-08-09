import { prisma } from '@/lib/prisma';
import { ProjectWithFeatures, Feature } from '@/types';

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
}

export interface ProjectSnapshot {
  project: ProjectWithFeatures;
  features: Feature[];
  metadata: {
    totalFeatures: number;
    totalScenarios: number;
    totalSteps: number;
    timestamp: string;
  };
}

export interface ChangesSummary {
  features: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  scenarios: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  steps: {
    added: number;
    modified: number;
    deleted: number;
  };
  metadata: {
    previousVersion?: string;
    changeCount: number;
  };
}

export class VersioningService {
  
  /**
   * Parse semantic version string
   */
  static parseVersion(version: string): VersionInfo {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error('Invalid semantic version format');
    }
    return {
      version,
      major: parts[0],
      minor: parts[1],
      patch: parts[2]
    };
  }

  /**
   * Generate next version based on type
   */
  static getNextVersion(currentVersion: string, type: 'major' | 'minor' | 'patch'): VersionInfo {
    const current = this.parseVersion(currentVersion);
    
    switch (type) {
      case 'major':
        return {
          version: `${current.major + 1}.0.0`,
          major: current.major + 1,
          minor: 0,
          patch: 0
        };
      case 'minor':
        return {
          version: `${current.major}.${current.minor + 1}.0`,
          major: current.major,
          minor: current.minor + 1,
          patch: 0
        };
      case 'patch':
        return {
          version: `${current.major}.${current.minor}.${current.patch + 1}`,
          major: current.major,
          minor: current.minor,
          patch: current.patch + 1
        };
      default:
        throw new Error('Invalid version type');
    }
  }

  /**
   * Get latest version for a project
   */
  static async getLatestVersion(projectId: string): Promise<VersionInfo> {
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { 
        projectId,
        status: 'APPROVED'
      },
      orderBy: [
        { major: 'desc' },
        { minor: 'desc' },
        { patch: 'desc' }
      ]
    });

    if (latestVersion) {
      return {
        version: latestVersion.version,
        major: latestVersion.major,
        minor: latestVersion.minor,
        patch: latestVersion.patch
      };
    }
    
    return { version: '0.0.0', major: 0, minor: 0, patch: 0 };
  }

  /**
   * Create project snapshot from project data
   */
  static createProjectSnapshot(project: any): ProjectSnapshot {
    if (!project) {
      throw new Error('Project not found');
    }

    // Safely handle features array
    const features = Array.isArray(project.features) ? project.features : [];
    
    const totalScenarios = features.reduce((sum: number, feature: any) => {
      try {
        return sum + (Array.isArray(feature.scenarios) ? feature.scenarios.length : 0);
      } catch {
        return sum;
      }
    }, 0);
    
    const totalSteps = features.reduce((sum: number, feature: any) => {
      try {
        const scenarioSteps = Array.isArray(feature.scenarios) 
          ? feature.scenarios.reduce((stepSum: number, scenario: any) => 
              stepSum + (Array.isArray(scenario.steps) ? scenario.steps.length : 0), 0)
          : 0;
        const backgroundSteps = Array.isArray(feature.background?.steps) ? feature.background.steps.length : 0;
        return sum + scenarioSteps + backgroundSteps;
      } catch {
        return sum;
      }
    }, 0);

    return {
      project: project as any,
      features: features as any,
      metadata: {
        totalFeatures: features.length,
        totalScenarios,
        totalSteps,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Compare two project snapshots and generate changes summary
   */
  static compareSnapshots(previous: ProjectSnapshot, current: ProjectSnapshot): ChangesSummary {
    const previousFeatures = new Map(previous.features.map(f => [f.id, f]));
    const currentFeatures = new Map(current.features.map(f => [f.id, f]));

    const addedFeatures: string[] = [];
    const modifiedFeatures: string[] = [];
    const deletedFeatures: string[] = [];

    // Find added and modified features
    for (const [id, feature] of Array.from(currentFeatures.entries())) {
      if (!previousFeatures.has(id)) {
        addedFeatures.push(feature.name);
      } else {
        const prevFeature = previousFeatures.get(id)!;
        if (JSON.stringify(prevFeature) !== JSON.stringify(feature)) {
          modifiedFeatures.push(feature.name);
        }
      }
    }

    // Find deleted features
    for (const [id, feature] of Array.from(previousFeatures.entries())) {
      if (!currentFeatures.has(id)) {
        deletedFeatures.push(feature.name);
      }
    }

    // Similar logic for scenarios (simplified for now)
    const prevScenarios = previous.features.flatMap(f => f.scenarios || []);
    const currScenarios = current.features.flatMap(f => f.scenarios || []);
    
    const addedScenarios = currScenarios
      .filter(s => !prevScenarios.find(ps => ps.id === s.id))
      .map(s => s.name);
    
    const modifiedScenarios = currScenarios
      .filter(s => {
        const prev = prevScenarios.find(ps => ps.id === s.id);
        return prev && JSON.stringify(prev) !== JSON.stringify(s);
      })
      .map(s => s.name);

    const deletedScenarios = prevScenarios
      .filter(s => !currScenarios.find(cs => cs.id === s.id))
      .map(s => s.name);

    return {
      features: {
        added: addedFeatures,
        modified: modifiedFeatures,
        deleted: deletedFeatures
      },
      scenarios: {
        added: addedScenarios,
        modified: modifiedScenarios,
        deleted: deletedScenarios
      },
      steps: {
        added: Math.max(0, current.metadata.totalSteps - previous.metadata.totalSteps),
        modified: 0, // Simplified for now
        deleted: Math.max(0, previous.metadata.totalSteps - current.metadata.totalSteps)
      },
      metadata: {
        changeCount: addedFeatures.length + modifiedFeatures.length + deletedFeatures.length +
                    addedScenarios.length + modifiedScenarios.length + deletedScenarios.length
      }
    };
  }

  /**
   * Generate release notes from changes summary
   */
  static generateReleaseNotes(changes: ChangesSummary, version: string): string {
    const notes: string[] = [];
    
    notes.push(`# نسخه ${version}`);
    notes.push('');

    if (changes.features.added.length > 0) {
      notes.push('## ویژگی‌های جدید');
      changes.features.added.forEach(name => notes.push(`- ${name}`));
      notes.push('');
    }

    if (changes.features.modified.length > 0) {
      notes.push('## ویژگی‌های بروزرسانی شده');
      changes.features.modified.forEach(name => notes.push(`- ${name}`));
      notes.push('');
    }

    if (changes.features.deleted.length > 0) {
      notes.push('## ویژگی‌های حذف شده');
      changes.features.deleted.forEach(name => notes.push(`- ${name}`));
      notes.push('');
    }

    if (changes.scenarios.added.length > 0) {
      notes.push('## سناریوهای جدید');
      changes.scenarios.added.forEach(name => notes.push(`- ${name}`));
      notes.push('');
    }

    if (changes.scenarios.modified.length > 0) {
      notes.push('## سناریوهای بروزرسانی شده');
      changes.scenarios.modified.forEach(name => notes.push(`- ${name}`));
      notes.push('');
    }

    if (changes.scenarios.deleted.length > 0) {
      notes.push('## سناریوهای حذف شده');
      changes.scenarios.deleted.forEach(name => notes.push(`- ${name}`));
      notes.push('');
    }

    if (changes.steps.added > 0 || changes.steps.deleted > 0) {
      notes.push('## آمار مراحل');
      if (changes.steps.added > 0) {
        notes.push(`- ${changes.steps.added} مرحله اضافه شد`);
      }
      if (changes.steps.deleted > 0) {
        notes.push(`- ${changes.steps.deleted} مرحله حذف شد`);
      }
      notes.push('');
    }

    notes.push(`**تعداد کل تغییرات:** ${changes.metadata.changeCount}`);

    return notes.join('\n');
  }
}