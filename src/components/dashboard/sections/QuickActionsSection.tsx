'use client';

import styles from '../DashboardContent.module.css';

export default function QuickActionsSection() {
    return (
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
    );
}
