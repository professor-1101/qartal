import type { Feature, Project } from '@/types';

// تابع مشترک برای ساخت HTML زیبا و مینیمال
export const createBeautifulHTML = (project: Project, features: Feature[]) => {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - قارتال</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #0f172a;
            background: #ffffff;
            padding: 0;
            direction: rtl;
            text-align: right;
            font-size: 14px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        
        .header p {
            font-size: 1.1rem;
            color: #64748b;
            margin-bottom: 20px;
        }
        
        .project-meta {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-item .value {
            display: block;
            font-size: 1.2rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
        }
        
        .meta-item .label {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .content {
            margin-top: 40px;
        }
        
        .feature {
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .feature-header {
            background: #f8fafc;
            padding: 20px;
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
            padding: 20px;
        }
        
        .background {
            background: #f1f5f9;
            padding: 16px;
            margin-bottom: 20px;
            border-radius: 6px;
            border-right: 3px solid #3b82f6;
        }
        
        .background h3 {
            color: #1e40af;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .rule {
            background: #fef3c7;
            padding: 16px;
            margin-bottom: 20px;
            border-radius: 6px;
            border-right: 3px solid #f59e0b;
        }
        
        .rule h3 {
            color: #92400e;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .scenario {
            background: #dbeafe;
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 6px;
            border-right: 3px solid #2563eb;
        }
        
        .scenario h3 {
            color: #1e40af;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .step {
            margin-bottom: 8px;
            padding: 8px 12px;
            background: #ffffff;
            border-radius: 4px;
            border-right: 2px solid #10b981;
            font-size: 0.875rem;
        }
        
        .keyword {
            font-weight: 600;
            color: #059669;
        }
        
        .examples {
            margin-top: 16px;
            background: #f8fafc;
            padding: 16px;
            border-radius: 6px;
        }
        
        .examples h4 {
            color: #374151;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 0.75rem;
        }
        
        th, td {
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
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
};

// تابع مشترک برای ساخت PDF از HTML
export const createPDFBlob = async (htmlContent: string): Promise<Blob> => {
    if (typeof window === 'undefined') {
        throw new Error('createPDFBlob باید فقط در کلاینت (مرورگر) اجرا شود.');
    }

    try {
        // Method 1: Try html2pdf.js first
        return await createPDFWithHtml2Pdf(htmlContent);
    } catch (error) {
        console.warn('html2pdf.js failed, trying alternative method:', error);
        // Method 2: Fallback to jsPDF with html2canvas
        return await createPDFWithJsPDF(htmlContent);
    }
};

// Method 1: Using html2pdf.js
const createPDFWithHtml2Pdf = async (htmlContent: string): Promise<Blob> => {
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '0';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.height = 'auto';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.zIndex = '-9999';
    document.body.appendChild(tempDiv);

    try {
        // Wait a bit for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Import html2pdf dynamically
        const html2pdf = (await import('html2pdf.js')).default;
        
        // Configure html2pdf options
        const opt = {
            margin: [15, 15, 15, 15],
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                width: 800,
                height: tempDiv.scrollHeight,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };

        // Generate PDF as blob
        const pdfBlob = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
        
        return pdfBlob;
    } finally {
        // Clean up
        document.body.removeChild(tempDiv);
    }
};

// Method 2: Using jsPDF with html2canvas directly
const createPDFWithJsPDF = async (htmlContent: string): Promise<Blob> => {
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '0';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.height = 'auto';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.zIndex = '-9999';
    document.body.appendChild(tempDiv);

    try {
        // Wait a bit for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Import required libraries
        const jsPDF = (await import('jspdf')).default;
        const html2canvas = (await import('html2canvas')).default;

        // Convert HTML to canvas
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            width: 800,
            height: tempDiv.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Add first page
        pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        return pdfBlob;
    } finally {
        // Clean up
        document.body.removeChild(tempDiv);
    }
};

// تابع برای ساخت Gherkin از Feature
export const createGherkinFromFeature = (feature: Feature): string => {
    let gherkin = '';
    gherkin += `# language: fa\n`;
    gherkin += `@feature\n`;
    gherkin += `Feature: ${feature.name}\n`;
    if (feature.description) gherkin += `  ${feature.description}\n`;
    gherkin += '\n';
    
    if (feature.background && feature.background.steps && feature.background.steps.length > 0) {
        gherkin += `  Background:\n`;
        feature.background.steps.forEach(step => {
            gherkin += `    ${step.keyword} ${step.text}\n`;
        });
        gherkin += '\n';
    }
    
    if (feature.rules && feature.rules.length > 0) {
        feature.rules.forEach(rule => {
            gherkin += `  Rule: ${rule.name}\n`;
            if (rule.description) gherkin += `    ${rule.description}\n`;
            gherkin += '\n';
            rule.scenarios.forEach(scenario => {
                gherkin += `    Scenario: ${scenario.name}\n`;
                if (scenario.description) gherkin += `      ${scenario.description}\n`;
                scenario.steps.forEach(step => {
                    gherkin += `      ${step.keyword} ${step.text}\n`;
                });
                gherkin += '\n';
            });
        });
    }
    
    if (feature.scenarios && feature.scenarios.length > 0) {
        feature.scenarios.forEach(scenario => {
            gherkin += `  Scenario: ${scenario.name}\n`;
            if (scenario.description) gherkin += `    ${scenario.description}\n`;
            scenario.steps.forEach(step => {
                gherkin += `    ${step.keyword} ${step.text}\n`;
            });
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