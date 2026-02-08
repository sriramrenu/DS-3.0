
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Role, teams, tracks } from '@/lib/mock-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagicCard } from '@/components/ui/magic-card';
import Image from 'next/image';

export default function AdminSubmissions() {
  const [session, setSession] = useState<{ id: string; role: Role; username: string } | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('tt_session');
    if (!raw) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed.role !== 'Admin') {
      router.push('/login');
      return;
    }
    setSession(parsed);
  }, [router]);

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetch('http://localhost:3001/api/admin/submissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('Submissions loaded:', data);
          setSubmissions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load submissions:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session]);

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.role} username={session.username} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-headline font-bold">Submissions</h1>

            {loading && <p className="text-gray-400">Loading submissions...</p>}
            {error && <p className="text-red-400">Error: {error}</p>}
            {!loading && !error && submissions.length === 0 && (
              <p className="text-gray-400">No submissions yet. Waiting for participants to submit their work.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((sub, i) => {
                const teamName = sub.team?.team_name || 'Unknown Team';
                const trackId = sub.team?.track_id;
                const trackName = tracks.find(tr => tr.id === trackId)?.track_name || 'General';
                const time = new Date(sub.submittedAt).toLocaleTimeString();

                return (
                  <MagicCard key={sub.id} className="overflow-hidden group border-white/10 bg-black/40 backdrop-blur-md text-white">
                    <div className="relative h-48 w-full bg-muted">
                      {sub.imageUrl ? (
                        <Image
                          src={sub.imageUrl}
                          alt="Submission"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          data-ai-hint="team submission"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg text-white">{teamName}</p>
                          <p className="text-xs text-muted-foreground">Submitted at {time}</p>
                        </div>
                        <Badge>{trackName}</Badge>
                      </div>
                      <div className="p-2 rounded bg-muted flex items-center justify-between">
                        <span className="text-sm text-white uppercase font-bold text-[10px] tracking-widest">Answer</span>
                        <span className="font-mono font-bold text-white">{sub.numericAnswer || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </MagicCard>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
