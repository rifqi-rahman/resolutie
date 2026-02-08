'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className={styles.loadingContainer}>
                <div className="neo-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className={styles.dashboardLayout}>
            <Navbar
                user={session.user}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            />
            <div className={styles.mainContainer}>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className={`${styles.content} ${sidebarOpen ? '' : styles.contentExpanded}`}>
                    <DashboardContent user={session.user} />
                </main>
            </div>
        </div>
    );
}
