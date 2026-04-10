import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Lightweight health check endpoint for connection status monitoring.
 * Used by useRealtimeConnectionStatus hook to detect network connectivity.
 */
export async function HEAD(): Promise<NextResponse> {
  return NextResponse.json({ ok: true });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true });
}
