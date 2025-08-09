import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/config";
import { prisma } from "@/lib/prisma";

// GET /api/user/azure-settings
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        azureApiUrl: true,
        azureTfsUrl: true,
        azureToken: true,
        isSuper: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is super user
    const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
    const isSuper = superUserEmails.includes(session.user.email!) || user.isSuper || false;

    if (!isSuper) {
      return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
    }

    return NextResponse.json({
      apiUrl: user.azureApiUrl || "",
      tfsUrl: user.azureTfsUrl || "",
      token: user.azureToken || ""
    });
  } catch (error) {
    console.error("Error fetching Azure settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/user/azure-settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiUrl, tfsUrl, token } = body;

    // Validate required fields
    if (!apiUrl || !tfsUrl || !token) {
      return NextResponse.json({ 
        error: "همه فیلدها الزامی هستند" 
      }, { status: 400 });
    }

    // Validate URL formats
    try {
      new URL(apiUrl);
      new URL(tfsUrl);
    } catch {
      return NextResponse.json({ 
        error: "فرمت URL صحیح نمی‌باشد" 
      }, { status: 400 });
    }

    // Check if user is super user
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isSuper: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
    const isSuper = superUserEmails.includes(session.user.email!) || existingUser.isSuper || false;

    if (!isSuper) {
      return NextResponse.json({ error: "Access denied. Super user privileges required." }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        azureApiUrl: apiUrl,
        azureTfsUrl: tfsUrl,
        azureToken: token,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: "تنظیمات Azure با موفقیت ذخیره شد",
      apiUrl: user.azureApiUrl,
      tfsUrl: user.azureTfsUrl
      // Note: Don't return token for security
    });
  } catch (error) {
    console.error("Error updating Azure settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
