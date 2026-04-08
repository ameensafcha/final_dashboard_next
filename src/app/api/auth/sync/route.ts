import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // This endpoint just returns a response
    // The middleware will intercept and set cookies from the browser's session
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync auth' },
      { status: 500 }
    );
  }
}
