
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Role, teams, Score, initialScores, tracks } from '@/lib/mock-db';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MagicCard } from '@/components/ui/magic-card';

export default function AdminLeaderboard() {
  const [session, setSession] = useState<{ id: string; role: Role; username: string } | null>(null);
  const [scores, setScores] = useState<Score[]>(initialScores);
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

    // Fetch scores from API
    fetch('http://localhost:3001/api/admin/scores', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        // Transform data: Backend returns Teams with scores
        const mapped: Score[] = data.map((t: any) => ({
          team_id: t.id,
          team_name: t.team_name,
          phase1_score: t.scores?.phase1_score || 0,
          phase2_score: t.scores?.phase2_score || 0,
          phase3_score: t.scores?.phase3_score || 0,
          phase4_score: t.scores?.phase4_score || 0,
          total_score: t.scores?.total_score || 0
        }));
        setScores(mapped);
      })
      .catch(err => console.error('Failed to load scores:', err));
  }, [router]);

  if (!session) return null;

  // Sort by total score descending
  const sortedScores = [...scores].sort((a, b) => b.total_score - a.total_score);

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <Navbar role={session.role} username={session.username} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-accent text-accent-foreground shadow-lg">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold">Leaderboard</h1>
                <p className="text-muted-foreground">Global rankings based on cumulative phase scores across all tracks.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {sortedScores.slice(0, 3).map((score, i) => {
                const team = teams.find(t => t.id === score.team_id);
                const colors = [
                  'border-green-400 bg-green-900/20',
                  'border-green-600 bg-green-900/10',
                  'border-green-800 bg-green-900/5'
                ];
                const medalColors = [
                  'text-green-400',
                  'text-green-500',
                  'text-green-600'
                ];
                return (
                  <div key={score.team_id} className={cn("p-6 rounded-2xl border-2 flex flex-col items-center gap-3 text-center shadow-sm", colors[i])}>
                    <Medal className={cn("w-12 h-12", medalColors[i])} />
                    <div>
                      <p className="text-xs uppercase font-black tracking-widest text-muted-foreground">Rank {i + 1}</p>
                      <p className="font-bold text-lg leading-tight text-white">{team?.team_name}</p>
                    </div>
                    <p className="text-2xl font-black text-white">{score.total_score}</p>
                  </div>
                );
              })}
            </div>

            <MagicCard className="bg-black/40 backdrop-blur-md rounded-2xl shadow-xl border-white/10 overflow-hidden text-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-none">
                    <TableHead className="font-bold pl-8 text-black">Rank</TableHead>
                    <TableHead className="font-bold text-black">Team Name</TableHead>
                    <TableHead className="font-bold text-black">Track</TableHead>
                    <TableHead className="font-bold text-right pr-8 text-black">Total Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScores.map((score, index) => {
                    const team = teams.find(t => t.id === score.team_id);
                    const track = tracks.find(tr => tr.id === team?.track_id);
                    const medalColors = [ // Redefine medalColors for this scope
                      'text-green-400',
                      'text-green-500',
                      'text-green-600'
                    ];
                    return (
                      <TableRow key={score.team_id} className={cn(index < 3 && "bg-muted/30")}>
                        <TableCell className="font-medium pl-8 text-white">{index + 1}</TableCell>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{team?.team_name}</span>
                            {index < 3 && <Medal className={`w-4 h-4 ${medalColors[index]}`} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{track?.track_name}</TableCell>
                        <TableCell className="text-right font-bold text-lg pr-8 text-white">
                          {score.total_score}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </MagicCard>
          </div>
        </main>
      </div>
    </div>
  );
}
