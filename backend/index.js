const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment. Set JWT_SECRET in backend/.env or your hosting environment.');
  process.exit(1);
}

const authRouter = require('./routes/auth');
const documentsRouter = require('./routes/documents');

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
