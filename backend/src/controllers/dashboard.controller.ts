import { Request, Response } from 'express';
import { PrismaClient, Group } from '@prisma/client';
import { supabase } from '../lib/supabase';

const prisma = new PrismaClient();

export const getDashboardData = async (req: Request, res: Response) => {
    // @ts-ignore
    const { group } = req.user; // User encoded from JWT middleware

    try {
        // 1. Fetch Current Round from DB
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'current_round' }
        });
        const currentRound = setting ? parseInt(setting.value) : 1;

        // 2. Fetch Round Content
        const roundContent = await prisma.roundContent.findUnique({
            where: { id: currentRound }
        });

        if (!roundContent) {
            return res.status(404).json({ error: 'Round content not found' });
        }

        // 3. Fetch Timer Setting
        const timerSetting = await prisma.systemSetting.findUnique({
            where: { key: 'round_end_time' }
        });

        // 4. Dataset Logic
        const datasetName = `${roundContent.datasetPrefix}_${group}.csv`;

        // Generate Signed URL from Supabase Storage
        const { data, error } = await supabase
            .storage
            .from('datasets')
            .createSignedUrl(datasetName, 3600); // Valid for 1 hour

        res.json({
            round: currentRound,
            title: roundContent.title,
            description: roundContent.description,
            questions: roundContent.questions,
            datasetUrl: data?.signedUrl || null,
            datasetName: datasetName,
            taskDescription: `Round ${currentRound}: ${roundContent.title}`,
            endTime: timerSetting?.value || null
        });

    } catch (error) {
        console.error('Dashboard data fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

export const submitWork = async (req: Request, res: Response) => {
    // @ts-ignore
    const { teamId, group } = req.user;
    const file = req.file; // From Multer

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Fetch Current Round from DB
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'current_round' } });
    const currentRound = setting ? parseInt(setting.value) : 1;

    // Upload to Supabase Storage
    const fileName = `${teamId}_round${currentRound}_${Date.now()}_${file.originalname}`;
    const { data, error } = await supabase
        .storage
        .from('submissions')
        // @ts-ignore - Multer buffer
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });

    if (error) {
        return res.status(500).json({ error: 'Upload failed', details: error });
    }

    // Get Public URL
    const { data: publicUrlData } = supabase
        .storage
        .from('submissions')
        .getPublicUrl(fileName);

    // Save to DB
    await prisma.submission.create({
        data: {
            teamId,
            round: currentRound,
            imageUrl: publicUrlData.publicUrl,
            numericAnswer: req.body.numericAnswer ? parseFloat(req.body.numericAnswer) : 0,
        },
    });

    res.json({ message: 'Submission received!', url: publicUrlData.publicUrl });
};
