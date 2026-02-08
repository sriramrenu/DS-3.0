"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { Database, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store Token & User
      localStorage.setItem('token', data.token);
      localStorage.setItem('tt_session', JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        role: data.user.role
      }));

      if (data.user.role === 'Admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/participant/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/assets/logo.png"
              alt="DataSprint 3.0 Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-headline font-bold text-[#4ade80]">DATASPRINT 3.0</h1>
          <p className="text-muted-foreground">Gather → Transform → Build → Predict</p>
        </div>

        <MagicCard className="shadow-2xl border-none ring-1 ring-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access the command center.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#4ade80]">Username</Label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                  <Input
                    id="username"
                    placeholder="Enter username"
                    className="pl-9 bg-black/20 border-white/10 focus:border-green-500/50 transition-all duration-300"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#4ade80]">Password</Label>
                <div className="relative group">
                  <Database className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 bg-black/20 border-white/10 focus:border-green-500/50 transition-all duration-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-green-400 font-medium animate-pulse">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)]"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </MagicCard>
      </div>
    </div>
  );
}
