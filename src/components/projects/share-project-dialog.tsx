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
import {
    Share2,
    Copy,
    Check,
    ExternalLink,
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

export function ShareProjectDialog({ open, onOpenChange, project}: ShareProjectDialogProps) {
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

    const handleCopyLink = async () => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareLink);
                setCopied(true);
                toast.success("لینک با موفقیت کپی شد!");
                setTimeout(() => setCopied(false), 2000);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = shareLink;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    setCopied(true);
                    toast.success("لینک با موفقیت کپی شد!");
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.error('خطا در کپی کردن:', err);
                    toast.error("خطا در کپی کردن لینک. لطفاً دستی کپی کنید.");
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        } catch (error) {
            console.error('خطا در کپی کردن:', error);
            toast.error("خطا در کپی کردن لینک. لطفاً دستی کپی کنید.");
        }
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
