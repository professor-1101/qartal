import React from "react";
import { Feature } from "@/types/gherkin";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useState } from "react";
import { gherkinBusinessLogic } from "@/lib/gherkin-business-logic";

// Helper: get visible string length (ignores HTML tags)
function getStringWidth(str: string) {
  // Remove HTML tags if any
  const clean = str.replace(/<[^>]*>/g, "");
  return clean.length; // Monospace font: all chars equal width
}

// Highlight keywords in Persian, unified style
function highlightKeyword(word: string) {
  switch (word) {
    case 'فرض': return <span className="bg-purple-50 text-purple-700 border border-purple-200 rounded px-1 font-semibold">فرض</span>;
    case 'وقتی': return <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-1 font-semibold">وقتی</span>;
    case 'آنگاه': return <span className="bg-green-50 text-green-700 border border-green-200 rounded px-1 font-semibold">آنگاه</span>;
    case 'و': return <span className="bg-gray-50 text-gray-700 border border-gray-200 rounded px-1 font-semibold">و</span>;
    case 'اما': return <span className="bg-red-50 text-red-700 border border-red-200 rounded px-1 font-semibold">اما</span>;
    default: return <span>{word}</span>;
  }
}

// Helper to pad cell to the right for perfect | alignment
const padCellRight = (str: string, width: number) => {
  const strWidth = getStringWidth(str);
  return str + ' '.repeat(Math.max(0, width - strWidth));
};

// Render a Gherkin table with aligned columns
function renderTable(headers: string[], rows: string[][]) {
  const table = [headers, ...rows];
  const colCount = headers.length;
  const colWidths = Array(colCount).fill(0);
  
  // Calculate max width for each column
  table.forEach(row => {
    row.forEach((cell, i) => {
      colWidths[i] = Math.max(colWidths[i], getStringWidth(cell));
    });
  });
  
  return (
    <pre className="bg-white border border-gray-200 rounded p-3 my-2 overflow-x-auto text-xs" style={{ 
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      direction: 'ltr',
      textAlign: 'left',
      unicodeBidi: 'plaintext'
    }}>
      {table.map((row, rIdx) => (
        <div key={rIdx} className="whitespace-pre font-mono">
          {'| ' + row.map((cell, cIdx) => {
            const padded = padCellRight(cell, colWidths[cIdx]);
            return `${padded} | `;
          }).join('').slice(0, -1)}
        </div>
      ))}
    </pre>
  );
}

export function GherkinPreview({ feature }: { feature: Feature }) {
  const [copied, setCopied] = useState(false);
  const gherkinText = gherkinBusinessLogic.generateGherkinText(feature);

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(gherkinText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = gherkinText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          // Show error to user
          alert('کپی کردن با خطا مواجه شد. لطفاً متن را دستی کپی کنید.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Copy failed:', error);
      // Show error to user
      alert('کپی کردن با خطا مواجه شد. لطفاً متن را دستی کپی کنید.');
    }
  };

  const handleExport = () => {
    const blob = new Blob([gherkinText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${feature.name || 'feature'}.feature`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // All feature.scenarios are standalone scenarios
  const rules = feature.rules || [];
  const scenarios = feature.scenarios || [];

  return (
    <div className="rounded-lg border border-gray-200 p-0" style={{ background: '#fafafa' }}>
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-2 border-b border-gray-100 bg-[#fafafa] rounded-t-lg">
        <Button variant="ghost" size="sm" onClick={handleCopy} className="text-xs flex items-center gap-1">
          <Copy className="h-4 w-4" /> {copied ? 'کپی شد!' : 'کپی Gherkin'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport} className="text-xs flex items-center gap-1">
          <Download className="h-4 w-4" /> خروجی
        </Button>
      </div>
      <div className="px-6 py-4 text-sm leading-relaxed">
        {/* Feature name */}
        <div className="mb-3">
          <span className="text-gray-900 font-bold text-base">ویژگی:</span> <span className="font-medium">{feature.name}</span>
        </div>
        {/* Feature description */}
        {feature.description && (
          <div className="mb-3 text-gray-600 font-normal">{feature.description}</div>
        )}
        {/* Background */}
        {feature.background && feature.background.steps.length > 0 && (
          <div className="mb-3">
            <span className="text-gray-800 font-bold">پس‌زمینه:</span>
            {feature.background.steps.map((step) => (
              <div key={step.id} className="pl-4 mb-1">
                {highlightKeyword(step.keyword)} <span className="font-normal">{step.text}</span>
                {step.dataTable && renderTable(step.dataTable.headers, step.dataTable.rows.map(r => r.values))}
              </div>
            ))}
          </div>
        )}
        {/* Rules (with their scenarios) */}
        {rules.map(rule => (
          <div key={rule.id} className="mb-4">
            <span className="text-gray-900 font-bold">قانون:</span> <span className="font-medium">{rule.name}</span>
            {rule.description && <div className="text-gray-600 pl-4 font-normal">{rule.description}</div>}
            {(rule.scenarios || []).map(scenario => (
              <div key={scenario.id} className="mb-2 pl-4">
                <span className="text-gray-900 font-bold">{scenario.type === 'scenario-outline' ? 'طرح سناریو:' : 'سناریو:'}</span> <span className="font-medium">{scenario.name}</span>
                {scenario.description && <div className="text-gray-600 pl-4 font-normal">{scenario.description}</div>}
                {scenario.steps.map((step) => (
                  <div key={step.id} className="pl-4 mb-1">
                    {highlightKeyword(step.keyword)} <span className="font-normal">{step.text}</span>
                    {step.dataTable && renderTable(step.dataTable.headers, step.dataTable.rows.map(r => r.values))}
                  </div>
                ))}
                            {scenario.type === 'scenario-outline' && scenario.examples && scenario.examples.rows.length > 0 && (
                  <div className="pl-4 mt-2">
                    <div className="mb-2">
                      <span className="text-gray-800 font-bold">مثال:</span>
                    </div>
                    {renderTable(scenario.examples.headers, scenario.examples.rows.map(r => r.values))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {/* Standalone scenarios */}
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="mb-4">
            <span className="text-gray-900 font-bold">{scenario.type === 'scenario-outline' ? 'طرح سناریو:' : 'سناریو:'}</span> <span className="font-medium">{scenario.name}</span>
            {scenario.description && <div className="text-gray-600 pl-4 font-normal">{scenario.description}</div>}
            {scenario.steps.map((step) => (
              <div key={step.id} className="pl-4 mb-1">
                {highlightKeyword(step.keyword)} <span className="font-normal">{step.text}</span>
                {step.dataTable && renderTable(step.dataTable.headers, step.dataTable.rows.map(r => r.values))}
              </div>
            ))}
            {scenario.type === 'scenario-outline' && scenario.examples && scenario.examples.rows.length > 0 && (
              <div className="pl-4 mt-2">
                <div className="mb-2">
                  <span className="text-gray-800 font-bold">مثال:</span>
                </div>
                {renderTable(scenario.examples.headers, scenario.examples.rows.map(r => r.values))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}