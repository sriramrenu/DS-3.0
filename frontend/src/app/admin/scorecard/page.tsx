
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
      // Parallel requests
      await Promise.all(scores.map(s =>
        fetch('http://localhost:3001/api/admin/score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            teamId: s.team_id,
            round: 1,
            score: s.phase1_score
          })
        }).then(() =>
          fetch('http://localhost:3001/api/admin/score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              teamId: s.team_id,
              round: 2,
              score: s.phase2_score
            })
          })
        ).then(() =>
          fetch('http://localhost:3001/api/admin/score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              teamId: s.team_id,
              round: 3,
              score: s.phase3_score
            })
          })
        ).then(() =>
          fetch('http://localhost:3001/api/admin/score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              teamId: s.team_id,
              round: 4,
              score: s.phase4_score
            })
          })
        )
      ));

      toast({
        title: "Scores Saved",
        description: "Team rankings have been updated successfully.",
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
                <h1 className="text-3xl font-headline font-bold">Phase Scoring</h1>
                <p className="text-muted-foreground">Manage scores for each competition phase.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setScores(initialScores)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={saveScores}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>

            <MagicCard className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border-white/10 overflow-hidden text-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold w-[250px] text-white">Team</TableHead>
                    <TableHead className="font-bold text-center text-white">Data Ingestion</TableHead>
                    <TableHead className="font-bold text-center text-white">Data Cleaning</TableHead>
                    <TableHead className="font-bold text-center text-white">Model Building</TableHead>
                    <TableHead className="font-bold text-center text-white">Prediction</TableHead>
                    <TableHead className="font-bold text-right text-white">Total Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score) => {
                    const team = teams.find(t => t.id === score.team_id);
                    return (
                      <TableRow key={score.team_id}>
                        <TableCell className="font-medium text-white">{team?.team_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center text-white border-white/20"
                            value={score.phase1_score}
                            onChange={(e) => updateScore(score.team_id, 1, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center text-white border-white/20"
                            value={score.phase2_score}
                            onChange={(e) => updateScore(score.team_id, 2, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center text-white border-white/20"
                            value={score.phase3_score}
                            onChange={(e) => updateScore(score.team_id, 3, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center text-white border-white/20"
                            value={score.phase4_score}
                            onChange={(e) => updateScore(score.team_id, 4, e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-white text-lg pr-8">
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
