// ============================================
// RESOLUTIE - Type Definitions
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    openaiApiKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Dream {
    id: string;
    userId: string;
    title: string;
    description?: string;
    createdAt: Date;
    goals?: Goal[];
}

export interface Goal {
    id: string;
    userId: string;
    dreamId?: string;
    title: string;
    // SMART breakdown
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: Date;
    status: GoalStatus;
    createdAt: Date;
    keyResults?: KeyResult[];
    habits?: Habit[];
}

export type GoalStatus = 'active' | 'completed' | 'paused';

export interface KeyResult {
    id: string;
    goalId: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    createdAt: Date;
}

export interface Habit {
    id: string;
    userId: string;
    goalId?: string;
    title: string;
    label: string; // Category label
    frequency: HabitFrequency;
    createdAt: Date;
    progressLogs?: ProgressLog[];
}

export type HabitFrequency = 'daily' | 'weekly';

export interface ProgressLog {
    id: string;
    habitId: string;
    userId: string;
    completedAt: Date;
    date: string; // YYYY-MM-DD format for easy querying
    notes?: string;
}

// ============================================
// Analytics Types
// ============================================

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate?: string;
}

export interface DailyProgress {
    date: string;
    completed: number;
    total: number;
    percentage: number;
}

export interface HourlyActivity {
    hour: number;
    count: number;
}

export interface WeeklyStats {
    week: string;
    completedHabits: number;
    totalHabits: number;
    completionRate: number;
}

export interface MonthlyStats {
    month: string;
    completedHabits: number;
    totalHabits: number;
    completionRate: number;
    streakDays: number;
}

export interface AnalyticsSummary {
    totalHabits: number;
    completedToday: number;
    currentStreak: StreakData;
    weeklyProgress: DailyProgress[];
    monthlyProgress: MonthlyStats[];
    peakHours: HourlyActivity[];
    consistencyScore: number; // 0-100
}

// ============================================
// AI Types
// ============================================

export interface SMARTGoalSuggestion {
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string; // Suggested duration
    suggestedKeyResults: string[];
    suggestedHabits: string[];
}

export interface AIRecommendation {
    type: 'goal' | 'habit' | 'insight';
    title: string;
    description: string;
    actionable?: string;
}

// ============================================
// Form Types
// ============================================

export interface DreamFormData {
    title: string;
    description?: string;
}

export interface GoalFormData {
    dreamId?: string;
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string; // Date string
}

export interface HabitFormData {
    goalId?: string;
    title: string;
    label: string;
    frequency: HabitFrequency;
}

export interface KeyResultFormData {
    goalId: string;
    title: string;
    targetValue: number;
    unit: string;
}

// ============================================
// UI State Types
// ============================================

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

export interface ModalState {
    isOpen: boolean;
    type?: 'dream' | 'goal' | 'habit' | 'keyResult' | 'settings' | 'confirm';
    data?: unknown;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
