import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    const updatedUsers = [];
    
    for (const user of users) {
      // If user has name but no firstName, split the name
      if ((user as any).name && !(user as any).firstName) {
        const nameParts = (user as any).name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName
          }
        });
        
        updatedUsers.push({
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: (updatedUser as any).firstName,
          lastName: (updatedUser as any).lastName
        });
      } else {
        updatedUsers.push({
          id: user.id,
          email: user.email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName
        });
      }
    }

    return NextResponse.json({
      message: "Users updated successfully",
      users: updatedUsers
    });

  } catch (error) {
    console.error("Update users error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 