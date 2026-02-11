import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log(`LOGIN ATTEMPT: User=${username}`);

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { username },
            include: { team: true },
        });
    } catch (dbError) {
        console.error('DATABASE ERROR during login:', dbError);
        return res.status(500).json({
            error: 'DB_CONNECTION_ERROR',
            details: (dbError as Error).message
        });
    }

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        // Generate Token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role, teamId: user.teamId, group: user.team?.group },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                teamId: user.teamId,
                group: user.team?.group,
            },
        });
    } catch (tokenError) {
        console.error('TOKEN ERROR during login:', tokenError);
        res.status(500).json({
            error: 'TOKEN_GENERATION_ERROR',
            details: (tokenError as Error).message
        });
    }
};
