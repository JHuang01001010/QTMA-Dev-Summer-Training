import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Handles GET /api/goals, fetch the goal for a session
router.get('/', (req: Request, res: Response) => {
  // Get session ID value from head of GET request: api.ts getGoal()
  const { guest_session_id } = req.query;
  if (!guest_session_id) {
    return res.status(400).json({ error: 'guest_session_id is required' });
  }

  try {
    // Get goal depending on session ID
    // Prepare placeholder ? before fetching, prevents SQL injection through modified input
    const goal = db.prepare('SELECT * FROM goals WHERE guest_session_id = ?').get(guest_session_id); 
    // Return response as JSON
    res.json(goal || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Handles POST /api/goals, creates or updates the one goal per session
router.post('/', (req: Request, res: Response) => {
  // Get values from body of POST request: api.ts saveGoal()
  const { guest_session_id, daily_limit_minutes } = req.body;
  if (!guest_session_id || daily_limit_minutes == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // See if goal exists by session ID, SQL injection prevention with placeholder ?
    const existingGoal = db.prepare('SELECT id FROM goals WHERE guest_session_id = ?').get(guest_session_id);
    // If exists UPDATE db row, else INSERT: (session ID, limit minutes) as (?,?) in order
    if (existingGoal) {
      db.prepare(
        'UPDATE goals SET daily_limit_minutes = ?, updated_at = CURRENT_TIMESTAMP WHERE guest_session_id = ?'
      ).run(daily_limit_minutes, guest_session_id);
    } else {
      db.prepare(
        'INSERT INTO goals (guest_session_id, daily_limit_minutes) VALUES (?, ?)'
      ).run(guest_session_id, daily_limit_minutes);
    }

    // Re-fetch data after writing to db, SQL injection prevention with placeholder ?
    const goal = db.prepare('SELECT * FROM goals WHERE guest_session_id = ?').get(guest_session_id);
    // Return response as JSON
    res.status(200).json(goal);
    
  } catch (err: any) {
    // Non-existent session ID
    if (err.message?.includes('FOREIGN KEY')) {
      return res.status(404).json({ error: 'guest_session_id does not exist' });
    }
    // Violation of 0-1440 min check
    if (err.message?.includes('CHECK')) {
      return res.status(400).json({ error: 'daily_limit_minutes must be between 0 and 1440' });
    }
    res.status(500).json({ error: 'Failed to save goal' });
  }
});

export default router;