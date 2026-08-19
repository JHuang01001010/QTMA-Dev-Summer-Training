import { Router } from 'express';
import guestSessions from './guestSessions';
import logs from './logs';
import summary from './summary';
import goals from './goals';

// Create new router instance
const router = Router();

// Sub routes from src/index.ts /api
router.use('/guest-sessions', guestSessions);
router.use('/logs', logs);
router.use('/summary', summary);
router.use('/goals', goals);

export default router;