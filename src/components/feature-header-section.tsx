// src/components/feature-header-section.tsx
"use client";

import { useState, useEffect } from 'react';
import { Feature } from '@/types/gherkin'; // Ensure this path is correct
import { Textarea } from '@/components/ui/textarea'; // Assuming these are available
import { Input } from '@/components/ui/input';

interface FeatureHeaderSectionProps {
    feature: Feature;
    onFeatureChange: (updatedFeature: Feature) => void;
}

export function FeatureHeaderSection({ feature, onFeatureChange }: FeatureHeaderSectionProps) {
    const [name, setName] = useState(feature.name);
    const [description, setDescription] = useState(feature.description || '');
    const [tags, setTags] = useState(feature.tags ? feature.tags.join(' ') : '');

    // Synchronize internal state with external prop changes
    useEffect(() => {
        setName(feature.name);
        setDescription(feature.description || '');
        setTags(feature.tags ? feature.tags.join(' ') : '');
    }, [feature]);

    // Function to safely parse tags string into an array
    const parseTagsString = (tagsString: string): string[] => {
        // Split by space, filter out empty strings, and ensure each tag starts with '@'
        return tagsString.split(' ').filter(tag => tag.length > 0 && tag.startsWith('@'));
    };

    // Helper to call onFeatureChange with the complete, updated feature object
    const updateFeature = (updatedFields: Partial<Feature>) => {
        // CRUCIAL: Spread the existing 'feature' prop to ensure all original properties (like id, scenarios) are retained.
        // Then, merge with the internal state and any specific updated fields.
        onFeatureChange({
            ...feature, // Retain all other existing feature properties
            name: name, // Use current internal state for name
            description: description, // Use current internal state for description
            tags: parseTagsString(tags), // Use current internal state for tags
            ...updatedFields // Apply any specific updates from the current change handler
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        updateFeature({ name: newName });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newDescription = e.target.value;
        setDescription(newDescription);
        updateFeature({ description: newDescription });
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTags = e.target.value;
        setTags(newTags);
        updateFeature({ tags: parseTagsString(newTags) });
    };

    return (
        <div className="space-y-3">
            <div>
                <label htmlFor="feature-name" className="block text-sm font-medium text-gray-700 mb-1">
                    نام ویژگی
                </label>
                <Input
                    id="feature-name"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={handleNameChange} // Update on blur to propagate changes
                    className="w-full"
                    aria-label="Feature Name"
                />
            </div>
            <div>
                <label htmlFor="feature-description" className="block text-sm font-medium text-gray-700 mb-1">
                    توضیحات
                </label>
                <Textarea
                    id="feature-description"
                    value={description}
                    onChange={handleDescriptionChange}
                    onBlur={handleDescriptionChange} // Update on blur to propagate changes
                    placeholder="توضیح ویژگی را وارد کنید (اختیاری)"
                    rows={4}
                    className="w-full"
                    aria-label="توضیحات ویژگی"
                />
            </div>
            <div>
                <label htmlFor="feature-tags" className="block text-sm font-medium text-gray-700 mb-1">
                    برچسب‌ها (مثلاً: @smoke @regression)
                </label>
                <Input
                    id="feature-tags"
                    value={tags}
                    onChange={handleTagsChange}
                    onBlur={handleTagsChange} // Update on blur to propagate changes
                    placeholder="برچسب‌ها را با فاصله وارد کنید (مثلاً: @tag1 @tag2)"
                    className="w-full"
                    aria-label="برچسب‌های ویژگی"
                />
            </div>
        </div>
    );
}
