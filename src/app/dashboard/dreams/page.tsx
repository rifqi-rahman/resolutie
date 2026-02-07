'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { getStoredDreams, addStoredDream, deleteStoredDream } from '@/lib/storage';
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
    const [newDream, setNewDream] = useState({ title: '', description: '' });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        loadDreams();
    }, []);

    const loadDreams = () => {
        setDreams(getStoredDreams());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDream.title.trim()) {
            addToast('error', 'Judul dream tidak boleh kosong');
            return;
        }

        const dream: Dream = {
            id: generateId(),
            userId: session?.user?.email || 'local',
            title: newDream.title,
            description: newDream.description,
            createdAt: new Date(),
        };

        addStoredDream(dream);
        setNewDream({ title: '', description: '' });
        setIsModalOpen(false);
        loadDreams();
        addToast('success', 'Dream berhasil ditambahkan! ✨');
    };

    const handleDelete = (id: string) => {
        if (confirm('Yakin ingin menghapus dream ini?')) {
            deleteStoredDream(id);
            loadDreams();
            addToast('info', 'Dream dihapus');
        }
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
                                <h1>💭 Dreams</h1>
                                <p>Tulis impian dan aspirasimu. Ini adalah langkah pertama menuju goals yang terukur.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
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
                                            <button
                                                onClick={() => handleDelete(dream.id)}
                                                className={styles.deleteBtn}
                                                aria-label="Delete dream"
                                            >
                                                ✕
                                            </button>
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
                        <div className="neo-modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="neo-modal" onClick={e => e.stopPropagation()}>
                                <div className="neo-modal-header">
                                    <h2>Tambah Dream Baru</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="neo-btn neo-btn-ghost">
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
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="neo-btn neo-btn-secondary">
                                            Batal
                                        </button>
                                        <button type="submit" className="neo-btn neo-btn-primary">
                                            Simpan Dream
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
