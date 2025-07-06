import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

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
        const { features } = await request.json();
        if (!Array.isArray(features)) {
            return NextResponse.json({ error: "Invalid features array" }, { status: 400 });
        }
        // Update all features in parallel
        await Promise.all(features.map((f: { id: string, order: number }) =>
            prisma.feature.update({ where: { id: f.id, projectId }, data: { order: f.order } })
        ));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering features:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 