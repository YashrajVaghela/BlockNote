const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 30;

function createAccessToken(user) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

function createRefreshToken() {
  return randomUUID();
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and contain a number' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO "user" (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase(), passwordHash]
    );

    return res.status(201).json({ user: { id: result.rows[0].id, email: result.rows[0].email } });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await pool.query('SELECT id, email, password_hash FROM "user" WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  return res.json({ accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const tokenResult = await pool.query(
    'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1',
    [refreshToken]
  );

  const tokenRow = tokenResult.rows[0];

  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const userResult = await pool.query('SELECT id, email FROM "user" WHERE id = $1', [tokenRow.user_id]);
  const user = userResult.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const accessToken = createAccessToken(user);
  return res.json({ accessToken, refreshToken });
});

router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }

  return res.json({ success: true });
});

module.exports = router;
