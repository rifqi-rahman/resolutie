'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { getStoredDreams, addStoredDream, deleteStoredDream, updateStoredDream } from '@/lib/storage';
import { fetchDreamsFromCloud, saveDreamToCloud, deleteDreamFromCloud } from '@/lib/cloudStorage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { generateId, formatDateDisplay } from '@/lib/utils';
import { useToast } from '@/components/providers';
import { Dream } from '@/types';
import styles from './dreams.module.css';

export default function DreamsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addToast } = useToast();
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newDream, setNewDream] = useState({ title: '', description: '' });
    const [editingDreamId, setEditingDreamId] = useState<string | null>(null);

    // Use email as userId for consistent identification across devices
    const userId = session?.user?.email || 'local';
    const useCloud = isSupabaseConfigured() && !!session?.user?.email;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    const loadDreams = useCallback(async () => {
        setIsLoading(true);
        try {
            if (useCloud && session?.user?.email) {
                console.log('[Dreams] Loading from cloud for user:', session.user.email);
                const cloudDreams = await fetchDreamsFromCloud(session.user.email);
                console.log('[Dreams] Loaded from cloud:', cloudDreams.length, 'dreams');
                setDreams(cloudDreams);
            } else {
                console.log('[Dreams] Loading from localStorage');
                setDreams(getStoredDreams());
            }
        } catch (error) {
            console.error('Error loading dreams:', error);
            setDreams(getStoredDreams());
        } finally {
            setIsLoading(false);
        }
    }, [useCloud, session?.user?.email]);

    useEffect(() => {
        if (status !== 'loading') {
            loadDreams();
        }
    }, [status, loadDreams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDream.title.trim()) {
            addToast('error', 'Judul dream tidak boleh kosong');
            return;
        }

        try {
            if (editingDreamId) {
                // Update existing dream
                const updates = {
                    title: newDream.title,
                    description: newDream.description,
                };

                if (useCloud) {
                    const currentDream = dreams.find(d => d.id === editingDreamId);
                    if (currentDream) {
                        await saveDreamToCloud({ ...currentDream, ...updates });
                    }
                }
                updateStoredDream(editingDreamId, updates);
                addToast('success', 'Dream berhasil diperbarui! ✨');
            } else {
                // Create new dream
                const dream: Dream = {
                    id: generateId(),
                    userId: userId,
                    title: newDream.title,
                    description: newDream.description,
                    createdAt: new Date(),
                };

                if (useCloud) {
                    await saveDreamToCloud(dream);
                }
                addStoredDream(dream);
                addToast('success', useCloud ? 'Dream tersimpan ke cloud! ☁️✨' : 'Dream berhasil ditambahkan! ✨');
            }

            setNewDream({ title: '', description: '' });
            setEditingDreamId(null);
            setIsModalOpen(false);
            await loadDreams();
        } catch (error) {
            console.error('Error saving dream:', error);
            addToast('error', 'Gagal menyimpan dream');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Yakin ingin menghapus dream ini?')) {
            try {
                if (useCloud) {
                    await deleteDreamFromCloud(id);
                }
                deleteStoredDream(id);
                await loadDreams();
                addToast('info', 'Dream dihapus');
            } catch (error) {
                console.error('Error deleting dream:', error);
                addToast('error', 'Gagal menghapus dream');
            }
        }
    };

    const handleEdit = (dream: Dream) => {
        setNewDream({ title: dream.title, description: dream.description || '' });
        setEditingDreamId(dream.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDreamId(null);
        setNewDream({ title: '', description: '' });
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
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className={`${styles.content} ${sidebarOpen ? '' : styles.contentExpanded}`}>
                    <div className={styles.page}>
                        {/* Header */}
                        <header className={styles.header}>
                            <div>
                                <h1>💭 Dreams</h1>
                                <p>Tulis impian dan aspirasimu. Ini adalah langkah pertama menuju goals yang terukur.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setNewDream({ title: '', description: '' });
                                    setEditingDreamId(null);
                                    setIsModalOpen(true);
                                }}
                                className="neo-btn neo-btn-primary"
                            >
                                + Tambah Dream
                            </button>
                        </header>

                        {/* Dreams Grid */}
                        {dreams.length === 0 ? (
                            <div className={`neo-card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>💭</div>
                                <h2>Mulai dengan Impianmu</h2>
                                <p>Apa yang ingin kamu capai? Tulis impianmu, sebesar apapun itu.</p>
                                <button onClick={() => setIsModalOpen(true)} className="neo-btn neo-btn-primary mt-lg">
                                    Tulis Dream Pertama
                                </button>
                            </div>
                        ) : (
                            <div className={styles.dreamsGrid}>
                                {dreams.map(dream => (
                                    <div key={dream.id} className={`neo-card ${styles.dreamCard}`}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.dreamIcon}>✨</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleEdit(dream)}
                                                    className={styles.editBtn}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                                    aria-label="Edit dream"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dream.id)}
                                                    className={styles.deleteBtn}
                                                    aria-label="Delete dream"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                        <h3>{dream.title}</h3>
                                        {dream.description && <p>{dream.description}</p>}
                                        <div className={styles.cardFooter}>
                                            <span className={styles.date}>
                                                {formatDateDisplay(dream.createdAt)}
                                            </span>
                                            <a
                                                href={`/dashboard/goals?dreamId=${dream.id}`}
                                                className="neo-btn neo-btn-sm neo-btn-secondary"
                                            >
                                                → Buat Goals
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="neo-modal-overlay" onClick={handleCloseModal}>
                            <div className="neo-modal" onClick={e => e.stopPropagation()}>
                                <div className="neo-modal-header">
                                    <h2>{editingDreamId ? 'Edit Dream' : 'Tambah Dream Baru'}</h2>
                                    <button onClick={handleCloseModal} className="neo-btn neo-btn-ghost">
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="neo-modal-body">
                                        <div className="neo-form-group">
                                            <label className="neo-label" htmlFor="title">Judul Dream *</label>
                                            <input
                                                id="title"
                                                type="text"
                                                className="neo-input"
                                                placeholder="Contoh: Menjadi pengusaha sukses"
                                                value={newDream.title}
                                                onChange={e => setNewDream({ ...newDream, title: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="neo-form-group">
                                            <label className="neo-label" htmlFor="description">Deskripsi (opsional)</label>
                                            <textarea
                                                id="description"
                                                className="neo-input neo-textarea"
                                                placeholder="Jelaskan lebih detail tentang impianmu..."
                                                value={newDream.description}
                                                onChange={e => setNewDream({ ...newDream, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="neo-modal-footer">
                                        <button type="button" onClick={handleCloseModal} className="neo-btn neo-btn-secondary">
                                            Batal
                                        </button>
                                        <button type="submit" className="neo-btn neo-btn-primary">
                                            {editingDreamId ? 'Update Dream' : 'Simpan Dream'}
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
