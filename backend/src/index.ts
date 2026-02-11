import express, { Request, Response } from 'express';
import cors from 'cors';
import router from './routes';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (uploads) if needed locally, but we use Supabase now.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', router);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'DataSprint Backend is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
