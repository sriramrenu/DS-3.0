import { PrismaClient, Group, Role } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Cleanup
    await prisma.submission.deleteMany();
    await prisma.score.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();

    // 2. Create Admin
    await prisma.user.create({
        data: {
            username: 'admin',
            password: 'password123', // In production, hash this!
            role: Role.Admin,
        },
    });
    console.log('Created Admin user.');

    // 3. Create Teams & Users
    const teamsData = [];

    for (let i = 1; i <= 25; i++) {
        // Determine Group
        let group: Group = Group.L1;
        if (i >= 7 && i <= 12) group = Group.L2;
        if (i >= 13 && i <= 18) group = Group.S1;
        if (i >= 19) group = Group.S2;

        const teamName = `DataTeam ${i}`;
        const username = `user${i}`;

        // Create Team
        const team = await prisma.team.create({
            data: {
                team_name: teamName,
                group: group,
            },
        });

        // Create User for Team
        await prisma.user.create({
            data: {
                username: username,
                password: 'password123',
                role: Role.Participant,
                teamId: team.id,
            },
        });

        // Create Initial Score
        await prisma.score.create({
            data: {
                teamId: team.id,
            },
        });

        teamsData.push({ team: teamName, user: username, group });
    }

    console.log(`Seeded ${teamsData.length} teams.`);

    // 4. Create Initial System Settings
    await prisma.systemSetting.upsert({
        where: { key: 'current_round' },
        update: {},
        create: {
            key: 'current_round',
            value: '1',
        },
    });

    // 5. Create Round Content
    const rounds = [
        {
            id: 1,
            title: 'Round 1: Exploratory Data Analysis',
            description: 'Analyze the provided dataset to find key patterns and insights. Submit your visualization and accuracy score.',
            datasetPrefix: 'round1',
            questions: [
                { id: 'q1', type: 'number', label: 'Exploration Score', placeholder: 'e.g. 85.0' }
            ],
        },
        {
            id: 2,
            title: 'Round 2: Predictive Modeling',
            description: 'Build a predictive model and optimize for the target metric. Submit your final results and visualization.',
            datasetPrefix: 'round2',
            questions: [
                { id: 'q1', type: 'number', label: 'Model Accuracy', placeholder: 'e.g. 92.5' },
                { id: 'q2', type: 'number', label: 'Mean Absolute Error', placeholder: 'e.g. 0.05' }
            ],
        },
    ];

    for (const r of rounds) {
        await prisma.roundContent.upsert({
            where: { id: r.id },
            update: {
                title: r.title,
                description: r.description,
                datasetPrefix: r.datasetPrefix,
                questions: r.questions as any,
            },
            create: {
                id: r.id,
                title: r.title,
                description: r.description,
                datasetPrefix: r.datasetPrefix,
                questions: r.questions as any,
            },
        });
    }

    console.log('Seeded system settings and round content.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
