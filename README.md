# Resolutie

> Goal Setting & Habit Tracker dengan SMART Goals, OKR, dan Neo-brutalism Design.

![Resolutie Banner](https://img.shields.io/badge/Resolutie-Goal_Tracker-0099FF?style=for-the-badge&labelColor=1A1A1A)

## 🎯 Tentang

**Resolutie** adalah aplikasi web untuk membantu kamu:
- Menulis impian dan aspirasimu
- Menyusun goals yang SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Membuat Key Results (OKR) untuk mengukur kesuksesan
- Melacak habits harian dengan streak tracking
- Menganalisis kebiasaan dengan analytics dashboard

## ✨ Fitur

- 💭 **Dreams Journal** - Tulis impianmu
- 🎯 **SMART Goals** - Goals yang terstruktur dan terukur
- 📈 **OKR System** - Key Results untuk setiap goal
- ✅ **Daily Habits** - To-do list harian dengan label
- 🔥 **Streak Tracking** - Lacak konsistensimu
- 📊 **Analytics** - Visualisasi progres dan insights
- 🌙 **Dark Mode** - Tema gelap yang nyaman di mata
- 🔐 **Google Login** - Autentikasi dengan Gmail

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Neo-brutalism)
- **Auth**: NextAuth.js + Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **AI**: OpenAI API (user's key)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm atau yarn
- Akun Supabase (gratis)
- Google Cloud Console (untuk OAuth)

### Installation

1. Clone repository
```bash
git clone https://github.com/rifqi-rahman/resolutie.git
cd resolutie
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env.local
```

4. Isi environment variables:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Jalankan development server
```bash
npm run dev
```

6. Buka [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

Deploy dengan Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rifqi-rahman/resolutie)

## 🎨 Design System

Resolutie menggunakan **Neo-brutalism** design dengan:
- Primary Color: `#0099FF`
- Bold borders dan shadows
- Sharp corners (no border-radius)
- High contrast colors
- Playful typography

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ by [Rifqi Rahman](https://github.com/rifqi-rahman)
