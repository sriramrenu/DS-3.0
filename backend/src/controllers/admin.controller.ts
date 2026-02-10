import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all submissions
export const getSubmissions = async (req: Request, res: Response) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                team: {
                    include: {
                        scores: true,
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions', details: error });
    }
};

// Get all scores (teams)
export const getScores = async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                scores: true,
            },
            orderBy: {
                team_name: 'asc',
            },
        });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scores', details: error });
    }
};

// Update Team Score
export const updateScore = async (req: Request, res: Response) => {
    const { teamId, round, score } = req.body;

    if (!teamId || !round || score === undefined) {
        return res.status(400).json({ error: 'Missing teamId, round, or score' });
    }

    try {
        // 1. Fetch current score
        const currentScore = await prisma.score.findUnique({
            where: { teamId },
        });

        if (!currentScore) {
            // Create if not exists (should exist from seeding, but safety first)
            await prisma.score.create({ data: { teamId } }); // Then rely on update? No, just create basic.
            // Actually better to error or create properly. Seed guarantees it.
        }

        // 2. Determine field to update
        const data: any = {};
        if (round === 1) data.phase1_score = score;
        else if (round === 2) data.phase2_score = score;
        else if (round === 3) data.phase3_score = score;
        else if (round === 4) data.phase4_score = score;
        else return res.status(400).json({ error: 'Invalid round (1-4)' });

        // 3. Update and Recalculate Total
        // We need to pass the *other* scores too to calculate total, 
        // OR rely on a second query, or just use atomic logic? 
        // Prisma doesn't have computed columns easily in update.
        // Simplest: Update specific phase, then fetch and update total? 
        // OR: Calculate in application.

        // Let's fetch first (we did).
        const p1 = round === 1 ? score : (currentScore?.phase1_score || 0);
        const p2 = round === 2 ? score : (currentScore?.phase2_score || 0);
        const p3 = round === 3 ? score : (currentScore?.phase3_score || 0);
        const p4 = round === 4 ? score : (currentScore?.phase4_score || 0);
        const total = p1 + p2 + p3 + p4;

        data.total_score = total;

        const updated = await prisma.score.upsert({
            where: { teamId },
            update: data,
            create: {
                teamId,
                ...data
            },
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update score', details: error });
    }
};

// Update multiple team scores at once
export const updateBatchScores = async (req: Request, res: Response) => {
    const { updates } = req.body; // Array of { teamId, p1, p2, p3, p4 }

    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: 'Missing or invalid updates array' });
    }

    try {
        const results = await Promise.all(updates.map(async (u: any) => {
            const { teamId, p1, p2, p3, p4 } = u;
            const total = (p1 || 0) + (p2 || 0) + (p3 || 0) + (p4 || 0);

            return prisma.score.upsert({
                where: { teamId },
                update: {
                    phase1_score: p1,
                    phase2_score: p2,
                    phase3_score: p3,
                    phase4_score: p4,
                    total_score: total
                },
                create: {
                    teamId,
                    phase1_score: p1,
                    phase2_score: p2,
                    phase3_score: p3,
                    phase4_score: p4,
                    total_score: total
                }
            });
        }));

        res.json({ success: true, count: results.length });
    } catch (error) {
        console.error('Batch update failed:', error);
        res.status(500).json({ error: 'Failed to update batch scores', details: error });
    }
};

// Get all members (participants)
export const getMembers = async (req: Request, res: Response) => {
    try {
        console.log('Fetching members...');
        const members = await prisma.user.findMany({
            where: { role: 'Participant' },
            include: {
                team: true
            },
            orderBy: {
                username: 'asc'
            }
        });
        console.log(`Found ${members.length} members.`);
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members', details: error });
    }
};
// Get Current Round
export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Initiate Round
export const initiateRound = async (req: Request, res: Response) => {
    const { round } = req.body;
    if (!round) return res.status(400).json({ error: 'Missing round number' });

    try {
        const updated = await prisma.systemSetting.upsert({
            where: { key: 'current_round' },
            update: { value: round.toString() },
            create: { key: 'current_round', value: round.toString() },
        });

        res.json({ message: `Round ${round} initiated successfully`, setting: updated });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initiate round', details: error });
    }
};

export const setRoundTimer = async (req: Request, res: Response) => {
    const { durationHours } = req.body; // Duration in hours
    if (durationHours === undefined) return res.status(400).json({ error: 'Missing duration' });

    try {
        const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

        const updated = await prisma.systemSetting.upsert({
            where: { key: 'round_end_time' },
            update: { value: endTime },
            create: { key: 'round_end_time', value: endTime },
        });

        res.json({ message: 'Timer set successfully', endTime: updated.value });
    } catch (error) {
        res.status(500).json({ error: 'Failed to set timer', details: error });
    }
};

export const stopRoundTimer = async (req: Request, res: Response) => {
    try {
        await prisma.systemSetting.delete({
            where: { key: 'round_end_time' },
        });

        res.json({ message: 'Timer stopped successfully' });
    } catch (error) {
        // If it doesn't exist, we can just say it's stopped/cleared
        res.json({ message: 'Timer cleared or already stopped' });
    }
};
