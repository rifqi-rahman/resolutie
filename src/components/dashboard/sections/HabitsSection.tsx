'use client';

import { Habit } from '@/types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import styles from '../DashboardContent.module.css';
import { sortListByOrder } from '@/lib/dndUtils';

interface HabitsSectionProps {
    habits: Habit[];
    isHabitCompleted: (id: string) => boolean;
    toggleHabit: (id: string) => void;
    order: string[];
}

export default function HabitsSection({ habits, isHabitCompleted, toggleHabit, order }: HabitsSectionProps) {
    const sortedHabits = sortListByOrder(habits, order);

    return (
        <section className={styles.habitsSection}>
            <div className={styles.sectionHeader}>
                <h2>✅ Habits Hari Ini</h2>
                <a href="/dashboard/habits" className="neo-btn neo-btn-sm neo-btn-secondary">
                    Lihat Semua
                </a>
            </div>

            {sortedHabits.length === 0 ? (
                <div className={`neo-card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>Belum ada habits</h3>
                    <p>Mulai dengan menambahkan habits harian.</p>
                    <a href="/dashboard/habits" className="neo-btn neo-btn-primary mt-md">
                        Tambah Habit
                    </a>
                </div>
            ) : (
                <Droppable droppableId="habits">
                    {(provided) => (
                        <div
                            className={styles.habitsList}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {sortedHabits.map((habit, index) => {
                                const isCompleted = isHabitCompleted(habit.id);
                                return (
                                    <Draggable key={habit.id} draggableId={habit.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{ ...provided.draggableProps.style }}
                                                className={`${styles.habitItem} ${isCompleted ? styles.completed : ''} ${snapshot.isDragging ? styles.isDraggingItem : ''} neo-card-flat`}
                                                onClick={(e) => {
                                                    if (!snapshot.isDragging) toggleHabit(habit.id);
                                                }}
                                            >
                                                <label className="neo-checkbox" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isCompleted}
                                                        onChange={() => toggleHabit(habit.id)}
                                                    />
                                                </label>
                                                <div className={styles.habitInfo}>
                                                    <span className={styles.habitTitle}>{habit.title}</span>
                                                    <span className={`neo-badge ${styles.habitLabel}`}>{habit.label}</span>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            )}
        </section>
    );
}
