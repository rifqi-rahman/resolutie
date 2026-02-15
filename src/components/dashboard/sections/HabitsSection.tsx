'use client';

import { Habit } from '@/types';
import styles from '../DashboardContent.module.css';

interface HabitsSectionProps {
    habits: Habit[];
    isHabitCompleted: (id: string) => boolean;
    toggleHabit: (id: string) => void;
}

export default function HabitsSection({ habits, isHabitCompleted, toggleHabit }: HabitsSectionProps) {
    return (
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
    );
}
