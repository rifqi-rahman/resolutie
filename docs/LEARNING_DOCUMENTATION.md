# 📚 Dokumentasi Pembelajaran: Google Auth & Cloud Sync
> Catatan implementasi Google Authentication dan Cloud Sync untuk Resolutie App

---

## Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Google OAuth Setup](#1-google-oauth-setup)
3. [NextAuth.js Implementation](#2-nextauthjs-implementation)
4. [Supabase Database Setup](#3-supabase-database-setup)
5. [Cloud Sync Implementation](#4-cloud-sync-implementation)
6. [Vercel Deployment](#5-vercel-deployment)
7. [Istilah Teknis](#istilah-teknis-glossary)
8. [Tips & Best Practices](#tips--best-practices)
9. [Troubleshooting](#troubleshooting-common-issues)
10. [Saran Pengembangan](#saran-pengembangan)

---

## Arsitektur Sistem

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   NextAuth.js    │────▶│  Google OAuth   │
│   (Next.js)     │     │   (JWT Session)  │     │  (GCP Console)  │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Cloud Sync    │────▶│    Supabase      │
│ (cloudStorage)  │     │   (PostgreSQL)   │
└─────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│     Vercel      │
│   (Hosting)     │
└─────────────────┘
```

---

## 1. Google OAuth Setup

### A. Membuat Project di Google Cloud Platform (GCP)

1. **Buka** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create New Project** dengan nama yang sesuai
3. **Enable APIs**:
   - APIs & Services → Library → Search "Google+ API" → Enable

### B. Membuat OAuth Credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
2. **Configure Consent Screen** (jika belum):
   - User Type: External
   - App Name: Nama aplikasi
   - User Support Email: Email kamu
   - Developer Contact: Email kamu
   - Scopes: Add `email`, `profile`, `openid`
3. **Create OAuth Client ID**:
   - Application Type: **Web Application**
   - Authorized JavaScript Origins:
     ```
     http://localhost:3000
     https://yourdomain.vercel.app
     ```
   - Authorized Redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.vercel.app/api/auth/callback/google
     ```
4. **Copy** Client ID dan Client Secret

### C. Environment Variables

Buat file `.env.local` di root project:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here  # Generate: openssl rand -base64 32

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> ⚠️ **PENTING**: Jangan commit `.env.local` ke Git! Tambahkan ke `.gitignore`

---

## 2. NextAuth.js Implementation

### A. Install Dependencies

```bash
npm install next-auth
```

### B. Konfigurasi Auth (`src/lib/auth.ts`)

```typescript
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        // Menambahkan user ID ke session
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
    },
    pages: {
        signIn: '/login',  // Custom login page
        error: '/login',
    },
    session: {
        strategy: 'jwt',  // Menggunakan JWT, bukan database session
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// Extend types untuk TypeScript
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}
```

### C. API Route (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### D. Session Provider (`src/app/layout.tsx`)

```tsx
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </body>
        </html>
    );
}
```

### E. Menggunakan Session di Component

```tsx
'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function LoginButton() {
    const { data: session, status } = useSession();

    if (status === 'loading') return <div>Loading...</div>;
    
    if (session) {
        return (
            <div>
                <p>Welcome, {session.user.name}!</p>
                <p>Email: {session.user.email}</p>
                <button onClick={() => signOut()}>Sign Out</button>
            </div>
        );
    }
    
    return <button onClick={() => signIn('google')}>Sign in with Google</button>;
}
```

---

## 3. Supabase Database Setup

### A. Membuat Project Supabase

1. Buka [supabase.com](https://supabase.com)
2. Create New Project
3. Copy **Project URL** dan **anon public key** dari Settings → API

### B. Membuat Tabel (SQL Editor)

```sql
-- Dreams table
CREATE TABLE IF NOT EXISTS dreams (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    dream_id TEXT,
    title TEXT NOT NULL,
    specific TEXT,
    measurable TEXT,
    achievable TEXT,
    relevant TEXT,
    time_bound TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal_id TEXT,
    title TEXT NOT NULL,
    label TEXT,
    frequency TEXT DEFAULT 'daily',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Logs table
CREATE TABLE IF NOT EXISTS progress_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create security policies
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Policies for dreams
CREATE POLICY "Users can view own dreams" ON dreams FOR SELECT USING (true);
CREATE POLICY "Users can insert own dreams" ON dreams FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own dreams" ON dreams FOR UPDATE USING (true);
CREATE POLICY "Users can delete own dreams" ON dreams FOR DELETE USING (true);

-- Policies for goals
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (true);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (true);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (true);

-- Policies for habits
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (true);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (true);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (true);

-- Policies for progress_logs
CREATE POLICY "Users can view own logs" ON progress_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own logs" ON progress_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own logs" ON progress_logs FOR DELETE USING (true);
```

### C. Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseAnonKey);
};
```

---

## 4. Cloud Sync Implementation

### A. Strategi: Hybrid Storage

```
┌─────────────────────────────────────────────────────────────┐
│                      User Request                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Is User Logged  │
                    │     In?         │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐           ┌────────────────┐
     │     YES        │           │      NO        │
     │ Use Supabase   │           │ Use localStorage│
     │ (Cloud Sync)   │           │ (Local Only)   │
     └────────────────┘           └────────────────┘
```

### B. Cloud Storage Functions (`src/lib/cloudStorage.ts`)

```typescript
import { supabase, isSupabaseConfigured } from './supabase';
import { Dream } from '@/types';

// Fetch from cloud
export async function fetchDreamsFromCloud(userId: string): Promise<Dream[]> {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', userId)  // Filter by user email
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching dreams:', error);
        return [];
    }

    // Map database columns to TypeScript types
    return data.map(d => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        description: d.description || undefined,
        createdAt: new Date(d.created_at),
    }));
}

// Save to cloud
export async function saveDreamToCloud(dream: Dream): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase.from('dreams').upsert({
        id: dream.id,
        user_id: dream.userId,  // Email as user identifier
        title: dream.title,
        description: dream.description || null,
        created_at: dream.createdAt instanceof Date 
            ? dream.createdAt.toISOString() 
            : dream.createdAt,
    });

    if (error) {
        console.error('Error saving dream:', error);
        return false;
    }
    return true;
}
```

### C. Menggunakan di Page Component

```tsx
'use client';
import { useSession } from 'next-auth/react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchDreamsFromCloud, saveDreamToCloud } from '@/lib/cloudStorage';
import { getStoredDreams, addStoredDream } from '@/lib/storage';

export default function DreamsPage() {
    const { data: session } = useSession();
    const [dreams, setDreams] = useState([]);
    
    // Determine if using cloud
    const userId = session?.user?.email || 'local';
    const useCloud = isSupabaseConfigured() && !!session?.user?.email;

    // Load data
    const loadDreams = useCallback(async () => {
        if (useCloud) {
            const cloudDreams = await fetchDreamsFromCloud(userId);
            setDreams(cloudDreams);
        } else {
            setDreams(getStoredDreams());
        }
    }, [useCloud, userId]);

    // Save data
    const handleSubmit = async (newDream) => {
        if (useCloud) {
            await saveDreamToCloud(newDream);
        }
        addStoredDream(newDream);  // Also save locally as backup
        await loadDreams();
    };
}
```

---

## 5. Vercel Deployment

### A. Connect GitHub Repository

1. Push code ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import Git Repository
4. Select framework: **Next.js**

### B. Configure Environment Variables

Di Vercel Dashboard → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | (dari GCP Console) |
| `GOOGLE_CLIENT_SECRET` | (dari GCP Console) |
| `NEXTAUTH_URL` | `https://yourapp.vercel.app` |
| `NEXTAUTH_SECRET` | (random string) |
| `NEXT_PUBLIC_SUPABASE_URL` | (dari Supabase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (dari Supabase) |

### C. Update Google OAuth Settings

Tambahkan production URL di GCP Console:
- **Authorized JavaScript Origins**: `https://yourapp.vercel.app`
- **Authorized Redirect URIs**: `https://yourapp.vercel.app/api/auth/callback/google`

### D. Deploy

```bash
git add .
git commit -m "feat: add cloud sync with Supabase"
git push origin main
```

Vercel akan auto-deploy dari `main` branch.

---

## Istilah Teknis (Glossary)

| Istilah | Penjelasan |
|---------|------------|
| **OAuth 2.0** | Protokol autentikasi yang memungkinkan login tanpa memberikan password ke third party |
| **JWT (JSON Web Token)** | Token terenkripsi yang menyimpan informasi session user |
| **Session** | Data yang menyimpan status login user |
| **Callback URL** | URL yang dipanggil setelah user berhasil login di Google |
| **Client ID/Secret** | Kredensial untuk mengidentifikasi aplikasi ke Google |
| **RLS (Row Level Security)** | Fitur Supabase untuk membatasi akses data per user |
| **Upsert** | Kombinasi INSERT + UPDATE - insert jika belum ada, update jika sudah |
| **CRUD** | Create, Read, Update, Delete - operasi dasar database |
| **Environment Variables** | Variabel konfigurasi yang disimpan di luar code |
| **snake_case** | Konvensi penamaan dengan underscore (Supabase/PostgreSQL) |
| **camelCase** | Konvensi penamaan dengan huruf kapital (JavaScript/TypeScript) |
| **Hybrid Storage** | Strategi menyimpan data di local dan cloud secara bersamaan |
| **Anon Key** | Public key Supabase untuk client-side access |

---

## Tips & Best Practices

### 🔐 Security

1. **Jangan commit `.env.local`** ke Git
2. **Gunakan RLS di production** - semua data seharusnya hanya bisa diakses oleh pemiliknya
3. **Validasi input** di client dan server
4. **Gunakan HTTPS** di production (Vercel handles this)

### 💾 Database Design

1. **Gunakan `TEXT` untuk ID** jika ID di-generate di client (bukan UUID dari Supabase)
2. **Gunakan `email` sebagai user identifier** - konsisten di semua device
3. **Simpan waktu dalam ISO format** (`toISOString()`)
4. **Column naming**: snake_case di database, camelCase di TypeScript

### 🔄 Cloud Sync

1. **Always save locally too** - sebagai backup jika cloud gagal
2. **Add logging** saat development untuk debug
3. **Handle errors gracefully** - jangan crash jika cloud gagal
4. **Use `useCallback`** untuk mencegah infinite re-render

### 🚀 Performance

1. **Fetch data sekali** saat page load, bukan setiap render
2. **Use parallel requests** dengan `Promise.all()`
3. **Keep RLS enabled** - filtering dilakukan di code dengan `.eq('user_id', email)`

---

## Troubleshooting Common Issues

### Error: "invalid input syntax for type uuid"

**Penyebab**: Kolom di Supabase bertipe `uuid`, tapi kita kirim `text`

**Solusi**:
```sql
ALTER TABLE tablename ALTER COLUMN columnname TYPE text;
```

### Error: "cannot alter type of a column used in a policy definition"

**Penyebab**: Ada RLS Policy yang menggunakan kolom tersebut

**Solusi**: Drop policy dulu, baru alter column
```sql
DROP POLICY IF EXISTS "policy_name" ON tablename;
ALTER TABLE tablename ALTER COLUMN columnname TYPE text;
```

### Error: "foreign key constraint cannot be implemented"

**Penyebab**: Ada foreign key yang tipe datanya tidak cocok

**Solusi**: Drop foreign key dulu
```sql
ALTER TABLE tablename DROP CONSTRAINT IF EXISTS constraint_name;
```

### Data tidak sync antar device

**Penyebab**: 
1. `user_id` berbeda di tiap device
2. RLS memblokir access

**Solusi**:
1. Gunakan `email` (bukan `session.user.id`) sebagai identifier
2. Disable RLS sementara untuk testing

---

## Saran Pengembangan

### 🔜 Short-term Improvements

1. **Implement Supabase Auth** untuk keamanan RLS lebih kuat
   - Gunakan Supabase Auth bersama NextAuth
   - RLS Policy bisa pakai `auth.uid()` langsung

2. **Sync localStorage ke Cloud** saat user login pertama kali

3. **Offline Support** - save ke localStorage dulu, sync ke cloud saat online

### 🚀 Long-term Features

1. **Real-time Sync** dengan Supabase Realtime
2. **Conflict Resolution** jika data berubah di multiple device
3. **Data Export/Import**
4. **Multi-user/Team Features**
5. **Push Notifications** untuk habit reminders

### 📱 Mobile App

Jika ingin buat mobile app:
- **React Native** dengan Expo
- Gunakan Supabase SDK yang sama
- Share types dan utilities

---

## Quick Reference

### File Structure
```
src/
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── supabase.ts      # Supabase client
│   ├── cloudStorage.ts  # Cloud CRUD operations
│   └── storage.ts       # localStorage operations
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts     # Auth API endpoint
│   └── dashboard/
│       └── dreams/page.tsx
└── types/
    └── index.ts         # TypeScript types
```

### Environment Variables Checklist
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

*Dokumentasi ini dibuat pada: 7 Februari 2026*
*Project: Resolutie - Goal Setting & Habit Tracker*
