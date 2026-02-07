'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getStoredHabits,
    getStoredGoals,
    getStoredDreams,
    getStoredProgressLogs,
    isHabitCompletedForDate,
    addProgressLog,
    removeProgressLog
} from '@/lib/storage';
import {
    fetchHabitsFromCloud,
    fetchGoalsFromCloud,
    fetchDreamsFromCloud,
    fetchProgressLogsFromCloud,
    saveProgressLogToCloud,
    deleteProgressLogFromCloud
} from '@/lib/cloudStorage';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
    getToday,
    formatDateDisplay,
    calculateStreak,
    formatStreakMessage,
    generateId
} from '@/lib/utils';
import { useToast } from '@/components/providers';
import { Habit, Goal, Dream, ProgressLog } from '@/types';
import styles from './DashboardContent.module.css';

interface DashboardContentProps {
    user: {
        name?: string | null;
        email?: string | null;
    };
}

export default function DashboardContent({ user }: DashboardContentProps) {
    const { addToast } = useToast();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const today = getToday();

    // Use email as userId for consistent identification across devices
    const userId = user.email || 'local';
    const useCloud = isSupabaseConfigured() && !!user.email;

    const loadData = useCallback(async () => {
        try {
            let storedHabits: Habit[];
            let storedGoals: Goal[];
            let storedDreams: Dream[];
            let storedLogs: ProgressLog[];

            if (useCloud) {
                console.log('[Dashboard] Loading from cloud for user:', userId);
                [storedHabits, storedGoals, storedDreams, storedLogs] = await Promise.all([
                    fetchHabitsFromCloud(userId),
                    fetchGoalsFromCloud(userId),
                    fetchDreamsFromCloud(userId),
                    fetchProgressLogsFromCloud(userId)
                ]);
                console.log('[Dashboard] Loaded:', storedHabits.length, 'habits,', storedGoals.length, 'goals,', storedDreams.length, 'dreams');
            } else {
                storedHabits = getStoredHabits();
                storedGoals = getStoredGoals();
                storedDreams = getStoredDreams();
                storedLogs = getStoredProgressLogs();
            }

            setHabits(storedHabits);
            setGoals(storedGoals);
            setDreams(storedDreams);
            setProgressLogs(storedLogs);

            // Calculate streak
            if (storedHabits.length > 0) {
                const habitIds = storedHabits.map(h => h.id);
                const streak = calculateStreak(storedLogs, habitIds);
                setCurrentStreak(streak.currentStreak);
                setLongestStreak(streak.longestStreak);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Fallback to localStorage
            setHabits(getStoredHabits());
            setGoals(getStoredGoals());
            setDreams(getStoredDreams());
            setProgressLogs(getStoredProgressLogs());
        }
    }, [useCloud, userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const isHabitCompleted = (habitId: string) => {
        if (useCloud) {
            return progressLogs.some(log => log.habitId === habitId && log.date === today);
        }
        return isHabitCompletedForDate(habitId, today);
    };

    const toggleHabit = async (habitId: string) => {
        const isCompleted = isHabitCompleted(habitId);

        try {
            if (isCompleted) {
                if (useCloud) {
                    await deleteProgressLogFromCloud(habitId, today);
                }
                removeProgressLog(habitId, today);
                addToast('info', 'Habit dibatalkan');
            } else {
                const log: ProgressLog = {
                    id: generateId(),
                    habitId,
                    userId: userId,
                    completedAt: new Date(),
                    date: today,
                };
                if (useCloud) {
                    await saveProgressLogToCloud(log);
                }
                addProgressLog(log);
                addToast('success', 'Habit selesai! 🎉');
            }
            await loadData(); // Refresh data
        } catch (error) {
            console.error('Error toggling habit:', error);
            addToast('error', 'Gagal mengubah status habit');
        }
    };

    const completedToday = habits.filter(h => isHabitCompleted(h.id)).length;

    const completionPercentage = habits.length > 0
        ? Math.round((completedToday / habits.length) * 100)
        : 0;


    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1>Selamat datang, {user.name?.split(' ')[0] || 'User'}! 👋</h1>
                    <p className={styles.date}>{formatDateDisplay(new Date())}</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={`neo-card ${styles.statCard} ${styles.streakCard}`}>
                    <div className={styles.statIcon}>🔥</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{currentStreak}</span>
                        <span className={styles.statLabel}>Hari Streak</span>
                    </div>
                    <p className={styles.streakMessage}>{formatStreakMessage(currentStreak)}</p>
                </div>

                <div className={`neo-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{completedToday}/{habits.length}</span>
                        <span className={styles.statLabel}>Habits Hari Ini</span>
                    </div>
                    <div className="neo-progress" style={{ marginTop: 'var(--space-sm)' }}>
                        <div
                            className="neo-progress-bar"
                            style={{ width: `${completionPercentage}%` }}
                        >
                            {completionPercentage}%
                        </div>
                    </div>
                </div>

                <div className={`neo-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>🎯</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{goals.filter(g => g.status === 'active').length}</span>
                        <span className={styles.statLabel}>Goals Aktif</span>
                    </div>
                </div>

                <div className={`neo-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>💭</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{dreams.length}</span>
                        <span className={styles.statLabel}>Dreams</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainGrid}>
                {/* Today's Habits */}
                <section className={styles.habitsSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Habits Hari Ini</h2>
                        <a href="/dashboard/habits" className="neo-btn neo-btn-sm neo-btn-secondary">
                            Lihat Semua
                        </a>
                    </div>

                    {habits.length === 0 ? (
                        <div className={`neo-card ${styles.emptyState}`}>
                            <div className={styles.emptyIcon}>📋</div>
                            <h3>Belum ada habits</h3>
                            <p>Mulai dengan menambahkan habits harian.</p>
                            <a href="/dashboard/habits" className="neo-btn neo-btn-primary mt-md">
                                Tambah Habit
                            </a>
                        </div>
                    ) : (
                        <div className={styles.habitsList}>
                            {habits.map(habit => {
                                const isCompleted = isHabitCompleted(habit.id);
                                return (
                                    <div
                                        key={habit.id}
                                        className={`neo-card-flat ${styles.habitItem} ${isCompleted ? styles.completed : ''}`}
                                        onClick={() => toggleHabit(habit.id)}
                                    >
                                        <label className="neo-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={isCompleted}
                                                onChange={() => { }}
                                            />
                                        </label>
                                        <div className={styles.habitInfo}>
                                            <span className={styles.habitTitle}>{habit.title}</span>
                                            <span className={`neo-badge ${styles.habitLabel}`}>{habit.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Quick Actions & Goals */}
                <aside className={styles.sidebar}>
                    {/* Quick Actions */}
                    <section className={styles.quickActions}>
                        <h3>Quick Actions</h3>
                        <div className={styles.actionButtons}>
                            <a href="/dashboard/dreams" className="neo-btn neo-btn-primary">
                                ✨ Tambah Dream
                            </a>
                            <a href="/dashboard/goals" className="neo-btn neo-btn-secondary">
                                🎯 Tambah Goal
                            </a>
                            <a href="/dashboard/habits" className="neo-btn neo-btn-secondary">
                                ✅ Tambah Habit
                            </a>
                        </div>
                    </section>

                    {/* Active Goals */}
                    <section className={styles.goalsSection}>
                        <h3>Goals Aktif</h3>
                        {goals.filter(g => g.status === 'active').length === 0 ? (
                            <p className={styles.emptyText}>Belum ada goals aktif.</p>
                        ) : (
                            <div className={styles.goalsList}>
                                {goals.filter(g => g.status === 'active').slice(0, 3).map(goal => (
                                    <div key={goal.id} className={`neo-card-flat ${styles.goalItem}`}>
                                        <h4>{goal.title}</h4>
                                        <p className={styles.goalDeadline}>
                                            Deadline: {new Date(goal.timeBound).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Longest Streak */}
                    <section className={`neo-card ${styles.recordCard}`}>
                        <h3>🏆 Streak Terpanjang</h3>
                        <div className={styles.recordValue}>{longestStreak} hari</div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
