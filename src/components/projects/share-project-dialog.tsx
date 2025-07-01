"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Share2,
    Copy,
    Check,
    ExternalLink,
    Calendar,
    User,
    FileCode,
    GitBranch,
    CheckSquare,
    Eye,
    Clock
} from 'lucide-react';
import { Project, Feature } from '@/types/index';
import { toast } from 'sonner';
import { generateShortCode } from '@/lib/utils';

interface ShareProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    features?: Feature[];
}

export function ShareProjectDialog({ open, onOpenChange, project, features = [] }: ShareProjectDialogProps) {
    const [copied, setCopied] = useState(false);
    const [shareLink, setShareLink] = useState('');

    // Generate share link with dynamic domain
    useEffect(() => {
        if (typeof window !== 'undefined' && project?.id) {
            const protocol = window.location.protocol;
            const host = window.location.host;
            const shortCode = generateShortCode(project.id);
            setShareLink(`${protocol}//${host}/s/${shortCode}`);
        }
    }, [project?.id]);

    // Calculate project statistics
    const projectStats = features.reduce((acc, feature) => {
        const backgroundSteps = feature.background?.steps?.length || 0;
        const scenarioSteps = feature.scenarios?.reduce((scenarioAcc, scenario) =>
            scenarioAcc + (scenario.steps?.length || 0), 0) || 0;
        const totalSteps = backgroundSteps + scenarioSteps;
        const totalScenarios = feature.scenarios?.length || 0;

        return {
            totalSteps: acc.totalSteps + totalSteps,
            totalScenarios: acc.totalScenarios + totalScenarios,
            totalFeatures: acc.totalFeatures + 1
        };
    }, { totalSteps: 0, totalScenarios: 0, totalFeatures: 0 });

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            toast.success("لینک با موفقیت کپی شد!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("خطا در کپی کردن لینک");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getLastModified = () => {
        // در حالت واقعی این مقدار از دیتابیس می‌آید
        return new Date().toISOString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-right">
                        <Share2 className="h-5 w-5" />
                        اشتراک‌گذاری پروژه
                    </DialogTitle>
                    <DialogDescription className="text-right">
                        این لینک را با دیگران به اشتراک بگذارید تا بتوانند پروژه شما را مشاهده کنند
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Share Link Section */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-right block">لینک اشتراک‌گذاری</Label>
                        <div className="flex gap-2">
                            <Input
                                value={shareLink}
                                readOnly
                                className="text-sm font-mono"
                            />
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button
                                onClick={() => window.open(shareLink, '_blank')}
                                variant="outline"
                                size="icon"
                                className="flex-shrink-0"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        بستن
                    </Button>
                    <Button onClick={handleCopyLink}>
                        <Copy className="h-4 w-4 ml-2" />
                        کپی لینک
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
