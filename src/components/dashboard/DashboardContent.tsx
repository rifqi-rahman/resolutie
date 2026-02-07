'use client';

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const storedHabits = getStoredHabits();
        const storedGoals = getStoredGoals();
        const storedDreams = getStoredDreams();
        const storedLogs = getStoredProgressLogs();

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
    };

    const toggleHabit = (habitId: string) => {
        const isCompleted = isHabitCompletedForDate(habitId, today);

        if (isCompleted) {
            removeProgressLog(habitId, today);
            addToast('info', 'Habit dibatalkan');
        } else {
            const log: ProgressLog = {
                id: generateId(),
                habitId,
                userId: user.email || 'local',
                completedAt: new Date(),
                date: today,
            };
            addProgressLog(log);
            addToast('success', 'Habit selesai! 🎉');
        }

        loadData(); // Refresh data
    };

    const completedToday = habits.filter(h =>
        isHabitCompletedForDate(h.id, today)
    ).length;

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
                                const isCompleted = isHabitCompletedForDate(habit.id, today);
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
