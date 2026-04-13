import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

function getCookies(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map(c => c.trim()).filter(Boolean).reduce((acc, cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name) acc.push({ name, value: rest.join("=") });
    return acc;
  }, [] as { name: string; value: string }[]);
  return cookies;
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient({ getAll: () => getCookies(request) });
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Logout failed" },
      { status: 500 }
    );
  }
}
