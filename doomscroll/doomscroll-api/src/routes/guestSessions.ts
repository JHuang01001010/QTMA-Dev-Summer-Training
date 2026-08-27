import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db';

// Create new router instance
const router = Router();

// Define POST for guest sessions
router.post('/', (_req: Request, res: Response) => {
  // Create guest token. randomUUID() is Node's built-in CSPRNG-backed UUIDv4,
  // so the token is unguessable - it is the only thing protecting a guest's data.
  const guest_token = randomUUID();
  // Insert into SQL database
  const info = db.prepare('INSERT INTO guest_sessions (guest_token) VALUES (?)').run(guest_token);
  // Send 201 resource created response 
  res.status(201).json({ guest_token, session_id: info.lastInsertRowid as number });
});

export default router;