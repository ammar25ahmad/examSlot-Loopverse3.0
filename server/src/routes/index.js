import { Router } from 'express';
import authRoutes from './authRoutes.js';
import branchRoutes from './branchRoutes.js';
import courseRoutes from './courseRoutes.js';
import studentRoutes from './studentRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import examSlotRoutes from './examSlotRoutes.js';
import adminRoutes from './adminRoutes.js';
import studentPortalRoutes from './studentPortalRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'ExamSlot API', time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/courses', courseRoutes);
router.use('/students', studentRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/exam-slots', examSlotRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentPortalRoutes);

export default router;
