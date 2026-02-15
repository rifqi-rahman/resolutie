'use client';

import { Goal } from '@/types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import styles from '../DashboardContent.module.css';
import { sortListByOrder } from '@/lib/dndUtils';

interface GoalsSectionProps {
    goals: Goal[];
    order: string[];
}

export default function GoalsSection({ goals, order }: GoalsSectionProps) {
    const activeGoals = goals.filter(g => g.status === 'active');
    const sortedGoals = sortListByOrder(activeGoals, order).slice(0, 3);

    return (
        <section className={styles.goalsSection}>
            <h3>Goals Aktif</h3>
            {sortedGoals.length === 0 ? (
                <p className={styles.emptyText}>Belum ada goals aktif.</p>
            ) : (
                <Droppable droppableId="goals">
                    {(provided) => (
                        <div
                            className={styles.goalsList}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {sortedGoals.map((goal, index) => (
                                <Draggable key={goal.id} draggableId={goal.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{ ...provided.draggableProps.style }}
                                            className={`${styles.goalItem} ${snapshot.isDragging ? styles.isDraggingItem : ''} neo-card-flat`}
                                        >
                                            <h4>{goal.title}</h4>
                                            <p className={styles.goalDeadline}>
                                                Deadline: {new Date(goal.timeBound).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            )}
        </section>
    );
}
