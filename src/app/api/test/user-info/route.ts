import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const headerList = headers();
    const userAgent = headerList.get('user-agent');
    const ip = req.ip ?? "Unknown"
    const city = req.geo?.city ?? "Unknown"
    const country = req.geo?.country ?? "Unknown"

    return NextResponse.json({
      message: "User info fetched successfully!",
      userAgent,
      ip,
      city,
      country
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}