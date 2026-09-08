import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';
import { hasSupabaseEnv } from '@/lib/env';
import { supabaseServer } from '@/lib/supabase/server';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Staff sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  if (hasSupabaseEnv()) {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(next && next.startsWith('/') ? next : '/hub');
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-9 text-center">
          <Wordmark tone="cream" size="lg" withTagline />
        </div>

        <Suspense fallback={null}>
          <LoginForm next={next && next.startsWith('/') ? next : undefined} />
        </Suspense>

        <p className="mt-8 text-center text-xs text-cream/35">
          <Link href="/" className="underline underline-offset-4 hover:text-cream/70">
            Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
