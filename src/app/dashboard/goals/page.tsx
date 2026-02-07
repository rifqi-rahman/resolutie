'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import {
    getStoredGoals,
    addStoredGoal,
    deleteStoredGoal,
    updateStoredGoal,
    getStoredDreams
} from '@/lib/storage';
import { generateId, formatDateDisplay } from '@/lib/utils';
import { useToast } from '@/components/providers';
import { Goal, Dream, GoalStatus } from '@/types';
import styles from './goals.module.css';

function GoalsPageContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<GoalStatus | 'all'>('all');
    const [newGoal, setNewGoal] = useState({
        dreamId: searchParams.get('dreamId') || '',
        title: '',
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: ''
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setGoals(getStoredGoals());
        setDreams(getStoredDreams());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title.trim()) {
            addToast('error', 'Judul goal tidak boleh kosong');
            return;
        }
        if (!newGoal.timeBound) {
            addToast('error', 'Deadline harus diisi');
            return;
        }

        const goal: Goal = {
            id: generateId(),
            userId: session?.user?.email || 'local',
            dreamId: newGoal.dreamId || undefined,
            title: newGoal.title,
            specific: newGoal.specific,
            measurable: newGoal.measurable,
            achievable: newGoal.achievable,
            relevant: newGoal.relevant,
            timeBound: new Date(newGoal.timeBound),
            status: 'active',
            createdAt: new Date(),
        };

        addStoredGoal(goal);
        resetForm();
        setIsModalOpen(false);
        loadData();
        addToast('success', 'Goal berhasil ditambahkan! 🎯');
    };

    const resetForm = () => {
        setNewGoal({
            dreamId: '',
            title: '',
            specific: '',
            measurable: '',
            achievable: '',
            relevant: '',
            timeBound: ''
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('Yakin ingin menghapus goal ini?')) {
            deleteStoredGoal(id);
            loadData();
            addToast('info', 'Goal dihapus');
        }
    };

    const handleStatusChange = (id: string, status: GoalStatus) => {
        updateStoredGoal(id, { status });
        loadData();
        addToast('success', `Status diubah menjadi ${status}`);
    };

    const filteredGoals = filter === 'all'
        ? goals
        : goals.filter(g => g.status === filter);

    const getLinkedDream = (dreamId?: string) => {
        if (!dreamId) return null;
        return dreams.find(d => d.id === dreamId);
    };

    const getDaysRemaining = (deadline: Date) => {
        const diff = new Date(deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

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
                                <h1>🎯 SMART Goals</h1>
                                <p>Goals yang Specific, Measurable, Achievable, Relevant, dan Time-bound.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="neo-btn neo-btn-primary"
                            >
                                + Tambah Goal
                            </button>
                        </header>

                        {/* Filters */}
                        <div className={styles.filters}>
                            {['all', 'active', 'completed', 'paused'].map((status) => (
                                <button
                                    key={status}
                                    className={`neo-btn neo-btn-sm ${filter === status ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
                                    onClick={() => setFilter(status as GoalStatus | 'all')}
                                >
                                    {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Goals List */}
                        {filteredGoals.length === 0 ? (
                            <div className={`neo-card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>🎯</div>
                                <h2>Belum Ada Goals</h2>
                                <p>Buat SMART goals untuk mencapai impianmu.</p>
                                <button onClick={() => setIsModalOpen(true)} className="neo-btn neo-btn-primary mt-lg">
                                    Buat Goal Pertama
                                </button>
                            </div>
                        ) : (
                            <div className={styles.goalsList}>
                                {filteredGoals.map(goal => {
                                    const linkedDream = getLinkedDream(goal.dreamId);
                                    const daysRemaining = getDaysRemaining(goal.timeBound);

                                    return (
                                        <div key={goal.id} className={`neo-card ${styles.goalCard}`}>
                                            <div className={styles.goalHeader}>
                                                <div className={styles.goalBadges}>
                                                    <span className={`neo-badge ${goal.status === 'active' ? 'neo-badge-primary' :
                                                        goal.status === 'completed' ? 'neo-badge-success' :
                                                            'neo-badge-warning'
                                                        }`}>
                                                        {goal.status}
                                                    </span>
                                                    {linkedDream && (
                                                        <span className="neo-badge neo-badge-purple">
                                                            💭 {linkedDream.title.substring(0, 20)}...
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(goal.id)}
                                                    className={styles.deleteBtn}
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <h3>{goal.title}</h3>

                                            <div className={styles.smartGrid}>
                                                <div className={styles.smartItem}>
                                                    <span className={styles.smartLabel}>S</span>
                                                    <span className={styles.smartText}>{goal.specific || '-'}</span>
                                                </div>
                                                <div className={styles.smartItem}>
                                                    <span className={styles.smartLabel}>M</span>
                                                    <span className={styles.smartText}>{goal.measurable || '-'}</span>
                                                </div>
                                                <div className={styles.smartItem}>
                                                    <span className={styles.smartLabel}>A</span>
                                                    <span className={styles.smartText}>{goal.achievable || '-'}</span>
                                                </div>
                                                <div className={styles.smartItem}>
                                                    <span className={styles.smartLabel}>R</span>
                                                    <span className={styles.smartText}>{goal.relevant || '-'}</span>
                                                </div>
                                                <div className={styles.smartItem}>
                                                    <span className={styles.smartLabel}>T</span>
                                                    <span className={styles.smartText}>
                                                        {formatDateDisplay(goal.timeBound)}
                                                        {goal.status === 'active' && (
                                                            <span className={`${styles.daysRemaining} ${daysRemaining < 7 ? styles.urgent : ''}`}>
                                                                ({daysRemaining > 0 ? `${daysRemaining} hari lagi` : 'Sudah lewat'})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.goalActions}>
                                                {goal.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(goal.id, 'completed')}
                                                        className="neo-btn neo-btn-sm neo-btn-success"
                                                    >
                                                        ✓ Selesai
                                                    </button>
                                                )}
                                                {goal.status === 'active' && (
                                                    <button
                                                        onClick={() => handleStatusChange(goal.id, 'paused')}
                                                        className="neo-btn neo-btn-sm neo-btn-secondary"
                                                    >
                                                        ⏸ Pause
                                                    </button>
                                                )}
                                                {goal.status === 'paused' && (
                                                    <button
                                                        onClick={() => handleStatusChange(goal.id, 'active')}
                                                        className="neo-btn neo-btn-sm neo-btn-primary"
                                                    >
                                                        ▶ Resume
                                                    </button>
                                                )}
                                                <a
                                                    href={`/dashboard/habits?goalId=${goal.id}`}
                                                    className="neo-btn neo-btn-sm neo-btn-secondary"
                                                >
                                                    + Habits
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="neo-modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="neo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                                <div className="neo-modal-header">
                                    <h2>Tambah SMART Goal</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="neo-btn neo-btn-ghost">
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="neo-modal-body">
                                        {dreams.length > 0 && (
                                            <div className="neo-form-group">
                                                <label className="neo-label">Link ke Dream (opsional)</label>
                                                <select
                                                    className="neo-input neo-select"
                                                    value={newGoal.dreamId}
                                                    onChange={e => setNewGoal({ ...newGoal, dreamId: e.target.value })}
                                                >
                                                    <option value="">-- Pilih Dream --</option>
                                                    {dreams.map(dream => (
                                                        <option key={dream.id} value={dream.id}>{dream.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="neo-form-group">
                                            <label className="neo-label">Judul Goal *</label>
                                            <input
                                                type="text"
                                                className="neo-input"
                                                placeholder="Contoh: Menurunkan berat badan 5kg"
                                                value={newGoal.title}
                                                onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        <div className={styles.smartFormGrid}>
                                            <div className="neo-form-group">
                                                <label className="neo-label">
                                                    <span className={styles.smartBadge}>S</span> Specific
                                                </label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    placeholder="Apa yang ingin dicapai secara spesifik?"
                                                    value={newGoal.specific}
                                                    onChange={e => setNewGoal({ ...newGoal, specific: e.target.value })}
                                                />
                                            </div>

                                            <div className="neo-form-group">
                                                <label className="neo-label">
                                                    <span className={styles.smartBadge}>M</span> Measurable
                                                </label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    placeholder="Bagaimana mengukur kesuksesan?"
                                                    value={newGoal.measurable}
                                                    onChange={e => setNewGoal({ ...newGoal, measurable: e.target.value })}
                                                />
                                            </div>

                                            <div className="neo-form-group">
                                                <label className="neo-label">
                                                    <span className={styles.smartBadge}>A</span> Achievable
                                                </label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    placeholder="Mengapa ini bisa dicapai?"
                                                    value={newGoal.achievable}
                                                    onChange={e => setNewGoal({ ...newGoal, achievable: e.target.value })}
                                                />
                                            </div>

                                            <div className="neo-form-group">
                                                <label className="neo-label">
                                                    <span className={styles.smartBadge}>R</span> Relevant
                                                </label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    placeholder="Mengapa ini penting?"
                                                    value={newGoal.relevant}
                                                    onChange={e => setNewGoal({ ...newGoal, relevant: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="neo-form-group">
                                            <label className="neo-label">
                                                <span className={styles.smartBadge}>T</span> Time-bound (Deadline) *
                                            </label>
                                            <input
                                                type="date"
                                                className="neo-input"
                                                value={newGoal.timeBound}
                                                onChange={e => setNewGoal({ ...newGoal, timeBound: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="neo-modal-footer">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="neo-btn neo-btn-secondary">
                                            Batal
                                        </button>
                                        <button type="submit" className="neo-btn neo-btn-primary">
                                            Simpan Goal
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

export default function GoalsPage() {
    return (
        <Suspense fallback={
            <div className={styles.loading}>
                <div className="neo-spinner"></div>
            </div>
        }>
            <GoalsPageContent />
        </Suspense>
    );
}
