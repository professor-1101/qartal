import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        // Verify project belongs to user
        const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        const { features, movedFeatureId, oldPosition, newPosition } = await request.json();
        if (!Array.isArray(features)) {
            return NextResponse.json({ error: "Invalid features array" }, { status: 400 });
        }
        
        // Get the moved feature name for logging
        let movedFeatureName = "ویژگی";
        if (movedFeatureId) {
            const movedFeature = await prisma.feature.findUnique({
                where: { id: movedFeatureId, projectId },
                select: { name: true }
            });
            if (movedFeature) {
                movedFeatureName = movedFeature.name;
            }
        }
        
        // Use transaction to update features and project
        await prisma.$transaction(async (tx) => {
            // Update all features in parallel
            await Promise.all(features.map((f: { id: string, order: number }) =>
                tx.feature.update({ where: { id: f.id, projectId }, data: { order: f.order } })
            ));
            
            // Update project's updatedAt
            await tx.project.update({
                where: { id: projectId },
                data: { updatedAt: new Date() }
            });
        });

        // Log feature reorder activity with specific feature information
        await ActivityLogger.logFeatureReordered(
            user.id, 
            projectId, 
            movedFeatureName, 
            oldPosition || 0, 
            newPosition || 0
        );
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering features:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 