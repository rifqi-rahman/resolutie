'use client';

import { Todo } from '@/types';
import styles from '../DashboardContent.module.css';

interface TodosSectionProps {
    todos: Todo[];
    toggleTodo: (todo: Todo) => void;
}

export default function TodosSection({ todos, toggleTodo }: TodosSectionProps) {
    const pendingTodos = todos.filter(t => !t.completed);
    const todayTodos = pendingTodos.slice(0, 5); // Show max 5 pending todos

    return (
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
    );
}
