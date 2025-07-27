import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete all activities with old reorder format
        const deletedCount = await prisma.activity.deleteMany({
            where: {
                description: {
                    contains: "ترتیب"
                }
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `${deletedCount.count} فعالیت قدیمی حذف شد`,
            deletedCount: deletedCount.count 
        });
    } catch (error) {
        console.error("Error clearing old activities:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 