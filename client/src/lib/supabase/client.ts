import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file contains:\n' +
      'VITE_SUPABASE_URL=your-project-url\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
