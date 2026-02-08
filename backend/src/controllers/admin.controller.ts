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
