// ============================================
// RESOLUTIE - Cloud Storage with Supabase
// Syncs data to cloud for cross-device access
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Dream, Goal, Habit, ProgressLog, Todo } from '@/types';

// ============================================
// Dreams - Cloud Storage
// ============================================

export async function fetchDreamsFromCloud(userId: string): Promise<Dream[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching dreams:', error);
        return [];
    }

    return data.map(d => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        description: d.description || undefined,
        createdAt: new Date(d.created_at),
    }));
}

export async function saveDreamToCloud(dream: Dream): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const payload = {
        id: dream.id,
        user_id: dream.userId,
        title: dream.title,
        description: dream.description || null,
        created_at: dream.createdAt instanceof Date ? dream.createdAt.toISOString() : dream.createdAt,
    };

    console.log('[saveDreamToCloud] Sending payload:', JSON.stringify(payload, null, 2));

    const { data, error } = await supabase.from('dreams').upsert(payload).select();

    if (error) {
        console.error('[saveDreamToCloud] Error:', error.message, error.code, error.details, error.hint);
        return false;
    }

    console.log('[saveDreamToCloud] Success! Data:', data);
    return true;
}

export async function deleteDreamFromCloud(id: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('dreams').delete().eq('id', id);

    if (error) {
        console.error('Error deleting dream:', error);
        return false;
    }
    return true;
}

// ============================================
// Goals - Cloud Storage
// ============================================

export async function fetchGoalsFromCloud(userId: string): Promise<Goal[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching goals:', error);
        return [];
    }

    return data.map(g => ({
        id: g.id,
        userId: g.user_id,
        dreamId: g.dream_id || undefined,
        title: g.title,
        specific: g.specific || '',
        measurable: g.measurable || '',
        achievable: g.achievable || '',
        relevant: g.relevant || '',
        timeBound: new Date(g.time_bound),
        status: g.status as 'active' | 'completed' | 'paused',
        createdAt: new Date(g.created_at),
    }));
}

export async function saveGoalToCloud(goal: Goal): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('goals').upsert({
        id: goal.id,
        user_id: goal.userId,
        dream_id: goal.dreamId || null,
        title: goal.title,
        specific: goal.specific || null,
        measurable: goal.measurable || null,
        achievable: goal.achievable || null,
        relevant: goal.relevant || null,
        time_bound: goal.timeBound instanceof Date ? goal.timeBound.toISOString() : goal.timeBound,
        status: goal.status,
        created_at: goal.createdAt instanceof Date ? goal.createdAt.toISOString() : goal.createdAt,
    });

    if (error) {
        console.error('Error saving goal:', error);
        return false;
    }
    return true;
}

export async function updateGoalInCloud(id: string, updates: Partial<Goal>): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.specific !== undefined) updateData.specific = updates.specific;
    if (updates.measurable !== undefined) updateData.measurable = updates.measurable;
    if (updates.achievable !== undefined) updateData.achievable = updates.achievable;
    if (updates.relevant !== undefined) updateData.relevant = updates.relevant;
    if (updates.timeBound !== undefined) {
        updateData.time_bound = updates.timeBound instanceof Date
            ? updates.timeBound.toISOString()
            : updates.timeBound;
    }
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase.from('goals').update(updateData).eq('id', id);

    if (error) {
        console.error('Error updating goal:', error);
        return false;
    }
    return true;
}

export async function deleteGoalFromCloud(id: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('goals').delete().eq('id', id);

    if (error) {
        console.error('Error deleting goal:', error);
        return false;
    }
    return true;
}

// ============================================
// Habits - Cloud Storage
// ============================================

export async function fetchHabitsFromCloud(userId: string): Promise<Habit[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching habits:', error);
        return [];
    }

    return data.map(h => ({
        id: h.id,
        userId: h.user_id,
        goalId: h.goal_id || undefined,
        title: h.title,
        label: h.label,
        frequency: h.frequency as 'daily' | 'weekly',
        createdAt: new Date(h.created_at),
    }));
}

export async function saveHabitToCloud(habit: Habit): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('habits').upsert({
        id: habit.id,
        user_id: habit.userId,
        goal_id: habit.goalId || null,
        title: habit.title,
        label: habit.label,
        frequency: habit.frequency,
        created_at: habit.createdAt instanceof Date ? habit.createdAt.toISOString() : habit.createdAt,
    });

    if (error) {
        console.error('Error saving habit:', error);
        return false;
    }
    return true;
}

export async function deleteHabitFromCloud(id: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('habits').delete().eq('id', id);

    if (error) {
        console.error('Error deleting habit:', error);
        return false;
    }
    return true;
}

// ============================================
// Progress Logs - Cloud Storage
// ============================================

export async function fetchProgressLogsFromCloud(userId: string): Promise<ProgressLog[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Error fetching progress logs:', error);
        return [];
    }

    return data.map(p => ({
        id: p.id,
        habitId: p.habit_id,
        userId: p.user_id,
        completedAt: new Date(p.completed_at),
        date: p.date,
    }));
}

export async function saveProgressLogToCloud(log: ProgressLog): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('progress_logs').upsert({
        id: log.id,
        habit_id: log.habitId,
        user_id: log.userId,
        date: log.date,
        completed_at: log.completedAt instanceof Date ? log.completedAt.toISOString() : log.completedAt,
    });

    if (error) {
        console.error('Error saving progress log:', error);
        return false;
    }
    return true;
}

export async function deleteProgressLogFromCloud(habitId: string, date: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('progress_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', date);

    if (error) {
        console.error('Error deleting progress log:', error);
        return false;
    }
    return true;
}

// ============================================
// Sync Helper - Transfer localStorage to Cloud
// ============================================

export async function syncLocalToCloud(
    userId: string,
    localDreams: Dream[],
    localGoals: Goal[],
    localHabits: Habit[],
    localProgressLogs: ProgressLog[]
): Promise<{ success: boolean; synced: number }> {
    if (!supabase || !isSupabaseConfigured()) {
        return { success: false, synced: 0 };
    }

    let synced = 0;

    // Sync dreams
    for (const dream of localDreams) {
        const updated = { ...dream, userId };
        if (await saveDreamToCloud(updated)) synced++;
    }

    // Sync goals
    for (const goal of localGoals) {
        const updated = { ...goal, userId };
        if (await saveGoalToCloud(updated)) synced++;
    }

    // Sync habits
    for (const habit of localHabits) {
        const updated = { ...habit, userId };
        if (await saveHabitToCloud(updated)) synced++;
    }

    // Sync progress logs
    for (const log of localProgressLogs) {
        const updated = { ...log, userId };
        if (await saveProgressLogToCloud(updated)) synced++;
    }

    return { success: true, synced };
}

// ============================================
// Todos - Cloud Storage
// ============================================

export async function fetchTodosFromCloud(userId: string): Promise<Todo[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching todos:', error);
        return [];
    }

    return data.map(t => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description || undefined,
        priority: t.priority || 'medium',
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
        completed: t.completed || false,
        completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
        createdAt: new Date(t.created_at),
    }));
}

export async function saveTodoToCloud(todo: Todo): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const payload = {
        id: todo.id,
        user_id: todo.userId,
        title: todo.title,
        description: todo.description || null,
        priority: todo.priority || 'medium',
        due_date: todo.dueDate instanceof Date ? todo.dueDate.toISOString().split('T')[0] : todo.dueDate || null,
        completed: todo.completed || false,
        completed_at: todo.completedAt instanceof Date ? todo.completedAt.toISOString() : todo.completedAt || null,
        created_at: todo.createdAt instanceof Date ? todo.createdAt.toISOString() : todo.createdAt,
    };

    const { error } = await supabase.from('todos').upsert(payload);

    if (error) {
        console.error('Error saving todo:', error.message, error.code);
        return false;
    }
    return true;
}

export async function deleteTodoFromCloud(id: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting todo:', error);
        return false;
    }
    return true;
}

// ============================================
// User Tracking - Cloud Storage
// ============================================

export interface TrackedUser {
    email: string;
    name: string | null;
    image: string | null;
    first_login: string;
    last_login: string;
    login_count: number;
}

export async function trackUserLogin(user: {
    email: string;
    name?: string | null;
    image?: string | null;
}): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured() || !user.email) return false;

    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (existingUser) {
            // Update existing user
            const { error } = await supabase
                .from('users')
                .update({
                    name: user.name || existingUser.name,
                    image: user.image || existingUser.image,
                    last_login: new Date().toISOString(),
                    login_count: (existingUser.login_count || 0) + 1,
                })
                .eq('email', user.email);

            if (error) {
                console.error('Error updating user:', error);
                return false;
            }
        } else {
            // Insert new user
            const { error } = await supabase
                .from('users')
                .insert({
                    email: user.email,
                    name: user.name || null,
                    image: user.image || null,
                    first_login: new Date().toISOString(),
                    last_login: new Date().toISOString(),
                    login_count: 1,
                });

            if (error) {
                console.error('Error inserting user:', error);
                return false;
            }
        }

        console.log('[trackUserLogin] User tracked:', user.email);
        return true;
    } catch (error) {
        console.error('Error tracking user:', error);
        return false;
    }
}

export async function fetchAllUsers(): Promise<TrackedUser[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_login', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data || [];
}

export async function getUserCount(): Promise<number> {
    if (!supabase || !isSupabaseConfigured()) return 0;

    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting users:', error);
        return 0;
    }

    return count || 0;
}
