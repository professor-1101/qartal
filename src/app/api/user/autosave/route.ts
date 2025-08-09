import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { autoSave } = await request.json();

        if (typeof autoSave !== 'boolean') {
            return NextResponse.json(
                { error: "autoSave must be a boolean" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { autoSave },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                autoSave: true,
            }
        });

        return NextResponse.json({
            message: "Auto-save preference updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating auto-save preference:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}