import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const superuserEmails = (process.env.SUPERUSER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!superuserEmails.includes(email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const user = await prisma.user.update({
    where: { email },
    data: { isSuper: true },
  });
  return NextResponse.json({ success: true, user });
} 