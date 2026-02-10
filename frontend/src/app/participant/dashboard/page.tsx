"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, CheckCircle2, AlertCircle, FileImage } from 'lucide-react';

export default function ParticipantDashboard() {
  const [session, setSession] = useState<{ id: string; role: string; team_id: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numericAnswer, setNumericAnswer] = useState('');
  const [datasetUrl, setDatasetUrl] = useState('');
  const [taskDesc, setTaskDesc] = useState('Loading task...');
  const [roundTitle, setRoundTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // seconds

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('tt_session');
    const token = localStorage.getItem('token');

    if (!raw || !token) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed.role !== 'Participant') {
      router.push('/login');
      return;
    }
    setSession(parsed);
    setLoading(false);

    // Fetch Dashboard Data
    fetch('http://localhost:3001/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.datasetUrl) {
          setDatasetUrl(data.datasetUrl);
        }
        setRoundTitle(data.title || `Round ${data.round}`);
        setTaskDesc(data.description || 'Download your dataset below.');
        setQuestions(data.questions || []);
        setEndTime(data.endTime);

        // Initialize answers
        if (data.questions) {
          const initialAnswers: Record<string, string> = {};
          data.questions.forEach((q: any) => initialAnswers[q.id] = '');
          setAnswers(initialAnswers);
        }
      })
      .catch(err => console.error(err));
  }, [router]);

  useEffect(() => {
    if (!endTime) return;

    const calculateTime = () => {
      const remaining = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isSubmissionEnabled = timeRemaining !== null && timeRemaining <= 1800; // 30 mins

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('numericAnswer', numericAnswer);

      const res = await fetch('http://localhost:3001/api/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Submission failed');

      setSubmitted(true);
      setSelectedFile(null);
      setNumericAnswer('');
    } catch (e) {
      alert('Submission failed! Check console.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={session.role} username={session.username} />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-headline font-bold text-white">{roundTitle}</h1>
            <p className="text-muted-foreground">{taskDesc}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <MagicCard className="border-t-4 border-t-blue-500 bg-black/40 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Download className="w-5 h-5 text-blue-400" />
                  Dataset & Resources
                </CardTitle>
                <CardDescription className="text-gray-400">Download your track-specific dataset.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-300">Target Dataset</p>
                    <p className="text-xs text-gray-500">Source: Supabase • .csv/.zip</p>
                  </div>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-none" disabled={!datasetUrl}>
                    <a href={datasetUrl || '#'} target="_blank" rel="noopener noreferrer">
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </MagicCard>

            <MagicCard className="border-t-4 border-t-emerald-500 bg-black/40 backdrop-blur-md text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Submit Work
                </CardTitle>
                <CardDescription className="text-gray-400">Submit your team results here.</CardDescription>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-gray-500 font-bold">Time Remaining</span>
                  <span className={`text-2xl font-mono font-bold ${timeRemaining !== null && timeRemaining <= 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                    {timeRemaining !== null ? formatTime(timeRemaining) : '--:--:--'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isSubmissionEnabled && timeRemaining !== null && (
                  <div className="p-3 border border-amber-500/20 rounded-lg bg-amber-500/5 flex items-center gap-3 text-amber-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    Submissions will enable automatically in the last 30 minutes of the round.
                  </div>
                )}
                {submitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <h3 className="font-bold text-white">Submission Received!</h3>
                    <p className="text-sm text-emerald-300">Your work has been successfully uploaded to the database.</p>
                    <Button variant="outline" size="sm" onClick={() => setSubmitted(false)} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">Submit another</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <Label htmlFor={q.id} className="text-gray-300">{q.label}</Label>
                        <Input
                          id={q.id}
                          type={q.type}
                          step="0.01"
                          placeholder={q.placeholder}
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="bg-black/20 border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-emerald-500/50"
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label className="text-gray-300">Results Visualization (Image)</Label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:bg-white/5 hover:border-emerald-500/30 transition-all group"
                      >
                        {selectedFile ? (
                          <div className="space-y-2">
                            <FileImage className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-sm font-medium truncate max-w-xs mx-auto text-gray-300">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">Click to change file</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-600 group-hover:text-emerald-400 transition-colors mx-auto mb-2" />
                            <p className="text-xs text-gray-500 group-hover:text-gray-400">Drop your image here or click to browse</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="file"
                          name="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          required={!selectedFile}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting || !selectedFile || !isSubmissionEnabled}
                      className={`w-full h-12 text-lg font-headline font-bold transition-all duration-300 ${isSubmissionEnabled ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'}`}
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        isSubmissionEnabled ? "Submit Entry" : "Locked Until Final 30 Mins"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </MagicCard>
          </div>
        </div>
      </main>
    </div>
  );
}
