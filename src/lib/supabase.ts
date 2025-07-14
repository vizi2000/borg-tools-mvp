import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          github_id: number
          github_username: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          company: string | null
          blog: string | null
          github_profile_url: string | null
          created_at: string
          updated_at: string
          last_login_at: string
        }
        Insert: {
          id?: string
          github_id: number
          github_username: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          company?: string | null
          blog?: string | null
          github_profile_url?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string
        }
        Update: {
          id?: string
          github_id?: number
          github_username?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          company?: string | null
          blog?: string | null
          github_profile_url?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string
        }
      }
      cv_generations: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          pdf_url: string | null
          github_data: Record<string, any> | null
          linkedin_data: Record<string, any> | null
          ai_summary: Record<string, any> | null
          metadata: Record<string, any> | null
          created_at: string
          updated_at: string
          completed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          pdf_url?: string | null
          github_data?: Record<string, any> | null
          linkedin_data?: Record<string, any> | null
          ai_summary?: Record<string, any> | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          pdf_url?: string | null
          github_data?: Record<string, any> | null
          linkedin_data?: Record<string, any> | null
          ai_summary?: Record<string, any> | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          expires_at?: string | null
        }
      }
    }
  }
}