import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { redirect } from "next/navigation";
import { ActivityHistory } from "@/components/activities/activity-history";

export default async function ActivitiesPage() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        redirect('/sign-in');
    }

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