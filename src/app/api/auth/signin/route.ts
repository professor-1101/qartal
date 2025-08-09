import { NextRequest, NextResponse } from 'next/server';

// Handle custom sign-in redirects if needed
export async function GET(request: NextRequest) {
  // Just redirect to the main auth handler
  return NextResponse.redirect(new URL('/api/auth/signin', request.url));
}

export async function POST(request: NextRequest) {
  // Just redirect to the main auth handler
  return NextResponse.redirect(new URL('/api/auth/signin', request.url));
}