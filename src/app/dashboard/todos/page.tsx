'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useToast } from '@/components/providers';
import { Todo, TodoPriority } from '@/types';
import { generateId } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
    getStoredTodos,
    addStoredTodo,
    updateStoredTodo,
    deleteStoredTodo,
} from '@/lib/storage';
import {
    fetchTodosFromCloud,
    saveTodoToCloud,
    deleteTodoFromCloud,
} from '@/lib/cloudStorage';
import styles from './todos.module.css';
import dashboardStyles from '../dashboard.module.css';

type FilterType = 'all' | 'pending' | 'completed';

export default function TodosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addToast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium' as TodoPriority,
        dueDate: '',
    });

    const userId = session?.user?.email || 'local';
    const useCloud = isSupabaseConfigured() && !!session?.user?.email;

    const loadTodos = useCallback(async () => {
        setIsLoading(true);
        try {
            if (useCloud) {
                console.log('[Todos] Loading from cloud for user:', userId);
                const cloudTodos = await fetchTodosFromCloud(userId);
                setTodos(cloudTodos);
            } else {
                setTodos(getStoredTodos());
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            setTodos(getStoredTodos());
        }
        setIsLoading(false);
    }, [useCloud, userId]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            loadTodos();
        }
    }, [status, loadTodos]);

    const resetForm = () => {
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
        setEditingTodo(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            addToast('error', 'Judul tidak boleh kosong');
            return;
        }

        try {
            if (editingTodo) {
                // Update existing todo
                const updatedTodo: Todo = {
                    ...editingTodo,
                    title: formData.title,
                    description: formData.description || undefined,
                    priority: formData.priority,
                    dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
                };

                if (useCloud) {
                    await saveTodoToCloud(updatedTodo);
                }
                updateStoredTodo(editingTodo.id, updatedTodo);
                addToast('success', 'To-Do berhasil diperbarui!');
            } else {
                // Create new todo
                const newTodo: Todo = {
                    id: generateId(),
                    userId,
                    title: formData.title,
                    description: formData.description || undefined,
                    priority: formData.priority,
                    dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
                    completed: false,
                    createdAt: new Date(),
                };

                if (useCloud) {
                    await saveTodoToCloud(newTodo);
                }
                addStoredTodo(newTodo);
                addToast('success', 'To-Do berhasil ditambahkan!');
            }

            resetForm();
            await loadTodos();
        } catch (error) {
            console.error('Error saving todo:', error);
            addToast('error', 'Gagal menyimpan To-Do');
        }
    };

    const handleToggleComplete = async (todo: Todo) => {
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
            await loadTodos();
            addToast('success', updated.completed ? 'To-Do selesai! 🎉' : 'To-Do dibatalkan');
        } catch (error) {
            console.error('Error toggling todo:', error);
            addToast('error', 'Gagal mengubah status');
        }
    };

    const handleEdit = (todo: Todo) => {
        setEditingTodo(todo);
        setFormData({
            title: todo.title,
            description: todo.description || '',
            priority: todo.priority,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus To-Do ini?')) return;

        try {
            if (useCloud) {
                await deleteTodoFromCloud(id);
            }
            deleteStoredTodo(id);
            await loadTodos();
            addToast('success', 'To-Do berhasil dihapus');
        } catch (error) {
            console.error('Error deleting todo:', error);
            addToast('error', 'Gagal menghapus To-Do');
        }
    };

    const filteredTodos = todos.filter(todo => {
        if (filter === 'pending') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });

    const sortedTodos = [...filteredTodos].sort((a, b) => {
        // Sort by completed first (pending first)
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Then by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        // Then by due date
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
    });

    const pendingCount = todos.filter(t => !t.completed).length;
    const completedCount = todos.filter(t => t.completed).length;

    if (status === 'loading' || isLoading) {
        return (
            <div className={dashboardStyles.loadingContainer}>
                <div className="neo-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className={dashboardStyles.dashboardLayout}>
            <Navbar user={session.user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className={dashboardStyles.mainContainer}>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className={`${dashboardStyles.content} ${sidebarOpen ? '' : dashboardStyles.contentExpanded}`}>
                    <div className={styles.todosPage}>
                        {/* Header */}
                        <header className={styles.header}>
                            <div>
                                <h1>📋 To-Do List</h1>
                                <p className={styles.subtitle}>
                                    {pendingCount} pending, {completedCount} completed
                                </p>
                            </div>
                            <button
                                className="neo-btn neo-btn-primary"
                                onClick={() => { resetForm(); setIsFormOpen(true); }}
                            >
                                + Tambah To-Do
                            </button>
                        </header>

                        {/* Filter Tabs */}
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                Semua ({todos.length})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'pending' ? styles.active : ''}`}
                                onClick={() => setFilter('pending')}
                            >
                                Pending ({pendingCount})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'completed' ? styles.active : ''}`}
                                onClick={() => setFilter('completed')}
                            >
                                Selesai ({completedCount})
                            </button>
                        </div>

                        {/* Add/Edit Form */}
                        {isFormOpen && (
                            <div className={`neo-card ${styles.formCard}`}>
                                <h3>{editingTodo ? 'Edit To-Do' : 'Tambah To-Do Baru'}</h3>
                                <form onSubmit={handleSubmit}>
                                    <div className="neo-form-group">
                                        <label className="neo-label">Judul *</label>
                                        <input
                                            type="text"
                                            className="neo-input"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Apa yang perlu dilakukan?"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="neo-form-group">
                                        <label className="neo-label">Deskripsi</label>
                                        <textarea
                                            className="neo-input neo-textarea"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Detail tambahan (opsional)"
                                        />
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className="neo-form-group">
                                            <label className="neo-label">Prioritas</label>
                                            <select
                                                className="neo-input neo-select"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TodoPriority })}
                                            >
                                                <option value="low">🟢 Low</option>
                                                <option value="medium">🟡 Medium</option>
                                                <option value="high">🔴 High</option>
                                            </select>
                                        </div>
                                        <div className="neo-form-group">
                                            <label className="neo-label">Deadline</label>
                                            <input
                                                type="date"
                                                className="neo-input"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formActions}>
                                        <button type="button" className="neo-btn neo-btn-secondary" onClick={resetForm}>
                                            Batal
                                        </button>
                                        <button type="submit" className="neo-btn neo-btn-primary">
                                            {editingTodo ? 'Simpan Perubahan' : 'Tambah To-Do'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Todos List */}
                        <div className={styles.todosList}>
                            {sortedTodos.length === 0 ? (
                                <div className={`neo-card ${styles.emptyState}`}>
                                    <div className={styles.emptyIcon}>📋</div>
                                    <h3>{filter === 'all' ? 'Belum ada To-Do' : filter === 'pending' ? 'Tidak ada yang pending' : 'Belum ada yang selesai'}</h3>
                                    <p>Klik tombol &quot;+ Tambah To-Do&quot; untuk memulai.</p>
                                </div>
                            ) : (
                                sortedTodos.map(todo => (
                                    <div
                                        key={todo.id}
                                        className={`neo-card-flat ${styles.todoItem} ${todo.completed ? styles.completed : ''}`}
                                    >
                                        <div className={styles.todoCheckbox} onClick={() => handleToggleComplete(todo)}>
                                            <label className="neo-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={todo.completed}
                                                    onChange={() => { }}
                                                />
                                            </label>
                                        </div>
                                        <div className={styles.todoContent}>
                                            <div className={styles.todoHeader}>
                                                <span className={styles.todoTitle}>{todo.title}</span>
                                                <span className={`neo-badge ${styles.priorityBadge} ${styles[todo.priority]}`}>
                                                    {todo.priority === 'high' ? '🔴 High' : todo.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                                                </span>
                                            </div>
                                            {todo.description && (
                                                <p className={styles.todoDescription}>{todo.description}</p>
                                            )}
                                            {todo.dueDate && (
                                                <span className={styles.todoDueDate}>
                                                    📅 {new Date(todo.dueDate).toLocaleDateString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.todoActions}>
                                            <button
                                                className="neo-btn neo-btn-sm neo-btn-ghost"
                                                onClick={() => handleEdit(todo)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="neo-btn neo-btn-sm neo-btn-ghost"
                                                onClick={() => handleDelete(todo.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
