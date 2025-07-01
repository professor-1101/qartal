"use client";

import React from 'react';
import { Feature } from '@/types/gherkin';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FeaturePreviewPanelProps {
    feature: Feature;
    gherkinText: string;
    historyData: Array<{
        id: string;
        timestamp: string;
        user: string;
        action: string;
        description: string;
    }>;
    activeTab: 'preview' | 'raw';
    onTabChange: (tab: 'preview' | 'raw') => void;
}

export function FeaturePreviewPanel({
    feature,
    gherkinText,
    historyData,
    activeTab,
    onTabChange,
}: FeaturePreviewPanelProps) {

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('در کلیپ‌بورد کپی شد!');
    };

    return (
        <div className="h-full bg-background border rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Preview & Export</h3>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as any)} className="h-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 gap-2">
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Raw
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="h-full mt-0">
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Gherkin Preview</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(gherkinText)}
                                className="h-8 px-3"
                                aria-label="Copy Gherkin text"
                            >
                                <Copy className="h-3 w-3 ml-1" />
                                Copy
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <pre className="text-sm font-mono bg-muted/30 p-4 rounded-md whitespace-pre-wrap border text-muted-foreground">
                                {gherkinText}
                            </pre>
                        </ScrollArea>
                    </div>
                </TabsContent>

                <TabsContent value="raw" className="h-full mt-0">
                    <div className="h-full flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Raw JSON</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(JSON.stringify(feature, null, 2))}
                                className="h-8 px-3"
                                aria-label="Copy JSON"
                            >
                                <Copy className="h-3 w-3 ml-1" />
                                Copy
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <pre className="text-sm font-mono bg-muted/30 p-4 rounded-md whitespace-pre-wrap border text-muted-foreground">
                                {JSON.stringify(feature, null, 2)}
                            </pre>
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

FeaturePreviewPanel.displayName = "FeaturePreviewPanel";