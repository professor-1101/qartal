import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "نام، نام خانوادگی، ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "کاربری با این ایمیل قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Log user registration activity
    await ActivityLogger.log({
      userId: user.id,
      type: 'CREATE',
      action: 'user_registered',
      description: `کاربر ${user.email} ثبت نام کرد`,
      metadata: { userEmail: user.email },
    });

    return NextResponse.json(
      { 
        message: "کاربر با موفقیت ثبت شد",
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "خطا در ثبت‌ نام" },
      { status: 500 }
    );
  }
} 