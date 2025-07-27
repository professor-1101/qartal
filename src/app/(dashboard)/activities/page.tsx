import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { redirect } from "next/navigation";
import { ActivityPageClient } from "./activity-page-client";

export default async function ActivitiesPage() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        redirect('/sign-in');
    }

    return <ActivityPageClient />;
} 