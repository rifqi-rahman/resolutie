'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/dashboard/dreams', icon: '💭', label: 'Dreams' },
    { href: '/dashboard/goals', icon: '🎯', label: 'Goals' },
    { href: '/dashboard/habits', icon: '✅', label: 'Habits' },
    { href: '/dashboard/todos', icon: '📋', label: 'To-Do' },
    { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Overlay - click to close sidebar */}
            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={onClose} // Close sidebar on mobile when navigating
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.label}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <div className={styles.version}>v1.0.0</div>
                    <a
                        href="https://github.com/rifqirahman/resolutie"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.github}
                    >
                        ⭐ Star on GitHub
                    </a>
                </div>
            </aside>
        </>
    );
}
