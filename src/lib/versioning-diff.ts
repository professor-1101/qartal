export interface VersionDiff {
  features: FeatureDiff[];
  summary: {
    addedFeatures: number;
    removedFeatures: number;
    modifiedFeatures: number;
    addedScenarios: number;
    removedScenarios: number;
    modifiedScenarios: number;
  };
}

export interface FeatureDiff {
  id: string;
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldData?: any;
  newData?: any;
  scenarios: ScenarioDiff[];
  background?: BackgroundDiff;
}

export interface ScenarioDiff {
  id: string;
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldData?: any;
  newData?: any;
}

export interface BackgroundDiff {
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldData?: any;
  newData?: any;
}

export class VersionDiffGenerator {
  static generateDiff(oldSnapshot: any, newSnapshot: any): VersionDiff {
    const oldFeatures = oldSnapshot?.features || [];
    const newFeatures = newSnapshot?.features || [];
    
    const featureDiffs: FeatureDiff[] = [];
    const summary = {
      addedFeatures: 0,
      removedFeatures: 0,
      modifiedFeatures: 0,
      addedScenarios: 0,
      removedScenarios: 0,
      modifiedScenarios: 0
    };

    // Create maps for easy lookup
    const oldFeaturesMap = new Map(oldFeatures.map((f: any) => [f.id, f]));
    const newFeaturesMap = new Map(newFeatures.map((f: any) => [f.id, f]));

    // Find added features
    for (const newFeature of newFeatures) {
      if (!oldFeaturesMap.has(newFeature.id)) {
        featureDiffs.push({
          id: newFeature.id,
          name: newFeature.name,
          status: 'added',
          newData: newFeature,
          scenarios: this.generateScenarioDiffs([], this.getScenarios(newFeature)),
          background: this.generateBackgroundDiff(undefined, this.getBackground(newFeature))
        });
        summary.addedFeatures++;
        summary.addedScenarios += this.getScenarios(newFeature).length;
      }
    }

    // Find removed features
    for (const oldFeature of oldFeatures) {
      if (!newFeaturesMap.has(oldFeature.id)) {
        featureDiffs.push({
          id: oldFeature.id,
          name: oldFeature.name,
          status: 'removed',
          oldData: oldFeature,
          scenarios: this.generateScenarioDiffs(this.getScenarios(oldFeature), []),
          background: this.generateBackgroundDiff(this.getBackground(oldFeature), undefined)
        });
        summary.removedFeatures++;
        summary.removedScenarios += this.getScenarios(oldFeature).length;
      }
    }

    // Find modified features
    for (const oldFeature of oldFeatures) {
      const newFeature = newFeaturesMap.get(oldFeature.id);
      if (newFeature && this.hasFeatureChanged(oldFeature, newFeature)) {
        const scenarioDiffs = this.generateScenarioDiffs(
          this.getScenarios(oldFeature),
          this.getScenarios(newFeature)
        );
        
        featureDiffs.push({
          id: oldFeature.id,
          name: oldFeature.name,
          status: 'modified',
          oldData: oldFeature,
          newData: newFeature,
          scenarios: scenarioDiffs,
          background: this.generateBackgroundDiff(this.getBackground(oldFeature), this.getBackground(newFeature))
        });
        summary.modifiedFeatures++;
        
        // Count scenario changes
        scenarioDiffs.forEach(diff => {
          if (diff.status === 'added') summary.addedScenarios++;
          else if (diff.status === 'removed') summary.removedScenarios++;
          else if (diff.status === 'modified') summary.modifiedScenarios++;
        });
      }
    }

    return {
      features: featureDiffs,
      summary
    };
  }

  private static getScenarios(feature: any) {
    return feature && typeof feature === 'object' && Array.isArray(feature.scenarios)
      ? feature.scenarios
      : [];
  }

  private static getBackground(feature: any) {
    return feature && typeof feature === 'object' && 'background' in feature
      ? feature.background
      : undefined;
  }

  private static hasFeatureChanged(oldFeature: any, newFeature: any): boolean {
    // Compare basic properties
    if (oldFeature.name !== newFeature.name) return true;
    if (oldFeature.description !== newFeature.description) return true;
    
    // Compare scenarios
    const oldScenarios = this.getScenarios(oldFeature);
    const newScenarios = this.getScenarios(newFeature);
    
    if (oldScenarios.length !== newScenarios.length) return true;
    
    // Compare each scenario
    for (let i = 0; i < oldScenarios.length; i++) {
      if (this.hasScenarioChanged(oldScenarios[i], newScenarios[i])) {
        return true;
      }
    }
    
    // Compare background
    if (this.hasBackgroundChanged(this.getBackground(oldFeature), this.getBackground(newFeature))) {
      return true;
    }
    
    return false;
  }

  private static hasScenarioChanged(oldScenario: any, newScenario: any): boolean {
    if (!oldScenario || !newScenario) return oldScenario !== newScenario;
    
    if (oldScenario.name !== newScenario.name) return true;
    if (oldScenario.description !== newScenario.description) return true;
    
    // Compare steps
    const oldSteps = oldScenario.steps || [];
    const newSteps = newScenario.steps || [];
    
    if (oldSteps.length !== newSteps.length) return true;
    
    for (let i = 0; i < oldSteps.length; i++) {
      if (oldSteps[i].keyword !== newSteps[i].keyword ||
          oldSteps[i].text !== newSteps[i].text) {
        return true;
      }
    }
    
    return false;
  }

  private static hasBackgroundChanged(oldBackground: any, newBackground: any): boolean {
    if (!oldBackground || !newBackground) return oldBackground !== newBackground;
    
    if (oldBackground.description !== newBackground.description) return true;
    
    const oldSteps = oldBackground.steps || [];
    const newSteps = newBackground.steps || [];
    
    if (oldSteps.length !== newSteps.length) return true;
    
    for (let i = 0; i < oldSteps.length; i++) {
      if (oldSteps[i].keyword !== newSteps[i].keyword ||
          oldSteps[i].text !== newSteps[i].text) {
        return true;
      }
    }
    
    return false;
  }

  private static generateScenarioDiffs(oldScenarios: any[], newScenarios: any[]): ScenarioDiff[] {
    const diffs: ScenarioDiff[] = [];
    const newMap = new Map(newScenarios.map((s: any) => [s.id, s]));

    // First pass: Find exact matches by ID
    const processedOldIds = new Set();
    const processedNewIds = new Set();

    // Modified scenarios (exact ID match)
    for (const oldScenario of oldScenarios) {
      const newScenario = newMap.get(oldScenario.id);
      if (newScenario && this.hasScenarioChanged(oldScenario, newScenario)) {
        diffs.push({
          id: oldScenario.id,
          name: oldScenario.name,
          status: 'modified',
          oldData: oldScenario,
          newData: newScenario
        });
        processedOldIds.add(oldScenario.id);
        processedNewIds.add(newScenario.id);
      } else if (newScenario) {
        // Unchanged scenario
        processedOldIds.add(oldScenario.id);
        processedNewIds.add(newScenario.id);
      }
    }

    // Second pass: Try to match similar scenarios by name/content (potential renames or heavy edits)
    const unprocessedOld = oldScenarios.filter(s => !processedOldIds.has(s.id));
    const unprocessedNew = newScenarios.filter(s => !processedNewIds.has(s.id));

    for (const oldScenario of unprocessedOld) {
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const newScenario of unprocessedNew) {
        if (processedNewIds.has(newScenario.id)) continue;

        const similarity = this.calculateScenarioSimilarity(oldScenario, newScenario);
        if (similarity > highestSimilarity && similarity > 0.7) { // 70% similarity threshold
          highestSimilarity = similarity;
          bestMatch = newScenario;
        }
      }

      if (bestMatch) {
        // This is likely a modified scenario (renamed or heavily edited)
        diffs.push({
          id: oldScenario.id,
          name: oldScenario.name,
          status: 'modified',
          oldData: oldScenario,
          newData: bestMatch
        });
        processedOldIds.add(oldScenario.id);
        processedNewIds.add(bestMatch.id);
      }
    }

    // Third pass: Remaining are truly added/removed
    for (const oldScenario of oldScenarios) {
      if (!processedOldIds.has(oldScenario.id)) {
        diffs.push({
          id: oldScenario.id,
          name: oldScenario.name,
          status: 'removed',
          oldData: oldScenario
        });
      }
    }

    for (const newScenario of newScenarios) {
      if (!processedNewIds.has(newScenario.id)) {
        diffs.push({
          id: newScenario.id,
          name: newScenario.name,
          status: 'added',
          newData: newScenario
        });
      }
    }

    return diffs;
  }

  private static calculateScenarioSimilarity(scenario1: any, scenario2: any): number {
    if (!scenario1 || !scenario2) return 0;

    let score = 0;
    let totalChecks = 0;

    // Name similarity (weighted heavily)
    if (scenario1.name && scenario2.name) {
      const nameSimilarity = this.calculateStringSimilarity(scenario1.name, scenario2.name);
      score += nameSimilarity * 0.4;
      totalChecks += 0.4;
    }

    // Description similarity
    if (scenario1.description && scenario2.description) {
      const descSimilarity = this.calculateStringSimilarity(scenario1.description, scenario2.description);
      score += descSimilarity * 0.2;
      totalChecks += 0.2;
    }

    // Steps similarity (most important for content)
    const oldSteps = scenario1.steps || [];
    const newSteps = scenario2.steps || [];
    
    if (oldSteps.length > 0 || newSteps.length > 0) {
      const stepsSimilarity = this.calculateStepsSimilarity(oldSteps, newSteps);
      score += stepsSimilarity * 0.4;
      totalChecks += 0.4;
    }

    return totalChecks > 0 ? score / totalChecks : 0;
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    // Simple edit distance based similarity
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static calculateStepsSimilarity(steps1: any[], steps2: any[]): number {
    if (steps1.length === 0 && steps2.length === 0) return 1;
    if (steps1.length === 0 || steps2.length === 0) return 0;

    let matchedSteps = 0;
    const maxSteps = Math.max(steps1.length, steps2.length);

    // Find matching steps (order-independent)
    for (const step1 of steps1) {
      for (const step2 of steps2) {
        if (step1.keyword === step2.keyword && 
            this.calculateStringSimilarity(step1.text || '', step2.text || '') > 0.8) {
          matchedSteps++;
          break;
        }
      }
    }

    return matchedSteps / maxSteps;
  }

  private static calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private static generateBackgroundDiff(oldBackground: any, newBackground: any): BackgroundDiff | undefined {
    if (!oldBackground && !newBackground) return undefined;
    
    if (!oldBackground && newBackground) {
      return {
        status: 'added',
        newData: newBackground
      };
    }
    
    if (oldBackground && !newBackground) {
      return {
        status: 'removed',
        oldData: oldBackground
      };
    }
    
    if (this.hasBackgroundChanged(oldBackground, newBackground)) {
      return {
        status: 'modified',
        oldData: oldBackground,
        newData: newBackground
      };
    }
    
    return {
      status: 'unchanged',
      oldData: oldBackground,
      newData: newBackground
    };
  }
} 