'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import {
    getStoredHabits,
    getStoredProgressLogs
} from '@/lib/storage';
import {
    calculateStreak,
    calculateHourlyActivity,
    calculateDailyProgress,
    calculateConsistencyScore,
    getWeekDates,
    formatHour
} from '@/lib/utils';
import { Habit, ProgressLog, HourlyActivity, DailyProgress } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [consistencyScore, setConsistencyScore] = useState(0);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
    const [weeklyProgress, setWeeklyProgress] = useState<DailyProgress[]>([]);
    const [peakHour, setPeakHour] = useState<number | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const storedHabits = getStoredHabits();
        const storedLogs = getStoredProgressLogs();

        setHabits(storedHabits);
        setProgressLogs(storedLogs);

        // Calculate analytics
        if (storedHabits.length > 0) {
            const habitIds = storedHabits.map(h => h.id);

            // Streak
            const streak = calculateStreak(storedLogs, habitIds);
            setCurrentStreak(streak.currentStreak);
            setLongestStreak(streak.longestStreak);

            // Consistency
            const consistency = calculateConsistencyScore(storedLogs, storedHabits, 30);
            setConsistencyScore(consistency);

            // Hourly activity
            const hourly = calculateHourlyActivity(storedLogs);
            setHourlyActivity(hourly);

            // Peak hour
            const maxHour = hourly.reduce((max, h) => h.count > max.count ? h : max, hourly[0]);
            setPeakHour(maxHour?.count > 0 ? maxHour.hour : null);

            // Weekly progress
            const weekDates = getWeekDates(0);
            const weekly = calculateDailyProgress(weekDates, storedHabits, storedLogs);
            setWeeklyProgress(weekly);
        }
    };

    const getConsistencyMessage = (score: number) => {
        if (score >= 90) return { emoji: '🏆', message: 'Luar biasa! Kamu sangat konsisten!' };
        if (score >= 70) return { emoji: '🔥', message: 'Bagus! Terus pertahankan!' };
        if (score >= 50) return { emoji: '💪', message: 'Lumayan! Masih bisa ditingkatkan.' };
        if (score >= 30) return { emoji: '📈', message: 'Ada progres! Ayo lebih konsisten.' };
        return { emoji: '🌱', message: 'Mulai dari sekarang, step by step!' };
    };

    const consistencyStatus = getConsistencyMessage(consistencyScore);

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
                            <h1>📊 Analytics</h1>
                            <p>Lihat perkembangan dan kebiasaanmu.</p>
                        </header>

                        {habits.length === 0 ? (
                            <div className={`neo-card ${styles.emptyState}`}>
                                <div className={styles.emptyIcon}>📊</div>
                                <h2>Belum Ada Data</h2>
                                <p>Tambahkan habits dan mulai tracking untuk melihat analytics.</p>
                                <a href="/dashboard/habits" className="neo-btn neo-btn-primary mt-lg">
                                    Tambah Habit
                                </a>
                            </div>
                        ) : (
                            <>
                                {/* Stats Overview */}
                                <div className={styles.statsGrid}>
                                    <div className={`neo-card ${styles.statCard} ${styles.streakCard}`}>
                                        <span className={styles.statIcon}>🔥</span>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statValue}>{currentStreak}</span>
                                            <span className={styles.statLabel}>Current Streak</span>
                                        </div>
                                    </div>

                                    <div className={`neo-card ${styles.statCard}`}>
                                        <span className={styles.statIcon}>🏆</span>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statValue}>{longestStreak}</span>
                                            <span className={styles.statLabel}>Longest Streak</span>
                                        </div>
                                    </div>

                                    <div className={`neo-card ${styles.statCard}`}>
                                        <span className={styles.statIcon}>{consistencyStatus.emoji}</span>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statValue}>{consistencyScore}%</span>
                                            <span className={styles.statLabel}>Konsistensi (30 hari)</span>
                                        </div>
                                    </div>

                                    <div className={`neo-card ${styles.statCard}`}>
                                        <span className={styles.statIcon}>⏰</span>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statValue}>
                                                {peakHour !== null ? formatHour(peakHour) : '-'}
                                            </span>
                                            <span className={styles.statLabel}>Jam Paling Aktif</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Consistency Message */}
                                <div className={`neo-card ${styles.messageCard}`}>
                                    <span className={styles.messageEmoji}>{consistencyStatus.emoji}</span>
                                    <p>{consistencyStatus.message}</p>
                                </div>

                                {/* Charts Section */}
                                <div className={styles.chartsGrid}>
                                    {/* Weekly Progress */}
                                    <div className={`neo-card ${styles.chartCard}`}>
                                        <h3>Progress Minggu Ini</h3>
                                        <div className={styles.chartContainer}>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={weeklyProgress}>
                                                    <XAxis
                                                        dataKey="date"
                                                        tickFormatter={(date) => new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                                        stroke="var(--text-muted)"
                                                    />
                                                    <YAxis
                                                        stroke="var(--text-muted)"
                                                        domain={[0, 100]}
                                                        tickFormatter={(value) => `${value}%`}
                                                    />
                                                    <Tooltip
                                                        formatter={(value) => [`${value}%`, 'Completion']}
                                                        labelFormatter={(date) => new Date(String(date)).toLocaleDateString('id-ID')}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="percentage"
                                                        stroke="var(--primary)"
                                                        fill="var(--primary-pale)"
                                                        strokeWidth={3}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Hourly Activity */}
                                    <div className={`neo-card ${styles.chartCard}`}>
                                        <h3>Aktivitas per Jam</h3>
                                        <div className={styles.chartContainer}>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={hourlyActivity.filter(h => h.hour >= 6 && h.hour <= 23)}>
                                                    <XAxis
                                                        dataKey="hour"
                                                        tickFormatter={(hour) => `${hour}`}
                                                        stroke="var(--text-muted)"
                                                    />
                                                    <YAxis stroke="var(--text-muted)" />
                                                    <Tooltip
                                                        formatter={(value) => [value, 'Completions']}
                                                        labelFormatter={(hour) => formatHour(Number(hour))}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        fill="var(--primary)"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Insights */}
                                <div className={`neo-card ${styles.insightsCard}`}>
                                    <h3>💡 Insights & Saran</h3>
                                    <ul className={styles.insightsList}>
                                        {peakHour !== null && (
                                            <li>
                                                Kamu paling aktif di jam <strong>{formatHour(peakHour)}</strong>.
                                                Pertimbangkan untuk menjadwalkan habits penting di waktu ini.
                                            </li>
                                        )}
                                        {consistencyScore < 50 && (
                                            <li>
                                                Konsistensimu masih di bawah 50%. Coba kurangi jumlah habits
                                                dan fokus pada yang paling penting.
                                            </li>
                                        )}
                                        {currentStreak > 0 && currentStreak < longestStreak && (
                                            <li>
                                                Streak terpanjangmu adalah {longestStreak} hari.
                                                Ayo pecahkan rekor itu! 🎯
                                            </li>
                                        )}
                                        {habits.length > 5 && (
                                            <li>
                                                Kamu punya {habits.length} habits. Pastikan semuanya
                                                masih relevan dengan goals-mu.
                                            </li>
                                        )}
                                        {progressLogs.length > 0 && (
                                            <li>
                                                Total {progressLogs.length} habit completions tercatat.
                                                Terus semangat! 💪
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
