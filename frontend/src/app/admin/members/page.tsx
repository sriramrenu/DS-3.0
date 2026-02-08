
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Role, teams, users, tracks } from '@/lib/mock-db';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MagicCard } from '@/components/ui/magic-card';

export default function AdminMembers() {
  const [session, setSession] = useState<{ id: string; role: Role; username: string } | null>(null);
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

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.role} username={session.username} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-headline font-bold">Members & Teams</h1>

            <MagicCard className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border-white/10 overflow-hidden text-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-white">Username</TableHead>
                    <TableHead className="font-bold text-white">Team Name</TableHead>
                    <TableHead className="font-bold text-white">Track</TableHead>
                    <TableHead className="font-bold text-white">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const team = teams.find(t => t.id === user.team_id);
                    const track = tracks.find(tr => tr.id === team?.track_id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-white">{user.username}</TableCell>
                        <TableCell className="text-white">{team?.team_name || 'N/A'}</TableCell>
                        <TableCell>
                          {track ? (
                            <Badge variant="outline" className="border-primary text-primary">
                              {track.track_name}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
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
