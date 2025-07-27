'use client';

import { ActivityHistory } from "@/components/activities/activity-history";
import { useI18n } from "@/i18n";

export function ActivityPageClient() {
    const { t } = useI18n();

    // Debug: Log the translation function
    console.log('Translation test:', t('activities.pageTitle'));
    console.log('Translation test 2:', t('activities.pageDescription'));

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('activities.pageTitle')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('activities.pageDescription')}
                    </p>
                </div>
            </div>
            
            <ActivityHistory 
                title={t('activities.fullHistoryTitle')}
                className="w-full"
            />
        </div>
    );
} 