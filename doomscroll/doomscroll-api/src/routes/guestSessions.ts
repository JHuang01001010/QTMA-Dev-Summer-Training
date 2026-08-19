import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

// Create new router instance
const router = Router();

// Define POST for guest sessions
router.post('/', (_req: Request, res: Response) => {
  // Create guest token
  const guest_token = uuidv4();
  // Insert into SQL database
  const info = db.prepare('INSERT INTO guest_sessions (guest_token) VALUES (?)').run(guest_token);
  // Send 201 resource created response 
  res.status(201).json({ guest_token, session_id: info.lastInsertRowid as number });
});

export default router;