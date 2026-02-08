
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Role, teams, Score, initialScores } from '@/lib/mock-db';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MagicCard } from '@/components/ui/magic-card';

export default function AdminScoreCard() {
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
          team_name: t.team_name, // Add logic to handle helper if needed
          phase1_score: t.scores?.phase1_score || 0,
          phase2_score: t.scores?.phase2_score || 0,
          phase3_score: t.scores?.phase3_score || 0,
          phase4_score: t.scores?.phase4_score || 0,
          total_score: t.scores?.total_score || 0
        }));
        setScores(mapped);
      })
      .catch(err => console.error(err));
  }, [router]);

  const updateScore = (teamId: string, round: number, value: string) => {
    const num = parseFloat(value) || 0;
    setScores(prev => prev.map(s => {
      if (s.team_id === teamId) {
        const updated = { ...s };
        if (round === 1) updated.phase1_score = num;
        if (round === 2) updated.phase2_score = num;
        if (round === 3) updated.phase3_score = num;
        if (round === 4) updated.phase4_score = num;
        updated.total_score = updated.phase1_score + updated.phase2_score + updated.phase3_score + updated.phase4_score;
        return updated;
      }
      return s;
    }));
  };

  const saveScores = async () => {
    try {
      const updates = scores.map(s => ({
        teamId: s.team_id,
        p1: s.phase1_score,
        p2: s.phase2_score,
        p3: s.phase3_score,
        p4: s.phase4_score
      }));

      const res = await fetch('http://localhost:3001/api/admin/scores/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ updates })
      });

      if (!res.ok) throw new Error("Failed to save scores");

      toast({
        title: "Scores Saved",
        description: "All team rankings have been updated successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save scores", variant: "destructive" });
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.role} username={session.username} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-headline font-bold text-green-500">Phase Scoring</h1>
                <p className="text-green-400/60">Manage scores for each competition phase.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={saveScores}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>

            <MagicCard className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border-white/10 overflow-hidden text-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-500/5 hover:bg-transparent border-white/10">
                    <TableHead className="font-bold w-[250px] text-green-400">Team</TableHead>
                    <TableHead className="font-bold text-center text-green-400">Data Ingestion</TableHead>
                    <TableHead className="font-bold text-center text-green-400">Data Cleaning</TableHead>
                    <TableHead className="font-bold text-center text-green-400">Model Building</TableHead>
                    <TableHead className="font-bold text-center text-green-400">Prediction</TableHead>
                    <TableHead className="font-bold text-right text-green-400">Total Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score) => (
                    <TableRow key={score.team_id} className="border-white/5">
                      <TableCell className="font-medium text-green-400/90">{score.team_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center text-green-400 bg-green-500/5 border-green-500/20 focus:border-green-500/50"
                          value={score.phase1_score}
                          onChange={(e) => updateScore(score.team_id, 1, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center text-green-400 bg-green-500/5 border-green-500/20 focus:border-green-500/50"
                          value={score.phase2_score}
                          onChange={(e) => updateScore(score.team_id, 2, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center text-green-400 bg-green-500/5 border-green-500/20 focus:border-green-500/50"
                          value={score.phase3_score}
                          onChange={(e) => updateScore(score.team_id, 3, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center text-green-400 bg-green-500/5 border-green-500/20 focus:border-green-500/50"
                          value={score.phase4_score}
                          onChange={(e) => updateScore(score.team_id, 4, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-500 text-lg pr-8">
                        {score.total_score}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </MagicCard>
          </div>
        </main>
      </div>
    </div>
  );
}
