import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test simple query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      userCount,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      }
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 