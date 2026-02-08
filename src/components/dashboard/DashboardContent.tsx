'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getStoredHabits,
    getStoredGoals,
    getStoredDreams,
    getStoredProgressLogs,
    getStoredTodos,
    isHabitCompletedForDate,
    addProgressLog,
    removeProgressLog,
    updateStoredTodo
} from '@/lib/storage';
import {
    fetchHabitsFromCloud,
    fetchGoalsFromCloud,
    fetchDreamsFromCloud,
    fetchProgressLogsFromCloud,
    fetchTodosFromCloud,
    saveProgressLogToCloud,
    deleteProgressLogFromCloud,
    saveTodoToCloud,
    trackUserLogin
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
import { Habit, Goal, Dream, ProgressLog, Todo } from '@/types';
import styles from './DashboardContent.module.css';

interface DashboardContentProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export default function DashboardContent({ user }: DashboardContentProps) {
    const { addToast } = useToast();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
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
            let storedTodos: Todo[];

            if (useCloud) {
                console.log('[Dashboard] Loading from cloud for user:', userId);
                [storedHabits, storedGoals, storedDreams, storedLogs, storedTodos] = await Promise.all([
                    fetchHabitsFromCloud(userId),
                    fetchGoalsFromCloud(userId),
                    fetchDreamsFromCloud(userId),
                    fetchProgressLogsFromCloud(userId),
                    fetchTodosFromCloud(userId)
                ]);
            } else {
                storedHabits = getStoredHabits();
                storedGoals = getStoredGoals();
                storedDreams = getStoredDreams();
                storedLogs = getStoredProgressLogs();
                storedTodos = getStoredTodos();
            }

            setHabits(storedHabits);
            setGoals(storedGoals);
            setDreams(storedDreams);
            setProgressLogs(storedLogs);
            setTodos(storedTodos);

            // Calculate streak
            if (storedHabits.length > 0) {
                const habitIds = storedHabits.map(h => h.id);
                const streak = calculateStreak(storedLogs, habitIds);
                setCurrentStreak(streak.currentStreak);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Fallback to localStorage
            setHabits(getStoredHabits());
            setGoals(getStoredGoals());
            setDreams(getStoredDreams());
            setProgressLogs(getStoredProgressLogs());
            setTodos(getStoredTodos());
        }
    }, [useCloud, userId]);

    useEffect(() => {
        loadData();
        // Track user login when dashboard loads
        if (useCloud && user.email) {
            trackUserLogin({
                email: user.email,
                name: user.name,
                image: user.image,
            });
        }
    }, [loadData, useCloud, user]);

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

    const toggleTodo = async (todo: Todo) => {
        try {
            const updated: Todo = {
                ...todo,
                completed: !todo.completed,
                completedAt: !todo.completed ? new Date() : undefined,
            };

            if (useCloud) {
                await saveTodoToCloud(updated);
            }
            updateStoredTodo(todo.id, updated);
            await loadData();
            addToast('success', updated.completed ? 'To-Do selesai! 🎉' : 'To-Do dibatalkan');
        } catch (error) {
            console.error('Error toggling todo:', error);
            addToast('error', 'Gagal mengubah status to-do');
        }
    };

    const completedToday = habits.filter(h => isHabitCompleted(h.id)).length;
    const completionPercentage = habits.length > 0
        ? Math.round((completedToday / habits.length) * 100)
        : 0;

    const pendingTodos = todos.filter(t => !t.completed);
    const todayTodos = pendingTodos.slice(0, 5); // Show max 5 pending todos

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1>Selamat datang, {user.name?.split(' ')[0] || 'User'}! 👋</h1>
                    <p className={styles.date}>{formatDateDisplay(new Date())}</p>
                </div>
            </header>

            {/* Stats Grid - 2x2 on mobile */}
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
                        <span className={styles.statLabel}>Habits</span>
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
                        <span className={styles.statLabel}>Goals</span>
                    </div>
                </div>

                <div className={`neo-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{pendingTodos.length}</span>
                        <span className={styles.statLabel}>To-Do</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainGrid}>
                {/* Main Column - To-Do + Habits */}
                <div className={styles.mainColumn}>
                    {/* Today's To-Do */}
                    <section className={styles.todosSection}>
                        <div className={styles.sectionHeader}>
                            <h2>📋 To-Do Hari Ini</h2>
                            <a href="/dashboard/todos" className="neo-btn neo-btn-sm neo-btn-secondary">
                                Lihat Semua
                            </a>
                        </div>

                        {todayTodos.length === 0 ? (
                            <div className={`neo-card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>✨</div>
                                <h3>Tidak ada to-do pending</h3>
                                <p>Semua tugas selesai atau belum ada to-do.</p>
                                <a href="/dashboard/todos" className="neo-btn neo-btn-primary mt-md">
                                    Tambah To-Do
                                </a>
                            </div>
                        ) : (
                            <div className={styles.todosList}>
                                {todayTodos.map(todo => (
                                    <div
                                        key={todo.id}
                                        className={`neo-card-flat ${styles.todoItem}`}
                                        onClick={() => toggleTodo(todo)}
                                    >
                                        <label className="neo-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={todo.completed}
                                                onChange={() => { }}
                                            />
                                        </label>
                                        <div className={styles.todoInfo}>
                                            <span className={styles.todoTitle}>{todo.title}</span>
                                            <span className={`neo-badge ${styles.priorityBadge} ${styles[todo.priority]}`}>
                                                {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'} {todo.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Today's Habits */}
                    <section className={styles.habitsSection}>
                        <div className={styles.sectionHeader}>
                            <h2>✅ Habits Hari Ini</h2>
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
                </div>

                {/* Sidebar - Quick Actions & Goals */}
                <aside className={styles.sidebar}>
                    {/* Quick Actions */}
                    <section className={styles.quickActions}>
                        <h3>Quick Actions</h3>
                        <div className={styles.actionButtons}>
                            <a href="/dashboard/todos" className="neo-btn neo-btn-primary">
                                📋 Tambah To-Do
                            </a>
                            <a href="/dashboard/dreams" className="neo-btn neo-btn-secondary">
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
                </aside>
            </div>
        </div>
    );
}
