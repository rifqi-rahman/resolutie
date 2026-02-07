'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import {
    getStoredHabits,
    addStoredHabit,
    deleteStoredHabit,
    getStoredGoals,
    getStoredProgressLogs,
    isHabitCompletedForDate,
    addProgressLog,
    removeProgressLog
} from '@/lib/storage';
import { generateId, getToday, formatDateDisplay } from '@/lib/utils';
import { useToast } from '@/components/providers';
import { Habit, Goal, ProgressLog } from '@/types';
import styles from './habits.module.css';

const HABIT_LABELS = [
    'Kesehatan',
    'Produktivitas',
    'Belajar',
    'Olahraga',
    'Mindfulness',
    'Sosial',
    'Keuangan',
    'Kreativitas',
    'Lainnya'
];

export default function HabitsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addToast } = useToast();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState<{
        title: string;
        label: string;
        goalId: string;
        frequency: 'daily' | 'weekly';
    }>({
        title: '',
        label: HABIT_LABELS[0],
        goalId: '',
        frequency: 'daily'
    });
    const today = getToday();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setHabits(getStoredHabits());
        setGoals(getStoredGoals());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabit.title.trim()) {
            addToast('error', 'Judul habit tidak boleh kosong');
            return;
        }

        const habit: Habit = {
            id: generateId(),
            userId: session?.user?.email || 'local',
            title: newHabit.title,
            label: newHabit.label,
            goalId: newHabit.goalId || undefined,
            frequency: newHabit.frequency,
            createdAt: new Date(),
        };

        addStoredHabit(habit);
        setNewHabit({ title: '', label: HABIT_LABELS[0], goalId: '', frequency: 'daily' });
        setIsModalOpen(false);
        loadData();
        addToast('success', 'Habit berhasil ditambahkan! ✅');
    };

    const handleDelete = (id: string) => {
        if (confirm('Yakin ingin menghapus habit ini?')) {
            deleteStoredHabit(id);
            loadData();
            addToast('info', 'Habit dihapus');
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
                userId: session?.user?.email || 'local',
                completedAt: new Date(),
                date: today,
            };
            addProgressLog(log);
            addToast('success', 'Habit selesai! 🎉');
        }

        loadData();
    };

    // Group habits by label
    const habitsByLabel = habits.reduce((acc, habit) => {
        if (!acc[habit.label]) acc[habit.label] = [];
        acc[habit.label].push(habit);
        return acc;
    }, {} as Record<string, Habit[]>);

    const completedCount = habits.filter(h => isHabitCompletedForDate(h.id, today)).length;
    const completionPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

    if (status === 'loading' || !session) {
        return (
            <div className={styles.loading}>
                <div className="neo-spinner"></div>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <Navbar user={session.user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className={styles.mainContainer}>
                <Sidebar isOpen={sidebarOpen} />
                <main className={`${styles.content} ${sidebarOpen ? '' : styles.contentExpanded}`}>
                    <div className={styles.page}>
                        {/* Header */}
                        <header className={styles.header}>
                            <div>
                                <h1>✅ Daily Habits</h1>
                                <p>{formatDateDisplay(new Date())}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="neo-btn neo-btn-primary"
                            >
                                + Tambah Habit
                            </button>
                        </header>

                        {/* Progress Summary */}
                        <div className={`neo-card ${styles.progressCard}`}>
                            <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>Progress Hari Ini</span>
                                <span className={styles.progressValue}>{completedCount} / {habits.length}</span>
                            </div>
                            <div className="neo-progress">
                                <div className="neo-progress-bar" style={{ width: `${completionPercent}%` }}>
                                    {completionPercent}%
                                </div>
                            </div>
                        </div>

                        {/* Habits List */}
                        {habits.length === 0 ? (
                            <div className={`neo-card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>✅</div>
                                <h2>Belum Ada Habits</h2>
                                <p>Tambahkan kebiasaan harian yang ingin kamu lakukan.</p>
                                <button onClick={() => setIsModalOpen(true)} className="neo-btn neo-btn-primary mt-lg">
                                    Tambah Habit Pertama
                                </button>
                            </div>
                        ) : (
                            <div className={styles.habitsContainer}>
                                {Object.entries(habitsByLabel).map(([label, labelHabits]) => (
                                    <div key={label} className={styles.labelGroup}>
                                        <h3 className={styles.labelTitle}>
                                            <span className="neo-badge neo-badge-primary">{label}</span>
                                            <span className={styles.labelCount}>
                                                {labelHabits.filter(h => isHabitCompletedForDate(h.id, today)).length}/{labelHabits.length}
                                            </span>
                                        </h3>
                                        <div className={styles.habitsList}>
                                            {labelHabits.map(habit => {
                                                const isCompleted = isHabitCompletedForDate(habit.id, today);
                                                const linkedGoal = goals.find(g => g.id === habit.goalId);

                                                return (
                                                    <div
                                                        key={habit.id}
                                                        className={`neo-card-flat ${styles.habitItem} ${isCompleted ? styles.completed : ''}`}
                                                    >
                                                        <div
                                                            className={styles.habitMain}
                                                            onClick={() => toggleHabit(habit.id)}
                                                            style={{ cursor: 'pointer' }}
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
                                                                {linkedGoal && (
                                                                    <span className={styles.linkedGoal}>🎯 {linkedGoal.title}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(habit.id)}
                                                            className={styles.deleteBtn}
                                                            aria-label="Delete habit"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="neo-modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="neo-modal" onClick={e => e.stopPropagation()}>
                                <div className="neo-modal-header">
                                    <h2>Tambah Habit Baru</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="neo-btn neo-btn-ghost">
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="neo-modal-body">
                                        <div className="neo-form-group">
                                            <label className="neo-label" htmlFor="title">Nama Habit *</label>
                                            <input
                                                id="title"
                                                type="text"
                                                className="neo-input"
                                                placeholder="Contoh: Olahraga 30 menit"
                                                value={newHabit.title}
                                                onChange={e => setNewHabit({ ...newHabit, title: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="neo-form-group">
                                            <label className="neo-label" htmlFor="label">Label / Kategori</label>
                                            <select
                                                id="label"
                                                className="neo-input neo-select"
                                                value={newHabit.label}
                                                onChange={e => setNewHabit({ ...newHabit, label: e.target.value })}
                                            >
                                                {HABIT_LABELS.map(label => (
                                                    <option key={label} value={label}>{label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {goals.length > 0 && (
                                            <div className="neo-form-group">
                                                <label className="neo-label" htmlFor="goal">Link ke Goal (opsional)</label>
                                                <select
                                                    id="goal"
                                                    className="neo-input neo-select"
                                                    value={newHabit.goalId}
                                                    onChange={e => setNewHabit({ ...newHabit, goalId: e.target.value })}
                                                >
                                                    <option value="">-- Tidak ada --</option>
                                                    {goals.filter(g => g.status === 'active').map(goal => (
                                                        <option key={goal.id} value={goal.id}>{goal.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="neo-form-group">
                                            <label className="neo-label">Frekuensi</label>
                                            <div className={styles.frequencyOptions}>
                                                <label className={`${styles.radioOption} ${newHabit.frequency === 'daily' ? styles.selected : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="frequency"
                                                        value="daily"
                                                        checked={newHabit.frequency === 'daily'}
                                                        onChange={() => setNewHabit({ ...newHabit, frequency: 'daily' })}
                                                    />
                                                    Harian
                                                </label>
                                                <label className={`${styles.radioOption} ${newHabit.frequency === 'weekly' ? styles.selected : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="frequency"
                                                        value="weekly"
                                                        checked={newHabit.frequency === 'weekly'}
                                                        onChange={() => setNewHabit({ ...newHabit, frequency: 'weekly' })}
                                                    />
                                                    Mingguan
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="neo-modal-footer">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="neo-btn neo-btn-secondary">
                                            Batal
                                        </button>
                                        <button type="submit" className="neo-btn neo-btn-primary">
                                            Simpan Habit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
