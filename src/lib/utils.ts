// ============================================
// RESOLUTIE - Utility Functions
// ============================================

import { ProgressLog, StreakData, HourlyActivity, DailyProgress } from '@/types';

// ============================================
// ID Generation
// ============================================

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Date Utilities
// ============================================

export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function formatDateDisplay(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getToday(): string {
    return formatDate(new Date());
}

export function getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
}

export function getDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return formatDate(d);
}

export function getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isToday(date: string): boolean {
    return date === getToday();
}

export function isYesterday(date: string): boolean {
    return date === getYesterday();
}

export function getWeekDates(offset: number = 0): string[] {
    const dates: string[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (offset * 7));

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        dates.push(formatDate(d));
    }

    return dates;
}

export function getMonthDates(year: number, month: number): string[] {
    const dates: string[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        dates.push(formatDate(new Date(year, month, day)));
    }

    return dates;
}

// ============================================
// Streak Calculation
// ============================================

export function calculateStreak(progressLogs: ProgressLog[], habitIds: string[]): StreakData {
    if (progressLogs.length === 0 || habitIds.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Get unique dates where ALL habits were completed
    const dateCompletions = new Map<string, Set<string>>();

    progressLogs.forEach(log => {
        if (habitIds.includes(log.habitId)) {
            if (!dateCompletions.has(log.date)) {
                dateCompletions.set(log.date, new Set());
            }
            dateCompletions.get(log.date)!.add(log.habitId);
        }
    });

    // Filter dates where all habits were completed
    const completedDates = Array.from(dateCompletions.entries())
        .filter(([, habits]) => habits.size === habitIds.length)
        .map(([date]) => date)
        .sort((a, b) => b.localeCompare(a)); // Sort descending

    if (completedDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    const lastCompletedDate = completedDates[0];
    const today = getToday();
    const yesterday = getYesterday();

    // Check if streak is still active (completed today or yesterday)
    const isStreakActive = lastCompletedDate === today || lastCompletedDate === yesterday;

    // Calculate current streak
    let currentStreak = 0;
    if (isStreakActive) {
        let checkDate = lastCompletedDate;
        for (const date of completedDates) {
            if (date === checkDate) {
                currentStreak++;
                const d = new Date(checkDate);
                d.setDate(d.getDate() - 1);
                checkDate = formatDate(d);
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    // Sort ascending for longest streak calculation
    const sortedDates = [...completedDates].sort();

    for (const date of sortedDates) {
        if (prevDate === null) {
            tempStreak = 1;
        } else {
            const daysDiff = getDaysBetween(prevDate, date);
            if (daysDiff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        prevDate = date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
        currentStreak,
        longestStreak,
        lastCompletedDate,
    };
}

// ============================================
// Analytics Utilities
// ============================================

export function calculateHourlyActivity(progressLogs: ProgressLog[]): HourlyActivity[] {
    const hourCounts = new Array(24).fill(0);

    progressLogs.forEach(log => {
        const hour = new Date(log.completedAt).getHours();
        hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({ hour, count }));
}

export function calculateDailyProgress(
    dates: string[],
    habits: { id: string }[],
    progressLogs: ProgressLog[]
): DailyProgress[] {
    return dates.map(date => {
        const logsForDate = progressLogs.filter(log => log.date === date);
        const completed = new Set(logsForDate.map(log => log.habitId)).size;
        const total = habits.length;

        return {
            date,
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    });
}

export function calculateConsistencyScore(
    progressLogs: ProgressLog[],
    habits: { id: string }[],
    days: number = 30
): number {
    if (habits.length === 0) return 0;

    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
        dates.push(getDaysAgo(i));
    }

    const dailyProgress = calculateDailyProgress(dates, habits, progressLogs);
    const avgCompletion = dailyProgress.reduce((sum, d) => sum + d.percentage, 0) / days;

    return Math.round(avgCompletion);
}

export function getPeakActivityHour(progressLogs: ProgressLog[]): number | null {
    const hourlyActivity = calculateHourlyActivity(progressLogs);
    const maxActivity = Math.max(...hourlyActivity.map(h => h.count));

    if (maxActivity === 0) return null;

    const peakHour = hourlyActivity.find(h => h.count === maxActivity);
    return peakHour?.hour ?? null;
}

// ============================================
// Formatting Utilities
// ============================================

export function formatStreakMessage(streak: number): string {
    if (streak === 0) return 'Mulai streak hari ini!';
    if (streak === 1) return '1 hari berturut-turut 🔥';
    if (streak < 7) return `${streak} hari berturut-turut 🔥`;
    if (streak < 30) return `${streak} hari! Luar biasa! 🔥🔥`;
    if (streak < 100) return `${streak} hari! Kamu hebat! 🔥🔥🔥`;
    return `${streak} hari! LEGENDARIS! 🔥🔥🔥🔥`;
}

export function formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
}

export function formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
}

// ============================================
// Validation Utilities
// ============================================

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isValidApiKey(key: string): boolean {
    // OpenAI API keys start with "sk-" and are typically 51 characters
    return key.startsWith('sk-') && key.length >= 40;
}

// ============================================
// Class Name Utility
// ============================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}
