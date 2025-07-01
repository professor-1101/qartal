import jsPDF from 'jspdf';
import { Feature } from '@/types/gherkin';
import { getGherkinKeywords, isRTL } from './gherkin-keywords';
import "./fonts/Dana-Regular-normal.js";

export interface PDFExportOptions {
  language?: string;
  includeBackground?: boolean;
  includeTags?: boolean;
  includeDescriptions?: boolean;
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
}

export class PDFExportService {
  private defaultOptions: PDFExportOptions = {
    language: 'en',
    includeBackground: true,
    includeTags: true,
    includeDescriptions: true,
    fontSize: 12,
    lineHeight: 1.5,
    margin: 20
  };

  private setDanaFont(pdf: jsPDF) {
    pdf.setFont('Dana-Regular', 'normal');
  }

  async exportFeatureAsPDF(feature: Feature, options: PDFExportOptions = {}): Promise<Blob> {
    const opts = { ...this.defaultOptions, ...options };
    const isRTLText = isRTL(opts.language || 'en');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set RTL support
    if (isRTLText) {
      pdf.setR2L(true);
    }

    this.setDanaFont(pdf);

    const keywords = getGherkinKeywords(opts.language || 'en');
    const margin = opts.margin || 20;
    const fontSize = opts.fontSize || 12;
    const lineHeight = opts.lineHeight || 1.5;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number) => {
      const lines = this.getWrappedLines(text, maxWidth, fontSize);
      lines.forEach((line, index) => {
        pdf.setFontSize(fontSize);
        pdf.text(line, x, y + (index * fontSize * lineHeight), { align: isRTLText ? 'right' : 'left' });
      });
      return lines.length * fontSize * lineHeight;
    };

    // Add title
    pdf.setFontSize(fontSize + 4);
    this.setDanaFont(pdf);
    const title = `${keywords.feature}: ${feature.name}`;
    pdf.text(title, isRTLText ? 210 - margin : margin, yPosition, { align: isRTLText ? 'right' : 'left' });
    yPosition += fontSize * 2;

    // Add description
    if (opts.includeDescriptions && feature.description) {
      pdf.setFontSize(fontSize);
      this.setDanaFont(pdf);
      const descHeight = addWrappedText(
        feature.description,
        margin,
        yPosition,
        170,
        fontSize
      );
      yPosition += descHeight + 10;
    }

    // Add tags
    if (opts.includeTags && feature.tags && feature.tags.length > 0) {
      pdf.setFontSize(fontSize - 2);
      this.setDanaFont(pdf);
      const tagsText = feature.tags.join(' ');
      pdf.text(tagsText, isRTLText ? 210 - margin : margin, yPosition, { align: isRTLText ? 'right' : 'left' });
      yPosition += fontSize + 5;
    }

    // Add background
    if (opts.includeBackground && feature.background && feature.background.steps.length > 0) {
      pdf.setFontSize(fontSize + 2);
      this.setDanaFont(pdf);
      pdf.text(keywords.background, isRTLText ? 210 - margin : margin, yPosition, { align: isRTLText ? 'right' : 'left' });
      yPosition += fontSize * 1.5;

      this.setDanaFont(pdf);
      feature.background.steps.forEach(step => {
        const stepText = `  ${step.keyword} ${step.text}`;
        const stepHeight = addWrappedText(
          stepText,
          margin,
          yPosition,
          160,
          fontSize
        );
        yPosition += stepHeight + 2;
      });
      yPosition += 10;
    }

    // Add scenarios
    feature.scenarios.forEach((scenario, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        this.setDanaFont(pdf);
        yPosition = margin;
      }

      // Scenario tags
      if (opts.includeTags && scenario.tags && scenario.tags.length > 0) {
        pdf.setFontSize(fontSize - 2);
        this.setDanaFont(pdf);
        const scenarioTags = scenario.tags.join(' ');
        pdf.text(scenarioTags, isRTLText ? 210 - margin : margin, yPosition, { align: isRTLText ? 'right' : 'left' });
        yPosition += fontSize + 2;
      }

      // Scenario header
      pdf.setFontSize(fontSize + 2);
      this.setDanaFont(pdf);
      const scenarioType = scenario.type === 'scenario-outline' ? keywords.scenarioOutline : keywords.scenario;
      const scenarioHeader = `  ${scenarioType}: ${scenario.name}`;
      pdf.text(scenarioHeader, isRTLText ? 210 - margin : margin, yPosition, { align: isRTLText ? 'right' : 'left' });
      yPosition += fontSize * 1.5;

      // Scenario description
      if (opts.includeDescriptions && scenario.description) {
        pdf.setFontSize(fontSize);
        this.setDanaFont(pdf);
        const descHeight = addWrappedText(
          scenario.description,
          margin + 10,
          yPosition,
          150,
          fontSize
        );
        yPosition += descHeight + 5;
      }

      // Scenario steps
      pdf.setFontSize(fontSize);
      this.setDanaFont(pdf);
      scenario.steps.forEach(step => {
        const stepText = `    ${step.keyword} ${step.text}`;
        const stepHeight = addWrappedText(
          stepText,
          margin,
          yPosition,
          150,
          fontSize
        );
        yPosition += stepHeight + 2;
      });

      // Examples for scenario outlines
      if (scenario.type === 'scenario-outline' && scenario.examples) {
        yPosition += 5;
        pdf.setFontSize(fontSize);
        this.setDanaFont(pdf);
        pdf.text(`    ${keywords.examples}:`, isRTLText ? 210 - margin : margin, yPosition, { align: isRTLText ? 'right' : 'left' });
        yPosition += fontSize + 5;

        // Examples table
        if (scenario.examples.headers && scenario.examples.rows) {
          const tableData = [scenario.examples.headers, ...scenario.examples.rows.map(row => row.values)];
          this.addTableToPDF(pdf, tableData, margin, yPosition, isRTLText);
          yPosition += (tableData.length + 1) * fontSize * 1.2 + 10;
        }
      }

      yPosition += 10;
    });

    return pdf.output('blob');
  }

  private addTableToPDF(pdf: jsPDF, data: string[][], margin: number, yPosition: number, isRTL: boolean) {
    const fontSize = 10;
    const cellPadding = 5;
    const colWidth = 40;

    pdf.setFontSize(fontSize);
    pdf.setFont('Dana', 'normal');

    data.forEach((row, rowIndex) => {
      let xPosition = margin;
      row.forEach((cell, colIndex) => {
        const cellX = isRTL ? 210 - margin - (colIndex + 1) * colWidth : xPosition;
        const cellY = yPosition + rowIndex * fontSize * 1.2;

        // Draw cell border
        pdf.rect(cellX, cellY - fontSize, colWidth, fontSize * 1.2);

        // Add cell text
        const text = cell.length > 15 ? cell.substring(0, 12) + '...' : cell;
        pdf.text(text, isRTL ? cellX + colWidth - cellPadding : cellX + cellPadding, cellY, { align: isRTL ? 'right' : 'left' });

        xPosition += colWidth;
      });
    });
  }

  private getWrappedLines(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length * (fontSize / 12) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  async exportProjectAsPDF(features: Feature[], options: PDFExportOptions = {}): Promise<Blob> {
    // Accepts an optional projectName in options; the caller should use it for the filename when saving the Blob.
    const opts = { ...this.defaultOptions, ...options };
    const isRTLText = isRTL(opts.language || 'en');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let yPosition = opts.margin || 20;
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (i > 0) {
        pdf.addPage();
        this.setDanaFont(pdf);
        yPosition = opts.margin || 20;
      }
      // Add feature title
      const keywords = getGherkinKeywords(opts.language || 'en');
      pdf.setFontSize((opts.fontSize || 12) + 4);
      this.setDanaFont(pdf);
      const title = `${keywords.feature}: ${feature.name}`;
      pdf.text(title, isRTLText ? 210 - (opts.margin || 20) : (opts.margin || 20), yPosition, { align: isRTLText ? 'right' : 'left' });
      yPosition += (opts.fontSize || 12) * 2;
      // ... (می‌توانی بقیه منطق exportFeatureAsPDF را اینجا هم کپی کنی)
    }
    return pdf.output('blob');
  }
}

export const pdfExportService = new PDFExportService();

// Dana-Regular font must be registered and support full Persian/UTF-8. All text is written as UTF-8. The caller must use the projectName for the PDF filename when saving the Blob.