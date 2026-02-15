'use client';

import { Todo } from '@/types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import styles from '../DashboardContent.module.css';
import { sortListByOrder } from '@/lib/dndUtils';

interface TodosSectionProps {
    todos: Todo[];
    toggleTodo: (todo: Todo) => void;
    order: string[];
}

export default function TodosSection({ todos, toggleTodo, order }: TodosSectionProps) {
    const pendingTodos = todos.filter(t => !t.completed);
    // Sort full list first, then slice? Or slice then sort?
    // Requirement: drag and drop "tiap isi". User sees top 5.
    // If we reorder, the concept of "top 5" should reflect the custom order.
    // So we sort ALL pending todos by custom order, then take top 5.
    const sortedTodos = sortListByOrder(pendingTodos, order).slice(0, 5);

    return (
        <section className={styles.todosSection}>
            <div className={styles.sectionHeader}>
                <h2>📋 To-Do Hari Ini</h2>
                <a href="/dashboard/todos" className="neo-btn neo-btn-sm neo-btn-secondary">
                    Lihat Semua
                </a>
            </div>

            {sortedTodos.length === 0 ? (
                <div className={`neo-card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>✨</div>
                    <h3>Tidak ada to-do pending</h3>
                    <p>Semua tugas selesai atau belum ada to-do.</p>
                    <a href="/dashboard/todos" className="neo-btn neo-btn-primary mt-md">
                        Tambah To-Do
                    </a>
                </div>
            ) : (
                <Droppable droppableId="todos">
                    {(provided) => (
                        <div
                            className={styles.todosList}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {sortedTodos.map((todo, index) => (
                                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{ ...provided.draggableProps.style }}
                                            className={`${styles.todoItem} ${snapshot.isDragging ? styles.isDraggingItem : ''} neo-card-flat`}
                                            onClick={(e) => {
                                                if (!snapshot.isDragging) toggleTodo(todo);
                                            }}
                                        >
                                            <label className="neo-checkbox" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={todo.completed}
                                                    onChange={() => toggleTodo(todo)}
                                                />
                                            </label>
                                            <div className={styles.todoInfo}>
                                                <span className={styles.todoTitle}>{todo.title}</span>
                                                <span className={`neo-badge ${styles.priorityBadge} ${styles[todo.priority]}`}>
                                                    {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'} {todo.priority}
                                                </span>
                                            </div>
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
