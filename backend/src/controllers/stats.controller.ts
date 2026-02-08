import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Get counts
        const totalTeams = await prisma.team.count();
        const totalParticipants = await prisma.user.count({
            where: { role: 'Participant' }
        });
        const totalSubmissions = await prisma.submission.count();

        // Get recent submissions
        const recentSubmissions = await prisma.submission.findMany({
            take: 5,
            orderBy: { submittedAt: 'desc' },
            include: {
                team: true
            }
        });

        res.json({
            totalTeams,
            totalParticipants,
            totalSubmissions,
            totalPhases: 4, // Static for now
            recentSubmissions
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error });
    }
};
