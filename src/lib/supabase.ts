import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not found. Running in local-only mode. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud sync.'
    );
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseAnonKey);
};

// Database type definitions for Supabase
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    image: string | null;
                    openai_api_key: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    image?: string | null;
                    openai_api_key?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    image?: string | null;
                    openai_api_key?: string | null;
                    updated_at?: string;
                };
            };
            dreams: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    description?: string | null;
                    created_at?: string;
                };
                Update: {
                    title?: string;
                    description?: string | null;
                };
            };
            goals: {
                Row: {
                    id: string;
                    user_id: string;
                    dream_id: string | null;
                    title: string;
                    specific: string;
                    measurable: string;
                    achievable: string;
                    relevant: string;
                    time_bound: string;
                    status: 'active' | 'completed' | 'paused';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    dream_id?: string | null;
                    title: string;
                    specific: string;
                    measurable: string;
                    achievable: string;
                    relevant: string;
                    time_bound: string;
                    status?: 'active' | 'completed' | 'paused';
                    created_at?: string;
                };
                Update: {
                    dream_id?: string | null;
                    title?: string;
                    specific?: string;
                    measurable?: string;
                    achievable?: string;
                    relevant?: string;
                    time_bound?: string;
                    status?: 'active' | 'completed' | 'paused';
                };
            };
            key_results: {
                Row: {
                    id: string;
                    goal_id: string;
                    title: string;
                    target_value: number;
                    current_value: number;
                    unit: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    goal_id: string;
                    title: string;
                    target_value: number;
                    current_value?: number;
                    unit: string;
                    created_at?: string;
                };
                Update: {
                    title?: string;
                    target_value?: number;
                    current_value?: number;
                    unit?: string;
                };
            };
            habits: {
                Row: {
                    id: string;
                    user_id: string;
                    goal_id: string | null;
                    title: string;
                    label: string;
                    frequency: 'daily' | 'weekly';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    goal_id?: string | null;
                    title: string;
                    label: string;
                    frequency?: 'daily' | 'weekly';
                    created_at?: string;
                };
                Update: {
                    goal_id?: string | null;
                    title?: string;
                    label?: string;
                    frequency?: 'daily' | 'weekly';
                };
            };
            progress_logs: {
                Row: {
                    id: string;
                    habit_id: string;
                    user_id: string;
                    completed_at: string;
                    date: string;
                    notes: string | null;
                };
                Insert: {
                    id?: string;
                    habit_id: string;
                    user_id: string;
                    completed_at?: string;
                    date: string;
                    notes?: string | null;
                };
                Update: {
                    notes?: string | null;
                };
            };
        };
    };
}
