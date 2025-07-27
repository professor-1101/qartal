'use client';

import { ActivityHistory } from "@/components/activities/activity-history";
import { useI18n } from "@/i18n";

export function ActivityPageClient() {
    const { t } = useI18n();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">تاریخچه فعالیت‌ها</h1>
                    <p className="text-muted-foreground mt-2">
                        تمام فعالیت‌های شما در سیستم
                    </p>
                </div>
            </div>
            
            <ActivityHistory 
                title="تاریخچه کامل فعالیت‌ها"
                className="w-full"
            />
        </div>
    );
} 