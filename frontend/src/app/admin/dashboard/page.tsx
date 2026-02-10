
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Role, teams, users, tracks } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { PlayCircle, Settings2, Users, FileText, Trophy, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const [session, setSession] = useState<{ id: string; role: Role; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalParticipants: 0,
    totalSubmissions: 0,
    totalPhases: 4,
    remainingTeams: [] as any[],
    topRankedTeams: [] as any[] // Added this
  });
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<string>("3");
  const [roundEndTime, setRoundEndTime] = useState<string | null>(null);
  const [isSettingTimer, setIsSettingTimer] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
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

  const fetchStats = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3001/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats({
          totalTeams: data.totalTeams,
          totalParticipants: data.totalParticipants,
          totalSubmissions: data.totalSubmissions,
          totalPhases: data.totalPhases,
          remainingTeams: data.remainingTeams || [],
          topRankedTeams: data.topRankedTeams || []
        });
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  };

  const fetchSettings = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3001/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const roundSetting = data.find((s: any) => s.key === 'current_round');
        if (roundSetting) setCurrentRound(parseInt(roundSetting.value));

        const timerSetting = data.find((s: any) => s.key === 'round_end_time');
        if (timerSetting) setRoundEndTime(timerSetting.value);
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  };

  const setRoundTimer = async () => {
    const token = localStorage.getItem('token');
    if (!token || isSettingTimer) return;

    const duration = parseFloat(timerDuration);
    if (isNaN(duration) || duration <= 0) {
      setNotification({
        open: true,
        title: 'Invalid Duration',
        message: 'Please enter a valid duration in hours.',
        type: 'error'
      });
      return;
    }

    setIsSettingTimer(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/set-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ durationHours: duration })
      });

      if (!res.ok) throw new Error('Failed to set timer');

      const data = await res.json();
      setRoundEndTime(data.endTime);
      setNotification({
        open: true,
        title: 'Timer Initiated',
        message: `Competition timer set! Round will end at ${new Date(data.endTime).toLocaleTimeString()}.`,
        type: 'success'
      });
    } catch (err) {
      setNotification({
        open: true,
        title: 'Configuration Error',
        message: 'Failed to broadcast timer settings to participants.',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsSettingTimer(false);
    }
  };

  const stopRoundTimer = async () => {
    const token = localStorage.getItem('token');
    if (!token || isSettingTimer) return;

    setIsSettingTimer(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/stop-timer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to stop timer');

      setRoundEndTime(null);
      setNotification({
        open: true,
        title: 'Timer Stopped',
        message: 'The competition timer has been cleared. Participants will no longer see a countdown.',
        type: 'success'
      });
    } catch (err) {
      setNotification({
        open: true,
        title: 'Error',
        message: 'Failed to stop the competition timer.',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsSettingTimer(false);
    }
  };

  const handleInitiateClick = (round: number) => {
    setSelectedRound(round);
    setIsConfirmOpen(true);
  };

  const executeInitiation = async () => {
    if (selectedRound === null) return;
    const token = localStorage.getItem('token');
    if (!token || isInitiating) return;

    setIsInitiating(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/initiate-round', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ round: selectedRound })
      });

      if (!res.ok) throw new Error('Failed to initiate round');

      setCurrentRound(selectedRound);
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitiating(false);
      setIsConfirmOpen(false);
      setSelectedRound(null);
    }
  };

  useEffect(() => {
    if (session) {
      fetchStats();
      fetchSettings();
      // Polling for "real-time" updates every 10 seconds
      const interval = setInterval(() => {
        fetchStats();
        fetchSettings();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (loading || !session) return null;

  const statsDisplay = [
    { label: 'Registered Teams', value: stats.totalTeams, icon: Users, color: 'text-blue-500' },
    { label: 'Data Scientists', value: stats.totalParticipants, icon: Activity, color: 'text-green-500' },
    { label: 'Round Submissions', value: stats.totalSubmissions, icon: FileText, color: 'text-amber-500' },
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
              <h1 className="text-3xl font-headline font-bold text-blue-500">Competition Dashboard</h1>
              <p className="text-blue-400/80">Monitor team progress across all data science tracks.</p>
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

            {/* Competition Controls */}
            <MagicCard className="border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Competition Controls
                  </CardTitle>
                  <p className="text-xs text-blue-400/60">Switch rounds to update datasets and tasks for all participants.</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Current Round</span>
                  <span className="text-xl font-bold text-white leading-none">{currentRound}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((r) => (
                    <Button
                      key={r}
                      onClick={() => handleInitiateClick(r)}
                      disabled={isInitiating || currentRound === r}
                      variant={currentRound === r ? "default" : "outline"}
                      className={`h-16 flex flex-col gap-1 ${currentRound === r
                        ? "bg-blue-600 hover:bg-blue-600 border-none"
                        : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        }`}
                    >
                      <span className="text-xs opacity-70">Round</span>
                      <span className="text-lg font-bold">{r}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </MagicCard>

            {/* Timer Controls */}
            <MagicCard className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-emerald-400 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    Round Timer
                  </CardTitle>
                  <p className="text-xs text-emerald-400/60">Set the duration for the active round.</p>
                </div>
                {roundEndTime && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-emerald-500/50 font-bold">Ends At</p>
                    <p className="text-lg font-mono font-bold text-emerald-400">{new Date(roundEndTime).toLocaleTimeString()}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 max-w-sm">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(e.target.value)}
                      className="w-full bg-black/40 border border-emerald-500/20 rounded-md px-3 py-2 text-emerald-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <Button
                    onClick={setRoundTimer}
                    disabled={isSettingTimer}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Start Countdown
                  </Button>
                  {roundEndTime && (
                    <Button
                      onClick={stopRoundTimer}
                      disabled={isSettingTimer}
                      variant="outline"
                      className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-300"
                    >
                      Stop Timer
                    </Button>
                  )}
                </div>
              </CardContent>
            </MagicCard>

            <div className="grid md:grid-cols-2 gap-8">
              <MagicCard className="border-white/10 bg-black/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Remaining Teams to Submit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.remainingTeams.length > 0 ? (
                      stats.remainingTeams.map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-3 border border-rose-500/20 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                              {team.team_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-300">{team.team_name}</p>
                              <p className="text-xs text-gray-500">Group: {team.group}</p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-rose-400 px-2 py-1 rounded bg-rose-400/10 border border-rose-400/20">Pending</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <p className="text-emerald-400 font-medium">All teams have submitted!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </MagicCard>

              <MagicCard className="border-white/10 bg-black/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-gray-200">Top Ranked Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topRankedTeams && stats.topRankedTeams.length > 0 ? (
                      stats.topRankedTeams.map((team: any, i: number) => (
                        <div key={team.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-gray-500 w-6">#{i + 1}</span>
                            <p className="text-sm font-semibold text-gray-300">{team.team_name}</p>
                          </div>
                          <span className="text-sm font-bold text-blue-400">
                            {team.scores?.total_score || 0} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No scores recorded yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </MagicCard>
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-black/90 border border-blue-500/30 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-headline font-bold text-blue-400 flex items-center gap-2">
              <PlayCircle className="w-6 h-6" />
              Initiate Round {selectedRound}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will immediately update the participant dashboards with Round {selectedRound} datasets and tasks. This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeInitiation}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Confirm Initiation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Dialog */}
      <AlertDialog open={notification.open} onOpenChange={(open) => setNotification(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-black/90 border border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className={`text-xl font-headline font-bold flex items-center gap-2 ${notification.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              {notification.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {notification.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className={`${notification.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]'} text-white border-none`}>
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
