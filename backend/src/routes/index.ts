
import { Router } from 'express';
const multer = require('multer');
import { login } from '../controllers/auth.controller';
import { seedDatabase } from '../controllers/seed.controller';
import { getDashboardData, submitWork } from '../controllers/dashboard.controller';
import { authenticateToken, authorize } from '../middleware/auth.middleware';
import { getSubmissions, updateScore, getScores } from '../controllers/admin.controller';
import { getDashboardStats } from '../controllers/stats.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store in memory to upload to Supabase

// Public Routes
router.post('/login', login);
router.post('/seed', seedDatabase); // Ideally protect this with a secret or disable in production

// Protected Routes
router.get('/dashboard', authenticateToken, getDashboardData);
router.post('/submit', authenticateToken, upload.single('file'), submitWork);

// Admin Routes
router.get('/admin/stats', authenticateToken, authorize(['Admin']), getDashboardStats);
router.get('/admin/submissions', authenticateToken, authorize(['Admin']), getSubmissions);
router.get('/admin/scores', authenticateToken, authorize(['Admin']), getScores);
router.post('/admin/score', authenticateToken, authorize(['Admin']), updateScore);

export default router;
