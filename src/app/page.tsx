'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className="neo-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span>🎯</span> Goal Setting & Habit Tracker
          </div>

          <h1 className={styles.title}>
            Wujudkan <span className={styles.highlight}>Mimpi</span>mu
            <br />
            Satu Langkah Setiap Hari
          </h1>

          <p className={styles.subtitle}>
            Ubah impianmu menjadi SMART Goals yang terukur, bangun kebiasaan harian,
            dan lacak progresmu dengan analitik yang powerful.
          </p>

          <div className={styles.cta}>
            <button
              onClick={() => signIn('google')}
              className={`neo-btn neo-btn-primary neo-btn-lg ${styles.ctaButton}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Masuk dengan Google
            </button>

            <a href="#features" className="neo-btn neo-btn-secondary neo-btn-lg">
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.featureCards}>
            <div className={`neo-card ${styles.featureCard} ${styles.card1}`}>
              <span className={styles.cardIcon}>💭</span>
              <h3>Dreams</h3>
              <p>Tulis impianmu</p>
            </div>
            <div className={`neo-card ${styles.featureCard} ${styles.card2}`}>
              <span className={styles.cardIcon}>🎯</span>
              <h3>SMART Goals</h3>
              <p>Goals yang terukur</p>
            </div>
            <div className={`neo-card ${styles.featureCard} ${styles.card3}`}>
              <span className={styles.cardIcon}>📋</span>
              <h3>Daily Habits</h3>
              <p>Kebiasaan harian</p>
            </div>
            <div className={`neo-card ${styles.featureCard} ${styles.card4}`}>
              <span className={styles.cardIcon}>📊</span>
              <h3>Analytics</h3>
              <p>Lacak progresmu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Fitur Unggulan</h2>

        <div className={styles.featuresGrid}>
          <div className={`neo-card ${styles.feature}`}>
            <div className={styles.featureIcon}>💭</div>
            <h3>Dreams Journal</h3>
            <p>
              Tulis impian dan aspirasimu. Dari sini, AI akan membantu
              menyusun goals yang SMART dan actionable.
            </p>
          </div>

          <div className={`neo-card ${styles.feature}`}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>SMART Goals</h3>
            <p>
              Specific, Measurable, Achievable, Relevant, Time-bound.
              Goals yang jelas dan terukur untuk sukses yang nyata.
            </p>
          </div>

          <div className={`neo-card ${styles.feature}`}>
            <div className={styles.featureIcon}>📈</div>
            <h3>OKR System</h3>
            <p>
              Key Results untuk setiap goal. Ketahui kapan goal-mu
              tercapai dengan metrik yang jelas.
            </p>
          </div>

          <div className={`neo-card ${styles.feature}`}>
            <div className={styles.featureIcon}>✅</div>
            <h3>Daily Habits</h3>
            <p>
              To-do list harian yang terstruktur. Setiap kebiasaan
              terhubung dengan goals-mu.
            </p>
          </div>

          <div className={`neo-card ${styles.feature}`}>
            <div className={styles.featureIcon}>🔥</div>
            <h3>Streak Tracking</h3>
            <p>
              Lacak konsistensimu. Jangan putus streak!
              Timestamp tercatat untuk setiap completion.
            </p>
          </div>

          <div className={`neo-card ${styles.feature}`}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Analytics</h3>
            <p>
              Analisis kebiasaanmu. Kapan kamu paling aktif?
              Seberapa konsisten? Saran pengembangan personal.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={`neo-card ${styles.ctaCard}`}>
          <h2>Siap Wujudkan Mimpimu?</h2>
          <p>Gratis. Open Source. Data tersimpan aman.</p>
          <button
            onClick={() => signIn('google')}
            className="neo-btn neo-btn-primary neo-btn-lg"
          >
            Mulai Sekarang — Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>Resolutie</h3>
            <p>Goal Setting & Habit Tracker</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="https://github.com/rifqi-rahman/resolutie" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="#features">Features</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 Resolutie. Open Source under MIT License.</p>
        </div>
      </footer>
    </main>
  );
}
