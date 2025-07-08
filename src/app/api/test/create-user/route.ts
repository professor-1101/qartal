import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "test@example.com" }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "کاربر تست قبلاً وجود دارد", user: existingUser },
        { status: 200 }
      );
    }

    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 12);
    
    const user = await prisma.user.create({
      data: {
        name: "کاربر تست",
        email: "test@example.com",
        password: hashedPassword,
      } as any,
    });

    const { password: _, ...userWithoutPassword } = user as any;

    return NextResponse.json(
      { 
        message: "کاربر تست با موفقیت ایجاد شد",
        user: userWithoutPassword,
        credentials: {
          email: "test@example.com",
          password: "password123"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "خطا در ایجاد کاربر تست" },
      { status: 500 }
    );
  }
} 