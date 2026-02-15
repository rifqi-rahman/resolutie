'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
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
import { sortListByOrder, reorderList } from '@/lib/dndUtils';
import { DEFAULT_QUICK_ACTIONS, QuickAction } from '@/constants/dashboard';

// Importing Sections
import TodosSection from './sections/TodosSection';
import HabitsSection from './sections/HabitsSection';
import QuickActionsSection from './sections/QuickActionsSection';
import GoalsSection from './sections/GoalsSection';

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

    // Item Order State
    const [quickActions, setQuickActions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS);
    const [todosOrder, setTodosOrder] = useState<string[]>([]);
    const [habitsOrder, setHabitsOrder] = useState<string[]>([]);
    const [goalsOrder, setGoalsOrder] = useState<string[]>([]);

    const [isClient, setIsClient] = useState(false);

    // Use email as userId for consistent identification across devices
    const userId = user.email || 'local';
    const useCloud = isSupabaseConfigured() && !!user.email;

    useEffect(() => {
        setIsClient(true);
        // Load stored orders
        const storedActions = localStorage.getItem('resolutie_qa_order');
        if (storedActions) {
            try {
                const order = JSON.parse(storedActions);
                // Reorder default actions based on stored IDs
                const orderedActions = sortListByOrder(DEFAULT_QUICK_ACTIONS, order);
                setQuickActions(orderedActions);
            } catch (e) {
                console.error('Failed to parse actions order', e);
            }
        }

        const storedTodos = localStorage.getItem('resolutie_todos_order');
        if (storedTodos) setTodosOrder(JSON.parse(storedTodos));

        const storedHabits = localStorage.getItem('resolutie_habits_order');
        if (storedHabits) setHabitsOrder(JSON.parse(storedHabits));

        const storedGoals = localStorage.getItem('resolutie_goals_order');
        if (storedGoals) setGoalsOrder(JSON.parse(storedGoals));

    }, []);

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

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Handle Item Reordering
        if (source.droppableId === 'quickActions') {
            const newActions = reorderList(quickActions, source.index, destination.index);
            setQuickActions(newActions);
            const orderIds = newActions.map(a => a.id);
            localStorage.setItem('resolutie_qa_order', JSON.stringify(orderIds));
        } else if (source.droppableId === 'todos') {
            // Reorder based on filtered list (only visible) or full list?
            // Strategy: Reorder the IDs in state
            const currentFilteredTodos = sortListByOrder(todos.filter(t => !t.completed).slice(0, 5), todosOrder);
            const newOrder = reorderList(currentFilteredTodos.map(t => t.id), source.index, destination.index);

            // Merge new order with existing order (keep completed/hidden items)
            const updatedFullOrder = Array.from(new Set([...newOrder, ...todosOrder]));
            setTodosOrder(updatedFullOrder);
            localStorage.setItem('resolutie_todos_order', JSON.stringify(updatedFullOrder));
        } else if (source.droppableId === 'habits') {
            const currentHabits = sortListByOrder(habits, habitsOrder);
            const newOrder = reorderList(currentHabits.map(h => h.id), source.index, destination.index);
            setHabitsOrder(newOrder);
            localStorage.setItem('resolutie_habits_order', JSON.stringify(newOrder));
        } else if (source.droppableId === 'goals') {
            const currentGoals = sortListByOrder(goals.filter(g => g.status === 'active').slice(0, 3), goalsOrder);
            const newOrder = reorderList(currentGoals.map(g => g.id), source.index, destination.index);

            const updatedFullOrder = Array.from(new Set([...newOrder, ...goalsOrder]));
            setGoalsOrder(updatedFullOrder);
            localStorage.setItem('resolutie_goals_order', JSON.stringify(updatedFullOrder));
        }
    };

    const completedToday = habits.filter(h => isHabitCompleted(h.id)).length;
    const completionPercentage = habits.length > 0
        ? Math.round((completedToday / habits.length) * 100)
        : 0;
    const pendingTodosCount = todos.filter(t => !t.completed).length;

    if (!isClient) return null; // Avoid hydration mismatch

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
                        <span className={styles.statValue}>{pendingTodosCount}</span>
                        <span className={styles.statLabel}>To-Do</span>
                    </div>
                </div>
            </div>

            {/* Main Content - Drag and Drop Context */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className={styles.mainGrid}>
                    {/* Main Column - To-Do + Habits */}
                    <div className={styles.mainColumn}>
                        <TodosSection
                            todos={todos}
                            toggleTodo={toggleTodo}
                            order={todosOrder}
                        />
                        <HabitsSection
                            habits={habits}
                            isHabitCompleted={isHabitCompleted}
                            toggleHabit={toggleHabit}
                            order={habitsOrder}
                        />
                    </div>

                    {/* Sidebar Column - Quick Actions + Goals */}
                    <aside className={styles.sidebar}>
                        <QuickActionsSection actions={quickActions} />
                        <GoalsSection goals={goals} order={goalsOrder} />
                    </aside>
                </div>
            </DragDropContext>
        </div>
    );
}
