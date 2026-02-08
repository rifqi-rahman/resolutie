'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useTheme, useToast } from '@/components/providers';
import {
    getStoredSettings,
    updateStoredSettings,
    exportAllData,
    clearAllStoredData
} from '@/lib/storage';
import { isValidApiKey } from '@/lib/utils';
import styles from './settings.module.css';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { addToast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openaiKey, setOpenaiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        const settings = getStoredSettings();
        if (settings.openaiApiKey) {
            setOpenaiKey(settings.openaiApiKey);
        }
    }, []);

    const handleSaveApiKey = () => {
        if (openaiKey && !isValidApiKey(openaiKey)) {
            addToast('error', 'API Key tidak valid. Harus dimulai dengan "sk-"');
            return;
        }
        updateStoredSettings({ openaiApiKey: openaiKey });
        addToast('success', 'API Key berhasil disimpan');
    };

    const handleExportData = () => {
        const data = exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resolutie-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('success', 'Data berhasil diekspor');
    };

    const handleClearData = () => {
        if (confirm('PERINGATAN: Semua data akan dihapus permanen. Lanjutkan?')) {
            if (confirm('Yakin? Tindakan ini tidak dapat dibatalkan.')) {
                clearAllStoredData();
                addToast('info', 'Semua data telah dihapus');
                router.push('/');
            }
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
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className={`${styles.content} ${sidebarOpen ? '' : styles.contentExpanded}`}>
                    <div className={styles.page}>
                        <header className={styles.header}>
                            <h1>⚙️ Settings</h1>
                            <p>Kelola akun dan preferensi aplikasi.</p>
                        </header>

                        {/* Profile Section */}
                        <section className={`neo-card ${styles.section}`}>
                            <h2>Profil</h2>
                            <div className={styles.profileInfo}>
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className={styles.avatar}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {session.user.name?.[0] || 'U'}
                                    </div>
                                )}
                                <div>
                                    <h3>{session.user.name}</h3>
                                    <p className={styles.email}>{session.user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="neo-btn neo-btn-danger mt-lg"
                            >
                                Logout
                            </button>
                        </section>

                        {/* Theme Section */}
                        <section className={`neo-card ${styles.section}`}>
                            <h2>Tema</h2>
                            <div className={styles.themeOptions}>
                                {['light', 'dark', 'system'].map((t) => (
                                    <button
                                        key={t}
                                        className={`neo-btn ${theme === t ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
                                        onClick={() => setTheme(t as 'light' | 'dark' | 'system')}
                                    >
                                        {t === 'light' && '☀️ Light'}
                                        {t === 'dark' && '🌙 Dark'}
                                        {t === 'system' && '💻 System'}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* AI Settings */}
                        <section className={`neo-card ${styles.section}`}>
                            <h2>🤖 AI Settings</h2>
                            <p className={styles.sectionDesc}>
                                Masukkan API Key OpenAI untuk mengaktifkan fitur AI seperti
                                rekomendasi SMART Goals dan saran habits.
                            </p>
                            <div className="neo-form-group">
                                <label className="neo-label">OpenAI API Key</label>
                                <div className={styles.apiKeyInput}>
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        className="neo-input"
                                        placeholder="sk-..."
                                        value={openaiKey}
                                        onChange={e => setOpenaiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="neo-btn neo-btn-ghost"
                                        onClick={() => setShowKey(!showKey)}
                                    >
                                        {showKey ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <small className={styles.hint}>
                                    Dapatkan API key dari{' '}
                                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                                        platform.openai.com
                                    </a>
                                </small>
                            </div>
                            <button onClick={handleSaveApiKey} className="neo-btn neo-btn-primary mt-md">
                                Simpan API Key
                            </button>
                        </section>

                        {/* Data Management */}
                        <section className={`neo-card ${styles.section}`}>
                            <h2>📦 Data Management</h2>
                            <p className={styles.sectionDesc}>
                                Data tersimpan di browser lokal (localStorage).
                                Ekspor untuk backup atau import di perangkat lain.
                            </p>
                            <div className={styles.dataButtons}>
                                <button onClick={handleExportData} className="neo-btn neo-btn-secondary">
                                    📥 Export Data
                                </button>
                                <button onClick={handleClearData} className="neo-btn neo-btn-danger">
                                    🗑️ Hapus Semua Data
                                </button>
                            </div>
                        </section>

                        {/* About */}
                        <section className={`neo-card ${styles.section}`}>
                            <h2>📱 Tentang Resolutie</h2>
                            <div className={styles.aboutInfo}>
                                <p><strong>Version:</strong> 1.0.0</p>
                                <p><strong>License:</strong> MIT</p>
                                <p>
                                    <strong>Repository:</strong>{' '}
                                    <a href="https://github.com/rifqi-rahman/resolutie" target="_blank" rel="noopener noreferrer">
                                        github.com/rifqi-rahman/resolutie
                                    </a>
                                </p>
                            </div>
                            <div className={styles.aboutButtons}>
                                <a
                                    href="https://github.com/rifqi-rahman/resolutie"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="neo-btn neo-btn-secondary"
                                >
                                    ⭐ Star on GitHub
                                </a>
                                <a
                                    href="https://github.com/rifqi-rahman/resolutie/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="neo-btn neo-btn-secondary"
                                >
                                    🐛 Report Bug
                                </a>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
