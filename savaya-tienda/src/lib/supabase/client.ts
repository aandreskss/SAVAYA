import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

export function createClient() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
}
