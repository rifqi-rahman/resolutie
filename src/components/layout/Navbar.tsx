'use client';

import { signOut } from 'next-auth/react';
import { useTheme } from '@/components/providers';
import styles from './Navbar.module.css';

interface NavbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    onMenuClick: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <button
                    onClick={onMenuClick}
                    className={`neo-btn neo-btn-ghost ${styles.menuBtn}`}
                    aria-label="Toggle menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <h1 className={styles.brand}>Resolutie</h1>
            </div>

            <div className={styles.right}>
                <button
                    onClick={toggleTheme}
                    className={`neo-btn neo-btn-ghost ${styles.themeBtn}`}
                    aria-label="Toggle theme"
                >
                    {resolvedTheme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className={styles.userMenu}>
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || 'User'}
                            className={styles.avatar}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {user.name?.[0] || user.email?.[0] || 'U'}
                        </div>
                    )}
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className={`neo-btn neo-btn-ghost ${styles.logoutBtn}`}
                    >
                        Keluar
                    </button>
                </div>
            </div>
        </nav>
    );
}
