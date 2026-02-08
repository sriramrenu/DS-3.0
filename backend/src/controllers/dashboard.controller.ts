import { Request, Response } from 'express';
import { PrismaClient, Group } from '@prisma/client';
import { supabase } from '../lib/supabase';
import { CONFIG } from '../config';

const prisma = new PrismaClient();

// Configuration: Active Round (In a real app, this might be in DB)
const CURRENT_ROUND = CONFIG.CURRENT_ROUND;

export const getDashboardData = async (req: Request, res: Response) => {
    // @ts-ignore
    const { group } = req.user; // User encoded from JWT middleware

    // Logic to return specific dataset for the Group & Current Round
    const datasetName = `round${CURRENT_ROUND}_${group}.csv`;

    // Generate Signed URL from Supabase Storage
    const { data, error } = await supabase
        .storage
        .from('datasets')
        .createSignedUrl(datasetName, 3600); // Valid for 1 hour

    if (error || !data) {
        return res.status(404).json({ error: 'Dataset not found', details: error });
    }

    res.json({
        round: CURRENT_ROUND,
        taskDescription: `Analyze the ${datasetName} dataset for Round ${CURRENT_ROUND}.`,
        datasetUrl: data.signedUrl,
    });
};

export const submitWork = async (req: Request, res: Response) => {
    // @ts-ignore
    const { teamId, group } = req.user;
    const file = req.file; // From Multer

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Supabase Storage
    const fileName = `${teamId}_round${CURRENT_ROUND}_${Date.now()}_${file.originalname}`;
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
            round: CURRENT_ROUND,
            imageUrl: publicUrlData.publicUrl,
            numericAnswer: req.body.numericAnswer ? parseFloat(req.body.numericAnswer) : 0,
        },
    });

    res.json({ message: 'Submission received!', url: publicUrlData.publicUrl });
};
