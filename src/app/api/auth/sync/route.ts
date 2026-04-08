import { NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sync auth" }, { status: 500 });
  }
}
