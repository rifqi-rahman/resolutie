'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
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

// Importing Sections
import DraggableSection from './sections/DraggableSection';
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

interface DashboardLayout {
    main: string[];
    sidebar: string[];
}

const DEFAULT_LAYOUT: DashboardLayout = {
    main: ['todos', 'habits'],
    sidebar: ['quickActions', 'goals']
};

export default function DashboardContent({ user }: DashboardContentProps) {
    const { addToast } = useToast();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const today = getToday();

    // Layout State
    const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
    const [isClient, setIsClient] = useState(false);

    // Use email as userId for consistent identification across devices
    const userId = user.email || 'local';
    const useCloud = isSupabaseConfigured() && !!user.email;

    useEffect(() => {
        setIsClient(true);
        const storedLayout = localStorage.getItem('resolutie_dashboard_layout');
        if (storedLayout) {
            try {
                setLayout(JSON.parse(storedLayout));
            } catch (e) {
                console.error('Failed to parse dashboard layout', e);
            }
        }
    }, []);

    const saveLayout = (newLayout: DashboardLayout) => {
        setLayout(newLayout);
        localStorage.setItem('resolutie_dashboard_layout', JSON.stringify(newLayout));
    };

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

        // If dropped in the same list and same index, do nothing
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const newLayout = { ...layout };
        const sourceList = source.droppableId === 'main' ? [...newLayout.main] : [...newLayout.sidebar];
        const destList = destination.droppableId === 'main' ? [...newLayout.main] : [...newLayout.sidebar];

        // Moving within the same list
        if (source.droppableId === destination.droppableId) {
            const [removed] = sourceList.splice(source.index, 1);
            sourceList.splice(destination.index, 0, removed);

            if (source.droppableId === 'main') {
                newLayout.main = sourceList;
            } else {
                newLayout.sidebar = sourceList;
            }
        } else {
            // Moving between lists
            const [removed] = sourceList.splice(source.index, 1);
            destList.splice(destination.index, 0, removed);

            if (source.droppableId === 'main') {
                newLayout.main = sourceList;
                newLayout.sidebar = destList;
            } else {
                newLayout.sidebar = sourceList;
                newLayout.main = destList;
            }
        }

        saveLayout(newLayout);
    };

    const renderSection = (id: string, index: number) => {
        return (
            <DraggableSection key={id} id={id} index={index}>
                {id === 'todos' && <TodosSection todos={todos} toggleTodo={toggleTodo} />}
                {id === 'habits' && (
                    <HabitsSection
                        habits={habits}
                        isHabitCompleted={isHabitCompleted}
                        toggleHabit={toggleHabit}
                    />
                )}
                {id === 'quickActions' && <QuickActionsSection />}
                {id === 'goals' && <GoalsSection goals={goals} />}
            </DraggableSection>
        );
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
                    {/* Main Column */}
                    <Droppable droppableId="main">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={styles.mainColumn} // Reusing struct for layout
                            >
                                {layout.main.map((id, index) => renderSection(id, index))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    {/* Sidebar Column */}
                    <Droppable droppableId="sidebar">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={styles.sidebar} // Reusing struct for layout
                            >
                                {layout.sidebar.map((id, index) => renderSection(id, index))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>
        </div>
    );
}
