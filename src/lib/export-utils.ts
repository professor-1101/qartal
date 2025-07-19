import { prisma } from './prisma';
import type { Project } from '@/types';
import type { ProjectWithFeatures } from '@/types/entities';
import { Feature, Scenario, Rule, Step } from '@/types/gherkin';
import { deepNormalizeProject, deepNormalizeFeature } from './deepNormalize';

// تابع مشترک برای ساخت HTML زیبا و مینیمال
export const createBeautifulHTML = (project: import('@/types/entities').ProjectWithFeatures, features: import('@/types/gherkin').Feature[]) => {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - گزارش پروژه</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vazir-font@30.1.0/dist/font-face.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Vazir', 'Tahoma', sans-serif;
            background: #ffffff;
            color: #0f172a;
            line-height: 1.6;
            font-size: 14px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 48px;
            padding-bottom: 32px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
            letter-spacing: -0.025em;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 1.125rem;
            color: #64748b;
            margin-bottom: 24px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .project-meta {
            display: flex;
            justify-content: center;
            gap: 48px;
            margin-top: 24px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-item .value {
            display: block;
            font-size: 1.25rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
        }
        
        .meta-item .label {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .content {
            margin-top: 48px;
        }
        
        .feature {
            margin-bottom: 48px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        
        .feature-header {
            background: #f8fafc;
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .feature-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 8px;
        }
        
        .feature-description {
            color: #64748b;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .feature-content {
            padding: 24px;
        }
        
        .background {
            background: #f1f5f9;
            padding: 20px;
            margin-bottom: 24px;
            border-radius: 8px;
            border-right: 3px solid #3b82f6;
        }
        
        .background h3 {
            color: #1e40af;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .rule {
            background: #fef3c7;
            padding: 20px;
            margin-bottom: 24px;
            border-radius: 8px;
            border-right: 3px solid #f59e0b;
        }
        
        .rule h3 {
            color: #92400e;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .scenario {
            background: #dbeafe;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-right: 3px solid #2563eb;
        }
        
        .scenario h3 {
            color: #1e40af;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .step {
            margin-bottom: 12px;
            padding: 12px 16px;
            background: #ffffff;
            border-radius: 6px;
            border-right: 2px solid #10b981;
            font-size: 0.875rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .keyword {
            font-weight: 600;
            color: #059669;
            background: #ecfdf5;
            padding: 4px 8px;
            border-radius: 4px;
            margin-left: 6px;
            font-size: 0.8rem;
            border: 1px solid #d1fae5;
        }
        
        .examples {
            margin-top: 20px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .examples h4 {
            color: #374151;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 0.75rem;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        th, td {
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            text-align: right;
        }
        
        th {
            background: #f1f5f9;
            font-weight: 600;
            color: #374151;
        }
        
        td {
            background: #ffffff;
            color: #374151;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .feature {
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${project.name}</h1>
            <p>${project.description || 'توضیحات پروژه'}</p>
            <div class="project-meta">
                <div class="meta-item">
                    <span class="value">${features.length}</span>
                    <span class="label">ویژگی</span>
                </div>
                <div class="meta-item">
                    <span class="value">${project.authorName}</span>
                    <span class="label">نویسنده</span>
                </div>
                <div class="meta-item">
                    <span class="value">${new Date(project.updatedAt).toLocaleDateString('fa-IR')}</span>
                    <span class="label">آخرین بروزرسانی</span>
                </div>
            </div>
        </div>
        
        <div class="content">
            ${features.map((feature, index) => `
                <div class="feature ${index > 0 ? 'page-break' : ''}">
                    <div class="feature-header">
                        <h2 class="feature-title">${index + 1}. ${feature.name}</h2>
                        ${feature.description ? `<p class="feature-description">${feature.description}</p>` : ''}
                    </div>
                    
                    <div class="feature-content">
                        ${feature.background && feature.background.steps && feature.background.steps.length > 0 ? `
                            <div class="background">
                                <h3>پس‌زمینه</h3>
                                ${(Array.isArray(feature.background.steps) ? feature.background.steps : []).map(step => `
                                    <div class="step">
                                        <span class="keyword">${step.keyword}</span> ${step.text}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${(Array.isArray(feature.rules) ? feature.rules : []).map(rule => `
                            <div class="rule">
                                <h3>قانون: ${rule.name}</h3>
                                ${rule.description ? `<p>${rule.description}</p>` : ''}
                                ${(Array.isArray(rule.scenarios) ? rule.scenarios : []).map(scenario => `
                                    <div class="scenario">
                                        <h3>سناریو: ${scenario.name}</h3>
                                        ${scenario.description ? `<p>${scenario.description}</p>` : ''}
                                        ${(Array.isArray(scenario.steps) ? scenario.steps : []).map(step => `
                                            <div class="step">
                                                <span class="keyword">${step.keyword}</span> ${step.text}
                                            </div>
                                        `).join('')}
                                        ${(scenario.examples && Array.isArray(scenario.examples.headers) && scenario.examples.headers.length > 0) ? `
                                            <div class="examples">
                                                <h4>مثال‌ها:</h4>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            ${(Array.isArray(scenario.examples.headers) ? scenario.examples.headers : []).map(header => `<th>${header}</th>`).join('')}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${(Array.isArray(scenario.examples.rows) ? scenario.examples.rows : []).map(row => `
                                                            <tr>
                                                                ${(Array.isArray(row.values) ? row.values : []).map(value => `<td>${value}</td>`).join('')}
                                                            </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                        
                        ${(Array.isArray(feature.scenarios) ? feature.scenarios : []).map(scenario => `
                            <div class="scenario">
                                <h3>سناریو: ${scenario.name}</h3>
                                ${scenario.description ? `<p>${scenario.description}</p>` : ''}
                                ${(Array.isArray(scenario.steps) ? scenario.steps : []).map(step => `
                                    <div class="step">
                                        <span class="keyword">${step.keyword}</span> ${step.text}
                                    </div>
                                `).join('')}
                                ${(scenario.examples && Array.isArray(scenario.examples.headers) && scenario.examples.headers.length > 0) ? `
                                    <div class="examples">
                                        <h4>مثال‌ها:</h4>
                                        <table>
                                            <thead>
                                                <tr>
                                                    ${(Array.isArray(scenario.examples.headers) ? scenario.examples.headers : []).map(header => `<th>${header}</th>`).join('')}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${(Array.isArray(scenario.examples.rows) ? scenario.examples.rows : []).map(row => `
                                                    <tr>
                                                        ${(Array.isArray(row.values) ? row.values : []).map(value => `<td>${value}</td>`).join('')}
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
};

// تابع wrapper برای سازگاری با type قدیمی Project
export const createBeautifulHTMLForClient = (project: Project, features: Feature[]) => {
  const projectWithFeatures: import('@/types/entities').ProjectWithFeatures = {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    status: project.status,
    authorName: project.authorName,
    features: features,
  };
  return createBeautifulHTML(projectWithFeatures, features);
};

// Utility to deeply normalize all arrays in a feature
export function normalizeFeatureDeep(feature: Feature): Feature {
  feature.tags = Array.isArray(feature.tags) ? feature.tags : [];
  if (feature.background) {
    feature.background.steps = Array.isArray(feature.background.steps) ? feature.background.steps : [];
  }
  feature.scenarios = Array.isArray(feature.scenarios) ? feature.scenarios : [];
  feature.scenarios.forEach((scenario: Scenario) => {
    scenario.tags = Array.isArray(scenario.tags) ? scenario.tags : [];
    scenario.steps = Array.isArray(scenario.steps) ? scenario.steps : [];
    if (scenario.examples) {
      scenario.examples.headers = Array.isArray(scenario.examples.headers) ? scenario.examples.headers : [];
      scenario.examples.rows = Array.isArray(scenario.examples.rows) ? scenario.examples.rows : [];
      scenario.examples.rows.forEach(row => {
        row.values = Array.isArray(row.values) ? row.values : [];
      });
    }
  });
  if (feature.rules && Array.isArray(feature.rules)) {
    feature.rules.forEach((rule: Rule) => {
      rule.tags = Array.isArray(rule.tags) ? rule.tags : [];
      rule.scenarios = Array.isArray(rule.scenarios) ? rule.scenarios : [];
      rule.scenarios.forEach((scenario: Scenario) => {
        scenario.tags = Array.isArray(scenario.tags) ? scenario.tags : [];
        scenario.steps = Array.isArray(scenario.steps) ? scenario.steps : [];
        if (scenario.examples) {
          scenario.examples.headers = Array.isArray(scenario.examples.headers) ? scenario.examples.headers : [];
          scenario.examples.rows = Array.isArray(scenario.examples.rows) ? scenario.examples.rows : [];
          scenario.examples.rows.forEach(row => {
            row.values = Array.isArray(row.values) ? row.values : [];
          });
        }
      });
    });
  }
  return feature;
}

// تابع برای ساخت Gherkin از Feature
export const createGherkinFromFeature = (feature: Feature): string => {
    const safeFeature = normalizeFeatureDeep({ ...feature });
    let gherkin = '';
    gherkin += `# language: fa\n`;
    gherkin += `@feature\n`;
    gherkin += `Feature: ${safeFeature.name}\n`;
    if (safeFeature.description) gherkin += `  ${safeFeature.description}\n`;
    gherkin += '\n';
    
    if (safeFeature.background && safeFeature.background.steps && safeFeature.background.steps.length > 0) {
        gherkin += `  Background:\n`;
        safeFeature.background.steps.forEach((step: Step) => {
            gherkin += `    ${step.keyword} ${step.text}\n`;
        });
        gherkin += '\n';
    }
    
    if (safeFeature.rules && safeFeature.rules.length > 0) {
        safeFeature.rules.forEach((rule: Rule) => {
            gherkin += `  Rule: ${rule.name}\n`;
            if (rule.description) gherkin += `    ${rule.description}\n`;
            gherkin += '\n';
            rule.scenarios.forEach((scenario: Scenario) => {
                gherkin += `    Scenario: ${scenario.name}\n`;
                if (scenario.description) gherkin += `      ${scenario.description}\n`;
                scenario.steps.forEach((step: Step) => {
                    gherkin += `      ${step.keyword} ${step.text}\n`;
                });
                // Add examples for scenario outlines
                if (scenario.type === 'scenario-outline' && scenario.examples && Array.isArray(scenario.examples.headers) && scenario.examples.headers.length > 0) {
                    gherkin += `\n      Examples:\n`;
                    gherkin += `        | ${(Array.isArray(scenario.examples.headers) ? scenario.examples.headers : []).join(' | ')} |\n`;
                    (Array.isArray(scenario.examples.rows) ? scenario.examples.rows : []).forEach(row => {
                        gherkin += `        | ${(Array.isArray(row.values) ? row.values : []).join(' | ')} |\n`;
                    });
                }
                gherkin += '\n';
            });
        });
    }
    
    if (safeFeature.scenarios && safeFeature.scenarios.length > 0) {
        safeFeature.scenarios.forEach((scenario: Scenario) => {
            gherkin += `  Scenario: ${scenario.name}\n`;
            if (scenario.description) gherkin += `    ${scenario.description}\n`;
            scenario.steps.forEach((step: Step) => {
                gherkin += `    ${step.keyword} ${step.text}\n`;
            });
            // Add examples for scenario outlines
            if (scenario.type === 'scenario-outline' && scenario.examples && Array.isArray(scenario.examples.headers) && scenario.examples.headers.length > 0) {
                gherkin += `\n    Examples:\n`;
                gherkin += `      | ${(Array.isArray(scenario.examples.headers) ? scenario.examples.headers : []).join(' | ')} |\n`;
                (Array.isArray(scenario.examples.rows) ? scenario.examples.rows : []).forEach(row => {
                    gherkin += `      | ${(Array.isArray(row.values) ? row.values : []).join(' | ')} |\n`;
                });
            }
            gherkin += '\n';
        });
    }
    
    return gherkin;
};

// تابع برای ساخت info.txt از Feature
export const createFeatureInfo = (feature: Feature): string => {
    return `Feature: ${feature.name}
Description: ${feature.description || 'No description'}
Scenarios Count: ${feature.scenarios?.length || 0}
Rules Count: ${feature.rules?.length || 0}
Background: ${feature.background ? 'Yes' : 'No'}

Scenarios:
${feature.scenarios?.map(s => `- ${s.name} (${s.type})`).join('\n') || 'No scenarios'}

Rules:
${feature.rules?.map(r => `- ${r.name}`).join('\n') || 'No rules'}
`;
};

// تابع برای ساخت project info
export const createProjectInfo = (project: Project, features: Feature[]): string => {
    return `Project: ${project.name}
Description: ${project.description || 'No description'}
Author: ${project.authorName}
Created: ${project.createdAt}
Updated: ${project.updatedAt}
Features Count: ${features.length}

Features:
${features.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}
`;
}; 

// گرفتن پروژه و فیچرها برای export PDF
export async function getProjectWithFeatures(projectId: string): Promise<ProjectWithFeatures | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      features: {
        include: {
          scenarios: { include: { steps: true, examples: true } },
          background: { include: { steps: true } },
        },
        orderBy: { order: 'asc' },
      },
      user: true,
    },
  });
  if (!project) return null;
  // تبدیل rulesJson به rules
  const features = project.features.map((f: any) => ({
    ...f,
    rules: f.rulesJson ? Array.isArray(f.rulesJson) ? f.rulesJson : [] : [],
  }));
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    status: project.status as string,
    authorName: [project.user?.firstName, project.user?.lastName].filter(Boolean).join(' ') || '',
    features: features,
  };
} 

// هنگام اکسپورت پروژه:
export function exportProjectSafe(project: any) {
  return JSON.stringify(deepNormalizeProject(project), null, 2);
}
// هنگام اکسپورت feature:
export function exportFeatureSafe(feature: any) {
  return JSON.stringify(deepNormalizeFeature(feature), null, 2);
} 