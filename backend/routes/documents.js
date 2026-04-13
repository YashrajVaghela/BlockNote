const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT id, title, share_token, is_public, updated_at FROM "document" WHERE user_id = $1 ORDER BY updated_at DESC',
    [req.user.userId]
  );
  res.json(result.rows);
});

router.post('/', authenticate, async (req, res) => {
  const title = typeof req.body.title === 'string' && req.body.title.trim().length > 0
    ? req.body.title.trim()
    : 'Untitled document';
  const shareToken = randomUUID();

  const result = await pool.query(
    'INSERT INTO "document" (user_id, title, share_token, is_public, updated_at) VALUES ($1, $2, $3, FALSE, NOW()) RETURNING id, title, share_token, is_public, updated_at',
    [req.user.userId, title, shareToken]
  );

  res.status(201).json(result.rows[0]);
});

router.patch('/:id', authenticate, async (req, res) => {
  const { title, is_public } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(422).json({ error: 'title must be a non-empty string' });
  }

  if (is_public !== undefined && typeof is_public !== 'boolean') {
    return res.status(422).json({ error: 'is_public must be a boolean' });
  }

  const result = await pool.query(
    `UPDATE "document" SET title = COALESCE(NULLIF($1, ''), title), is_public = COALESCE($2, is_public), updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING id, title, share_token, is_public, updated_at`,
    [title ? title.trim() : null, is_public, req.params.id, req.user.userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(result.rows[0]);
});

router.delete('/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM "block" WHERE document_id = $1', [req.params.id]);
  const result = await pool.query('DELETE FROM "document" WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ success: true });
});

module.exports = router;
