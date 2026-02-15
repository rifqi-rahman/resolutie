'use client';

import { Goal } from '@/types';
import styles from '../DashboardContent.module.css';

interface GoalsSectionProps {
    goals: Goal[];
}

export default function GoalsSection({ goals }: GoalsSectionProps) {
    const activeGoals = goals.filter(g => g.status === 'active');

    return (
        <section className={styles.goalsSection}>
            <h3>Goals Aktif</h3>
            {activeGoals.length === 0 ? (
                <p className={styles.emptyText}>Belum ada goals aktif.</p>
            ) : (
                <div className={styles.goalsList}>
                    {activeGoals.slice(0, 3).map(goal => (
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
    );
}
