"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Feature } from "@/types/gherkin";

interface FeatureHeaderCardProps {
    feature: Feature;
    onFeatureChange: (feature: Feature) => void;
    actions?: React.ReactNode; // Optional slot for external actions
}

export function FeatureHeaderCard({ feature, onFeatureChange, actions }: FeatureHeaderCardProps) {
    return (
        <Card className="w-full shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-semibold text-gray-800">Feature Details</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">Define the core aspects of your Gherkin feature.</CardDescription>
                </div>
                {actions && <div className="flex-shrink-0">{actions}</div>}
            </CardHeader>
            <CardContent className="pt-6 grid gap-5"> {/* Increased gap for better spacing between fields */}
                {/* Feature Name Input */}
                <div>
                    <label htmlFor="feature-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Feature Name
                    </label>
                    <Input
                        id="feature-name"
                        value={feature.name}
                        onChange={e => onFeatureChange({ ...feature, name: e.target.value })}
                        placeholder="مثلاً: ورود امن کاربر"
                        className="text-base h-10 px-3 py-2" // Standard Shadcn Input height and padding
                        aria-label="Feature name input"
                    />
                </div>

                {/* Feature Description Textarea */}
                <div>
                    <label htmlFor="feature-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <Textarea
                        id="feature-description"
                        value={feature.description || ""}
                        onChange={e => onFeatureChange({ ...feature, description: e.target.value })}
                        placeholder="به عنوان یک [نوع کاربر]، می‌خواهم [یک عمل انجام دهم] تا [به یک هدف برسم]."
                        rows={4} // More rows for ample description space
                        className="resize-y text-base px-3 py-2" // Standard Shadcn Textarea padding
                        aria-label="Feature description textarea"
                    />
                </div>

                {/* Feature Tags Input */}
                <div>
                    <label htmlFor="feature-tags" className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma separated)
                    </label>
                    <Input
                        id="feature-tags"
                        value={feature.tags?.join(', ') || ""}
                        onChange={e => onFeatureChange({ ...feature, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                        placeholder="مثلاً: @authentication، @smoke، @regression"
                        className="text-sm h-10 px-3 py-2"
                        aria-label="Feature tags input"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

FeatureHeaderCard.displayName = "FeatureHeaderCard";