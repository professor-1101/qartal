// @ts-nocheck
import type { Feature, Project } from '@/types';
import type { Scenario, Step, Rule, StepType } from '@/types/gherkin';

// Helper function to convert feature to Gherkin format
const convertFeatureToGherkin = (feature: Feature): string => {
    let gherkin = '';
    
    // Feature header
    gherkin += `# language: fa\n`;
    gherkin += `@feature\n`;
    gherkin += `Feature: ${feature.name}\n`;
    
    if (feature.description) {
        gherkin += `  ${feature.description}\n`;
    }
    
    gherkin += '\n';
    
    // Background
    if (feature.background && feature.background.steps && feature.background.steps.length > 0) {
        gherkin += `  Background:\n`;
        feature.background.steps.forEach(step => {
            gherkin += `    ${step.keyword} ${step.text}\n`;
        });
        gherkin += '\n';
    }
    
    // Rules
    if (feature.rules && feature.rules.length > 0) {
        feature.rules.forEach(rule => {
            gherkin += `  Rule: ${rule.name}\n`;
            if (rule.description) {
                gherkin += `    ${rule.description}\n`;
            }
            gherkin += '\n';
            
            rule.scenarios.forEach(scenario => {
                gherkin += convertScenarioToGherkin(scenario, '    ');
            });
        });
    }
    
    // Scenarios (not in rules)
    if (feature.scenarios && feature.scenarios.length > 0) {
        feature.scenarios.forEach(scenario => {
            gherkin += convertScenarioToGherkin(scenario, '  ');
        });
    }
    
    return gherkin;
};

// Helper function to convert scenario to Gherkin format
const convertScenarioToGherkin = (scenario: Scenario, indent: string = '  '): string => {
    let gherkin = '';
    
    // Scenario header
    if (scenario.type === 'scenario-outline') {
        gherkin += `${indent}Scenario Outline: ${scenario.name}\n`;
    } else {
        gherkin += `${indent}Scenario: ${scenario.name}\n`;
    }
    
    if (scenario.description) {
        gherkin += `${indent}  ${scenario.description}\n`;
    }
    
    // Steps
    scenario.steps.forEach(step => {
        gherkin += `${indent}  ${step.keyword} ${step.text}\n`;
        
        // Data table
        if (step.dataTable && step.dataTable.headers.length > 0) {
            gherkin += `${indent}    | ${step.dataTable.headers.join(' | ')} |\n`;
            step.dataTable.rows.forEach(row => {
                gherkin += `${indent}    | ${row.values.join(' | ')} |\n`;
            });
        }
        
        // Doc string
        if (step.docString) {
            gherkin += `${indent}    """\n`;
            gherkin += `${indent}    ${step.docString.content}\n`;
            gherkin += `${indent}    """\n`;
        }
    });
    
    // Examples for scenario outline
    if (scenario.examples && scenario.examples.headers.length > 0) {
        gherkin += `${indent}  Examples:\n`;
        gherkin += `${indent}    | ${scenario.examples.headers.join(' | ')} |\n`;
        scenario.examples.rows.forEach(row => {
            gherkin += `${indent}    | ${row.values.join(' | ')} |\n`;
        });
    }
    
    gherkin += '\n';
    return gherkin;
};

// Main function to export features as ZIP
export async function exportFeaturesAsZIP(project: Project, features: Feature[]) {
    if (typeof window === 'undefined') {
        throw new Error('exportFeaturesAsZIP باید فقط در کلاینت (مرورگر) اجرا شود.');
    }

    console.log('=== شروع export Features ZIP ===');
    
    try {
        // Dynamic import of JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Add project info file
        const projectInfo = `Project: ${project.name}
Description: ${project.description || 'No description'}
Author: ${project.authorName}
Created: ${project.createdAt}
Updated: ${project.updatedAt}
Features Count: ${features.length}

Features:
${features.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}
`;
        
        zip.file('project-info.txt', projectInfo);
        
        // Add each feature as a separate folder with .feature file
        features.forEach((feature, index) => {
            // Create folder with feature name
            const folderName = feature.name.replace(/[<>:"/\\|?*]/g, '_').trim();
            const featureFolder = zip.folder(folderName);
            
            if (featureFolder) {
                // Add .feature file with UTF-8 encoding
                const gherkinContent = convertFeatureToGherkin(feature);
                featureFolder.file(`${folderName}.feature`, gherkinContent);
                
                // Add feature info file
                const featureInfo = `Feature: ${feature.name}
Description: ${feature.description || 'No description'}
Scenarios Count: ${feature.scenarios?.length || 0}
Rules Count: ${feature.rules?.length || 0}
Background: ${feature.background ? 'Yes' : 'No'}

Scenarios:
${feature.scenarios?.map(s => `- ${s.name} (${s.type})`).join('\n') || 'No scenarios'}

Rules:
${feature.rules?.map(r => `- ${r.name}`).join('\n') || 'No rules'}
`;
                
                featureFolder.file('info.txt', featureInfo);
            }
        });
        
        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        console.log('ZIP created successfully, size:', zipBlob.size);
        
        // Download the ZIP
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name}-features.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('=== ZIP export completed ===');
    } catch (error) {
        console.error('Error creating ZIP:', error);
        throw error;
    }
}

// Function to export shared view as HTML with CSS
export async function exportSharedViewAsHTML(project: Project, features: Feature[]) {
    if (typeof window === 'undefined') {
        throw new Error('exportSharedViewAsHTML باید فقط در کلاینت (مرورگر) اجرا شود.');
    }

    console.log('=== شروع export Shared View HTML ===');
    
    try {
        // Create HTML content with embedded CSS
        const htmlContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - قارتال</title>
    <style>
        @font-face {
            font-family: 'Dana';
            src: url('data:font/woff2;base64,d09GMgABAAAAAA...') format('woff2');
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Dana', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            direction: rtl;
            text-align: right;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .project-info {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-item {
            text-align: center;
        }
        
        .info-item strong {
            display: block;
            color: #667eea;
            font-size: 1.2rem;
        }
        
        .content {
            padding: 30px;
        }
        
        .feature {
            margin-bottom: 40px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .feature-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .feature-title {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 10px;
        }
        
        .feature-description {
            color: #666;
            font-size: 1rem;
        }
        
        .feature-content {
            padding: 20px;
        }
        
        .background {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 6px;
            border-right: 4px solid #667eea;
        }
        
        .background h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .rule {
            background: #fff3cd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 6px;
            border-right: 4px solid #ffc107;
        }
        
        .rule h3 {
            color: #856404;
            margin-bottom: 10px;
        }
        
        .scenario {
            background: #d1ecf1;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            border-right: 4px solid #17a2b8;
        }
        
        .scenario h3 {
            color: #0c5460;
            margin-bottom: 10px;
        }
        
        .step {
            margin-bottom: 8px;
            padding: 8px;
            background: white;
            border-radius: 4px;
            border-right: 3px solid #28a745;
        }
        
        .keyword {
            font-weight: bold;
            color: #28a745;
        }
        
        .examples {
            margin-top: 15px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
        }
        
        .examples h4 {
            color: #495057;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        th, td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: right;
        }
        
        th {
            background: #e9ecef;
            font-weight: bold;
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
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${project.name}</h1>
            <p>${project.description || 'توضیحات پروژه'}</p>
        </div>
        
        <div class="project-info">
            <div class="info-item">
                <strong>${features.length}</strong>
                <span>ویژگی</span>
            </div>
            <div class="info-item">
                <strong>${project.authorName}</strong>
                <span>نویسنده</span>
            </div>
            <div class="info-item">
                <strong>${new Date(project.updatedAt).toLocaleDateString('fa-IR')}</strong>
                <span>آخرین بروزرسانی</span>
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
                                ${feature.background.steps.map(step => `
                                    <div class="step">
                                        <span class="keyword">${step.keyword}</span> ${step.text}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${feature.rules && feature.rules.length > 0 ? feature.rules.map(rule => `
                            <div class="rule">
                                <h3>قانون: ${rule.name}</h3>
                                ${rule.description ? `<p>${rule.description}</p>` : ''}
                                ${rule.scenarios.map(scenario => `
                                    <div class="scenario">
                                        <h3>سناریو: ${scenario.name}</h3>
                                        ${scenario.description ? `<p>${scenario.description}</p>` : ''}
                                        ${scenario.steps.map(step => `
                                            <div class="step">
                                                <span class="keyword">${step.keyword}</span> ${step.text}
                                            </div>
                                        `).join('')}
                                        ${scenario.examples && scenario.examples.headers.length > 0 ? `
                                            <div class="examples">
                                                <h4>مثال‌ها:</h4>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            ${scenario.examples.headers.map(header => `<th>${header}</th>`).join('')}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${scenario.examples.rows.map(row => `
                                                            <tr>
                                                                ${row.values.map(value => `<td>${value}</td>`).join('')}
                                                            </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        `).join('') : ''}
                        
                        ${feature.scenarios && feature.scenarios.length > 0 ? feature.scenarios.map(scenario => `
                            <div class="scenario">
                                <h3>سناریو: ${scenario.name}</h3>
                                ${scenario.description ? `<p>${scenario.description}</p>` : ''}
                                ${scenario.steps.map(step => `
                                    <div class="step">
                                        <span class="keyword">${step.keyword}</span> ${step.text}
                                    </div>
                                `).join('')}
                                ${scenario.examples && scenario.examples.headers.length > 0 ? `
                                    <div class="examples">
                                        <h4>مثال‌ها:</h4>
                                        <table>
                                            <thead>
                                                <tr>
                                                    ${scenario.examples.headers.map(header => `<th>${header}</th>`).join('')}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${scenario.examples.rows.map(row => `
                                                    <tr>
                                                        ${row.values.map(value => `<td>${value}</td>`).join('')}
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name}-shared-view.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('=== HTML export completed ===');
    } catch (error) {
        console.error('Error creating HTML:', error);
        throw error;
    }
} 