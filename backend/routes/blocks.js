const express = require('express');
const pool = require('../db');
const { authenticateMaybeShare } = require('../middleware/auth');

const router = express.Router();
const allowedTypes = new Set(['paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image']);

router.post('/', authenticateMaybeShare, async (req, res) => {
  try {
    if (req.shareToken) {
      return res.status(403).json({ error: 'Share tokens are read-only' });
    }

    const { documentId, type, content, orderIndex, parentId } = req.body;

    if (!Number.isInteger(documentId)) {
      return res.status(422).json({ error: 'documentId must be an integer' });
    }

    if (!allowedTypes.has(type)) {
      return res.status(422).json({ error: 'Invalid block type' });
    }

    const documentResult = await pool.query('SELECT id, user_id FROM "document" WHERE id = $1', [documentId]);
    const document = documentResult.rows[0];

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!req.user || document.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const normalizedOrderIndex = typeof orderIndex === 'number' ? orderIndex : 0;
    const normalizedParentId = Number.isInteger(parentId) ? parentId : null;

    const result = await pool.query(
      'INSERT INTO "block" (document_id, type, content, order_index, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, document_id, type, content, order_index, parent_id',
      [documentId, type, content ?? {}, normalizedOrderIndex, normalizedParentId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create block error:', error);
    return res.status(500).json({ error: 'Failed to create block' });
  }
});

module.exports = router;
