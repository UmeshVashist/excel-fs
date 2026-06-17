'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardClient } from '@/app/dashboard/dashboard-client';
import { useState } from 'react';

export default function FingerprintDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    formulas: 0,
    shortcuts: 0,
    notes: 0,
    urls: 0,
    todos: 0,
  });
  const [userId, setUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndCounts = async () => {
      try {
        // Get current user from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/fingerprint/login');
          return;
        }

        setUserId(user.id);

        // Fetch counts for all categories
        const [formulasRes, shortcutsRes, notesRes, urlsRes, todosRes] = await Promise.all([
          supabase
            .from('formulas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('shortcuts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('urls')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('todos')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        setCounts({
          formulas: formulasRes.count || 0,
          shortcuts: shortcutsRes.count || 0,
          notes: notesRes.count || 0,
          urls: urlsRes.count || 0,
          todos: todosRes.count || 0,
        });

        setLoading(false);
      } catch (err) {
        console.error('[v0] Error fetching dashboard data:', err);
        setError('Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchUserAndCounts();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/fingerprint/login')}
            className="text-blue-400 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardClient
        initialFormulasCount={counts.formulas}
        initialShortcutsCount={counts.shortcuts}
        initialNotesCount={counts.notes}
        initialUrlsCount={counts.urls}
        initialTodosCount={counts.todos}
        userId={userId}
      />
    </div>
  );
}
