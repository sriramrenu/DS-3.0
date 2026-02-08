
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Role, teams, users, tracks } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { Users, FileText, Trophy, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [session, setSession] = useState<{ id: string; role: Role; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalParticipants: 0,
    totalSubmissions: 0,
    totalPhases: 4
  });
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
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (session) {
      fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setStats({
            totalTeams: data.totalTeams,
            totalParticipants: data.totalParticipants,
            totalSubmissions: data.totalSubmissions,
            totalPhases: data.totalPhases
          });
        })
        .catch(err => console.error('Failed to fetch stats:', err));
    }
  }, [session]);

  if (loading || !session) return null;

  const statsDisplay = [
    { label: 'Registered Teams', value: stats.totalTeams, icon: Users, color: 'text-blue-500' },
    { label: 'Data Scientists', value: stats.totalParticipants, icon: Activity, color: 'text-green-500' },
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: FileText, color: 'text-amber-500' },
    { label: 'Competition Phases', value: stats.totalPhases, icon: Trophy, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.role} username={session.username} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-headline font-bold">Competition Dashboard</h1>
              <p className="text-muted-foreground">Monitor team progress across all data science tracks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsDisplay.map((stat) => (
                <MagicCard key={stat.label} className="border-white/10 bg-black/40 backdrop-blur-md">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-200">{stat.value}</p>
                    </div>
                  </CardContent>
                </MagicCard>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <MagicCard className="border-white/10 bg-black/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-gray-200">Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                            T{i}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-300">DataTeam {i}</p>
                            <p className="text-xs text-gray-500">Track: {['ML', 'Analytics', 'NLP'][i - 1]}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">2m ago</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </MagicCard>

              <MagicCard className="border-white/10 bg-black/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-gray-200">Top Ranked Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[5, 12, 8].map((teamId, i) => (
                      <div key={teamId} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-gray-500 w-6">#{i + 1}</span>
                          <p className="text-sm font-semibold text-gray-300">DataTeam {teamId}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-400">{(100 - i * 10)} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </MagicCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
