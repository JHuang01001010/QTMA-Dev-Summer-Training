import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Shapes returned by the aggregate queries below
type PlatformRow = { platform_name: string; minutes: number };
type DailyRow = { logged_date: string; minutes: number };
type TotalRow = { total_minutes: number | null; entry_count: number; days_logged: number };

// Matches YYYY-MM-DD. Dates go straight into a SQL comparison, so reject anything
// that isn't exactly this shape rather than trusting the query string.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Handles GET /api/summary, aggregate stats for one session over an optional date range
router.get('/', (req: Request, res: Response) => {
  // Get session ID and the optional start/end bounds
  const { guest_session_id, start_date, end_date } = req.query;
  if (!guest_session_id) {
    return res.status(400).json({ error: 'guest_session_id is required' });
  }

  // Validate the optional bounds before they reach a query
  if (start_date != null && !DATE_PATTERN.test(String(start_date))) {
    return res.status(400).json({ error: 'start_date must be YYYY-MM-DD' });
  }
  if (end_date != null && !DATE_PATTERN.test(String(end_date))) {
    return res.status(400).json({ error: 'end_date must be YYYY-MM-DD' });
  }

  // Build the shared WHERE clause once. Every value is a placeholder so the
  // date strings are bound as parameters, never concatenated into the SQL.
  let where = 'WHERE guest_session_id = ?';
  const params: (string | number)[] = [String(guest_session_id)];

  if (start_date) {
    where += ' AND logged_date >= ?';
    params.push(String(start_date));
  }
  if (end_date) {
    where += ' AND logged_date <= ?';
    params.push(String(end_date));
  }

  try {
    // Overall totals: minutes across the range, how many entries, how many distinct days
    const totals = db
      .prepare(
        `SELECT SUM(minutes_spent) AS total_minutes,
                COUNT(*) AS entry_count,
                COUNT(DISTINCT logged_date) AS days_logged
         FROM usage_logs ${where}`
      )
      .get(...params) as TotalRow;

    // Minutes per platform, biggest first, so the caller gets "most-used apps" ordering for free
    const byPlatform = db
      .prepare(
        `SELECT platform_name, SUM(minutes_spent) AS minutes
         FROM usage_logs ${where}
         GROUP BY platform_name
         ORDER BY minutes DESC`
      )
      .all(...params) as PlatformRow[];

    // Minutes per day, oldest first, ready to plot straight onto a time axis
    const daily = db
      .prepare(
        `SELECT logged_date, SUM(minutes_spent) AS minutes
         FROM usage_logs ${where}
         GROUP BY logged_date
         ORDER BY logged_date ASC`
      )
      .all(...params) as DailyRow[];

    // SUM() returns NULL when no rows match, so fall back to 0 for an empty range
    const totalMinutes = totals.total_minutes ?? 0;
    const daysLogged = totals.days_logged ?? 0;

    res.json({
      guest_session_id: Number(guest_session_id),
      start_date: start_date ? String(start_date) : null,
      end_date: end_date ? String(end_date) : null,
      total_minutes: totalMinutes,
      entry_count: totals.entry_count ?? 0,
      days_logged: daysLogged,
      // Average over days that actually have a log, not over the whole range
      average_minutes_per_logged_day: daysLogged > 0 ? Math.round(totalMinutes / daysLogged) : 0,
      most_used_platform: byPlatform.length > 0 ? byPlatform[0].platform_name : null,
      by_platform: byPlatform,
      daily,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build summary' });
  }
});

export default router;
