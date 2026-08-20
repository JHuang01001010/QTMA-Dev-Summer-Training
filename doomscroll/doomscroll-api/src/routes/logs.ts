import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Handles POST /api/logs, creating logs in database
router.post('/', (req: Request, res: Response) => {
  // Get session ID, platform, minutes, date, from log request
  const { guest_session_id, platform_name, minutes_spent, logged_date } = req.body;
  // If no ID or name or minutes null (0 okay) or date, error 
  if (!guest_session_id || !platform_name || minutes_spent == null || !logged_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Insert the row of values from POST request as placeholders, then actually insert them
    const info = db
      .prepare(
        'INSERT INTO usage_logs (guest_session_id, platform_name, minutes_spent, logged_date) VALUES (?, ?, ?, ?)'
      )
      .run(guest_session_id, platform_name, minutes_spent, logged_date);

    // Respond to app with inserted values
    res.status(201).json({
      id: info.lastInsertRowid,
      guest_session_id,
      platform_name,
      minutes_spent,
      logged_date,
    });
  } catch (err: any) {
    if (err.message?.includes('FOREIGN KEY')) {
      return res.status(404).json({ error: 'guest_session_id does not exist' });
    }
    if (err.message?.includes('CHECK')) {
      return res.status(400).json({ error: 'minutes_spent must be between 0 and 1440' });
    }
    res.status(500).json({ error: 'Failed to insert log' });
  }
});

// Handles GET /api/logs, display past entries for a session
router.get('/', (req: Request, res: Response) => {
  // Get session ID
  const { guest_session_id } = req.query;
  // If no session ID, error
  if (!guest_session_id) {
    return res.status(400).json({ error: 'guest_session_id is required' });
  }

  try {
    // Order date by newest then by creation time, then return all rows
    const rows = db
      .prepare('SELECT * FROM usage_logs WHERE guest_session_id = ? ORDER BY logged_date DESC, created_at DESC')
      .all(guest_session_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;