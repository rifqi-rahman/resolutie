// ============================================
// RESOLUTIE - Local Storage Utilities
// Provides offline-first data persistence
// ============================================

import { Dream, Goal, Habit, ProgressLog, User, Todo } from '@/types';

const STORAGE_KEYS = {
    USER: 'resolutie_user',
    DREAMS: 'resolutie_dreams',
    GOALS: 'resolutie_goals',
    HABITS: 'resolutie_habits',
    PROGRESS_LOGS: 'resolutie_progress_logs',
    TODOS: 'resolutie_todos',
    SETTINGS: 'resolutie_settings',
    THEME: 'resolutie_theme',
} as const;

// Generic storage utilities
function getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        console.error(`Error reading ${key} from localStorage`);
        return defaultValue;
    }
}

function setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        console.error(`Error writing ${key} to localStorage`);
    }
}

function removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
}

// ============================================
// User Storage
// ============================================

export function getStoredUser(): Partial<User> | null {
    return getItem<Partial<User> | null>(STORAGE_KEYS.USER, null);
}

export function setStoredUser(user: Partial<User>): void {
    setItem(STORAGE_KEYS.USER, user);
}

export function clearStoredUser(): void {
    removeItem(STORAGE_KEYS.USER);
}

// ============================================
// Dreams Storage
// ============================================

export function getStoredDreams(): Dream[] {
    return getItem<Dream[]>(STORAGE_KEYS.DREAMS, []);
}

export function setStoredDreams(dreams: Dream[]): void {
    setItem(STORAGE_KEYS.DREAMS, dreams);
}

export function addStoredDream(dream: Dream): void {
    const dreams = getStoredDreams();
    dreams.push(dream);
    setStoredDreams(dreams);
}

export function updateStoredDream(id: string, updates: Partial<Dream>): void {
    const dreams = getStoredDreams();
    const index = dreams.findIndex(d => d.id === id);
    if (index !== -1) {
        dreams[index] = { ...dreams[index], ...updates };
        setStoredDreams(dreams);
    }
}

export function deleteStoredDream(id: string): void {
    const dreams = getStoredDreams().filter(d => d.id !== id);
    setStoredDreams(dreams);
}

// ============================================
// Goals Storage
// ============================================

export function getStoredGoals(): Goal[] {
    return getItem<Goal[]>(STORAGE_KEYS.GOALS, []);
}

export function setStoredGoals(goals: Goal[]): void {
    setItem(STORAGE_KEYS.GOALS, goals);
}

export function addStoredGoal(goal: Goal): void {
    const goals = getStoredGoals();
    goals.push(goal);
    setStoredGoals(goals);
}

export function updateStoredGoal(id: string, updates: Partial<Goal>): void {
    const goals = getStoredGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
        goals[index] = { ...goals[index], ...updates };
        setStoredGoals(goals);
    }
}

export function deleteStoredGoal(id: string): void {
    const goals = getStoredGoals().filter(g => g.id !== id);
    setStoredGoals(goals);
}

// ============================================
// Habits Storage
// ============================================

export function getStoredHabits(): Habit[] {
    return getItem<Habit[]>(STORAGE_KEYS.HABITS, []);
}

export function setStoredHabits(habits: Habit[]): void {
    setItem(STORAGE_KEYS.HABITS, habits);
}

export function addStoredHabit(habit: Habit): void {
    const habits = getStoredHabits();
    habits.push(habit);
    setStoredHabits(habits);
}

export function updateStoredHabit(id: string, updates: Partial<Habit>): void {
    const habits = getStoredHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
        habits[index] = { ...habits[index], ...updates };
        setStoredHabits(habits);
    }
}

export function deleteStoredHabit(id: string): void {
    const habits = getStoredHabits().filter(h => h.id !== id);
    setStoredHabits(habits);
}

// ============================================
// Progress Logs Storage
// ============================================

export function getStoredProgressLogs(): ProgressLog[] {
    return getItem<ProgressLog[]>(STORAGE_KEYS.PROGRESS_LOGS, []);
}

export function setStoredProgressLogs(logs: ProgressLog[]): void {
    setItem(STORAGE_KEYS.PROGRESS_LOGS, logs);
}

export function addProgressLog(log: ProgressLog): void {
    const logs = getStoredProgressLogs();
    logs.push(log);
    setStoredProgressLogs(logs);
}

export function removeProgressLog(habitId: string, date: string): void {
    const logs = getStoredProgressLogs().filter(
        log => !(log.habitId === habitId && log.date === date)
    );
    setStoredProgressLogs(logs);
}

export function getProgressLogsForDate(date: string): ProgressLog[] {
    return getStoredProgressLogs().filter(log => log.date === date);
}

export function getProgressLogsForHabit(habitId: string): ProgressLog[] {
    return getStoredProgressLogs().filter(log => log.habitId === habitId);
}

export function isHabitCompletedForDate(habitId: string, date: string): boolean {
    return getStoredProgressLogs().some(
        log => log.habitId === habitId && log.date === date
    );
}

// ============================================
// Todos Storage
// ============================================

export function getStoredTodos(): Todo[] {
    return getItem<Todo[]>(STORAGE_KEYS.TODOS, []);
}

export function setStoredTodos(todos: Todo[]): void {
    setItem(STORAGE_KEYS.TODOS, todos);
}

export function addStoredTodo(todo: Todo): void {
    const todos = getStoredTodos();
    todos.push(todo);
    setStoredTodos(todos);
}

export function updateStoredTodo(id: string, updates: Partial<Todo>): void {
    const todos = getStoredTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        todos[index] = { ...todos[index], ...updates };
        setStoredTodos(todos);
    }
}

export function deleteStoredTodo(id: string): void {
    const todos = getStoredTodos().filter(t => t.id !== id);
    setStoredTodos(todos);
}

export function toggleStoredTodoComplete(id: string): void {
    const todos = getStoredTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        todos[index].completed = !todos[index].completed;
        todos[index].completedAt = todos[index].completed ? new Date() : undefined;
        setStoredTodos(todos);
    }
}

// ============================================
// Settings Storage
// ============================================

interface Settings {
    openaiApiKey?: string;
    notificationsEnabled?: boolean;
    reminderTime?: string;
}

export function getStoredSettings(): Settings {
    return getItem<Settings>(STORAGE_KEYS.SETTINGS, {});
}

export function setStoredSettings(settings: Settings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
}

export function updateStoredSettings(updates: Partial<Settings>): void {
    const settings = getStoredSettings();
    setStoredSettings({ ...settings, ...updates });
}

// ============================================
// Theme Storage
// ============================================

export type Theme = 'light' | 'dark' | 'system';

export function getStoredTheme(): Theme {
    return getItem<Theme>(STORAGE_KEYS.THEME, 'system');
}

export function setStoredTheme(theme: Theme): void {
    setItem(STORAGE_KEYS.THEME, theme);
}

// ============================================
// Clear All Data
// ============================================

export function clearAllStoredData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        removeItem(key);
    });
}

// ============================================
// Export/Import Data (for backup)
// ============================================

export interface ExportedData {
    user: Partial<User> | null;
    dreams: Dream[];
    goals: Goal[];
    habits: Habit[];
    progressLogs: ProgressLog[];
    settings: Settings;
    exportedAt: string;
}

export function exportAllData(): ExportedData {
    return {
        user: getStoredUser(),
        dreams: getStoredDreams(),
        goals: getStoredGoals(),
        habits: getStoredHabits(),
        progressLogs: getStoredProgressLogs(),
        settings: getStoredSettings(),
        exportedAt: new Date().toISOString(),
    };
}

export function importAllData(data: ExportedData): void {
    if (data.user) setStoredUser(data.user);
    if (data.dreams) setStoredDreams(data.dreams);
    if (data.goals) setStoredGoals(data.goals);
    if (data.habits) setStoredHabits(data.habits);
    if (data.progressLogs) setStoredProgressLogs(data.progressLogs);
    if (data.settings) setStoredSettings(data.settings);
}
