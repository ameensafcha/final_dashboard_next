import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client - for client-side components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server client - for API routes (reads cookies from request)
export function createServerSupabaseClient(cookieHandlers: {
  getAll: () => { name: string; value: string }[]
  setAll?: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => void
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieHandlers.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookieHandlers.setAll?.(cookiesToSet)
        } catch {
          // Called from Server Component where cookies are read-only
        }
      },
    },
  })
}

// Admin client - for creating users (service role)
let supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdmin
}
