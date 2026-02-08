
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
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      const token = localStorage.getItem('token');
      fetch('http://localhost:3001/api/admin/members', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setMembers(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch members:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (!session || loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.role} username={session.username} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-headline font-bold text-blue-500">Members & Teams</h1>

            <MagicCard className="bg-black/40 backdrop-blur-md rounded-lg shadow-sm border-white/10 overflow-hidden text-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-white">Username</TableHead>
                    <TableHead className="font-bold text-white">Team Name</TableHead>
                    <TableHead className="font-bold text-white uppercase tracking-wider">Troops</TableHead>
                    <TableHead className="font-bold text-white">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const troop = member.team?.group || 'Unassigned';
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-blue-400">{member.username}</TableCell>
                        <TableCell className="text-blue-400 font-medium">{member.team?.team_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-400 text-blue-400 font-bold">
                            {troop}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {member.role}
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
