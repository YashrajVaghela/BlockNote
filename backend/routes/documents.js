const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const allowedTypes = new Set(['paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image']);

function normalizeBlockContent(type, content) {
  if (type === 'todo') {
    return {
      text: typeof content?.text === 'string' ? content.text : '',
      checked: Boolean(content?.checked),
    };
  }

  if (type === 'image') {
    return { url: typeof content?.url === 'string' ? content.url : '' };
  }

  if (type === 'divider') {
    return null;
  }

  if (typeof content === 'string') {
    return { text: content };
  }

  return { text: typeof content?.text === 'string' ? content.text : '' };
}

router.get('/', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT id, title, share_token, is_public, updated_at FROM "document" WHERE user_id = $1 ORDER BY updated_at DESC',
    [req.user.userId]
  );
  res.json(result.rows.map(row => ({
    ...row,
    shareToken: row.share_token,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
    updated_at: row.updated_at // Keep for compatibility if needed
  })));
});

router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.id, d.title, d.share_token, d.is_public, d.updated_at, u.email as owner_email FROM "document" d JOIN "user" u ON d.user_id = u.id WHERE d.is_public = TRUE ORDER BY d.updated_at DESC LIMIT 50'
    );
    res.json(result.rows.map(row => ({
      ...row,
      shareToken: row.share_token,
      isPublic: row.is_public,
      updatedAt: row.updated_at
    })));
  } catch (error) {
    console.error('Failed to fetch public documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT id, user_id, title, share_token, is_public, updated_at FROM "document" WHERE id = $1',
    [req.params.id]
  );
  const document = result.rows[0];

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (document.user_id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.json({
    id: document.id,
    title: document.title,
    share_token: document.share_token,
    shareToken: document.share_token,
    is_public: document.is_public,
    isPublic: document.is_public,
    updated_at: document.updated_at,
  });
});

router.get('/:id/blocks', authenticate, async (req, res) => {
  const documentResult = await pool.query('SELECT id, user_id FROM "document" WHERE id = $1', [req.params.id]);
  const document = documentResult.rows[0];

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (document.user_id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const blocksResult = await pool.query(
    'SELECT id, type, content, order_index, parent_id FROM "block" WHERE document_id = $1 ORDER BY order_index ASC, id ASC',
    [document.id]
  );

  return res.json(
    blocksResult.rows.map((block) => ({
      id: block.id,
      type: block.type,
      content: block.content,
      orderIndex: block.order_index,
      parentId: block.parent_id,
    }))
  );
});

router.get('/share/:token', async (req, res) => {
  const result = await pool.query(
    'SELECT id, title, share_token, is_public, updated_at FROM "document" WHERE share_token = $1 AND is_public = TRUE',
    [req.params.token]
  );
  const document = result.rows[0];

  if (!document) {
    return res.status(404).json({ error: 'Shared document not found or disabled' });
  }

  const blocksResult = await pool.query(
    'SELECT id, type, content, order_index, parent_id FROM "block" WHERE document_id = $1 ORDER BY order_index ASC, id ASC',
    [document.id]
  );

  return res.json({
    id: document.id,
    title: document.title,
    shareToken: document.share_token,
    isPublic: document.is_public,
    updatedAt: document.updated_at,
    blocks: blocksResult.rows.map((block) => ({
      id: block.id,
      type: block.type,
      content: block.content,
      orderIndex: block.order_index,
      parentId: block.parent_id,
    })),
  });
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
  const title = req.body.title;
  const isPublic = req.body.is_public ?? req.body.isPublic;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(422).json({ error: 'title must be a non-empty string' });
  }

  if (isPublic !== undefined && typeof isPublic !== 'boolean') {
    return res.status(422).json({ error: 'is_public must be a boolean' });
  }

  const result = await pool.query(
    `UPDATE "document" SET title = COALESCE(NULLIF($1, ''), title), is_public = COALESCE($2, is_public), updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING id, title, share_token, is_public, updated_at`,
    [title ? title.trim() : null, isPublic, req.params.id, req.user.userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const row = result.rows[0];
  res.json({
    ...row,
    shareToken: row.share_token,
    isPublic: row.is_public,
  });
});

router.put('/:id/blocks', authenticate, async (req, res) => {
  const { blocks } = req.body;
  if (!Array.isArray(blocks)) {
    return res.status(422).json({ error: 'blocks must be an array' });
  }

  if (req.shareToken) {
    return res.status(403).json({ error: 'Share tokens are read-only' });
  }

  const documentResult = await pool.query('SELECT id, user_id FROM "document" WHERE id = $1', [req.params.id]);
  const document = documentResult.rows[0];

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (document.user_id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM "block" WHERE document_id = $1', [document.id]);

    const saved = [];
    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];

      if (!allowedTypes.has(block.type)) {
        await pool.query('ROLLBACK');
        return res.status(422).json({ error: `Invalid block type: ${block.type}` });
      }

      const orderIndex = typeof block.orderIndex === 'number' ? block.orderIndex : index + 1;
      const content = normalizeBlockContent(block.type, block.content);

      const inserted = await pool.query(
        'INSERT INTO "block" (document_id, type, content, order_index, parent_id) VALUES ($1, $2, $3, $4, NULL) RETURNING id, type, content, order_index, parent_id',
        [document.id, block.type, content, orderIndex]
      );
      saved.push(inserted.rows[0]);
    }

    await pool.query('UPDATE "document" SET updated_at = NOW() WHERE id = $1', [document.id]);
    await pool.query('COMMIT');

    return res.json({
      blocks: saved.map((block) => ({
        id: block.id,
        type: block.type,
        content: block.content,
        orderIndex: block.order_index,
        parentId: block.parent_id,
      })),
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ error: 'Failed to save blocks' });
  }
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
