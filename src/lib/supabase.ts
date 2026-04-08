import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client - for client-side components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server client - for API routes (reads cookies from request)
export function createServerSupabaseClient(cookies: {
  getAll: () => { name: string; value: string }[]
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookies.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) => {
            // Server-side cookies are set via response headers
          })
        } catch {
          // Called from Server Component
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