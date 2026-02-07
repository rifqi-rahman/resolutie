// ============================================
// RESOLUTIE - Cloud Storage with Supabase
// Syncs data to cloud for cross-device access
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Dream, Goal, Habit, ProgressLog } from '@/types';

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

    const { error } = await supabase.from('dreams').upsert({
        id: dream.id,
        user_id: dream.userId,
        title: dream.title,
        description: dream.description || null,
        created_at: dream.createdAt instanceof Date ? dream.createdAt.toISOString() : dream.createdAt,
    });

    if (error) {
        console.error('Error saving dream:', error);
        return false;
    }
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
