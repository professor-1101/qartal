'use client';

import { ActivityHistory } from "@/components/activities/activity-history";
import DashboardPageHeader from "@/components/layout/DashboardPageHeader";
// import { useI18n } from "@/i18n";

export function ActivityPageClient() {
    // const { t } = useI18n();

  return (
    <div className="container-fluid " dir="rtl">
            <DashboardPageHeader
                title="فعالیت‌های من"
                description="فعالیت‌های انجام شده توسط شما"
            />
            
            <ActivityHistory 
                title="تاریخچه کامل فعالیت‌ها"
                className="w-full"
            />
        </div>
    );
} 