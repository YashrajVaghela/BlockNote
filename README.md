# BlockNote Day 1

A lightweight browser-based document workspace with user auth, document management, and a polished home page.

## What is included

- Backend: Express + PostgreSQL with auth and document APIs
- Frontend: React + Vite with Tailwind, login/register, dashboard, and home page
- Database schema for `user`, `document`, `block`, and `refresh_tokens`
- AI usage log tracking in `AI_LOG.md`

## Setup (Manual local install)

1. Create the database and local env:

   ```bash
   cp backend/.env.example backend/.env
   createdb blocknote
   ```

2. Install dependencies:

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Apply the schema:

   ```bash
   cd backend
   npm run migrate
   ```

4. Start backend and frontend:

   ```bash
   cd backend
   npm run dev
   ```

   ```bash
   cd ../frontend
   npm run dev
   ```

5. Visit `http://localhost:5173`.

## Environment variables

Use `backend/.env.example` as reference.

- `DATABASE_URL` - PostgreSQL connection string for the backend
- `JWT_SECRET` - Secret key used by backend auth
- `FRONTEND_ORIGIN` - Allowed frontend origin for CORS
- `PORT` - Backend listen port
- `VITE_API_BASE` - Frontend API base URL in development

## Architecture decisions

- Chose Express + PostgreSQL for a simple REST backend and reliable data storage.
- Used React + Vite + Tailwind for a fast frontend with a maintainable UI.
- Kept the app focused on document management first.

## Known issues

- The block editor page and inline editing features are not implemented yet.
- Public sharing and document collaboration are not available.
- Document content editing is limited to dashboard list actions.
- No deployment URL is included in this repo.

## Edge case decisions

- Enter mid-block split: planned to create a new block and preserve existing text, but editor split logic is pending.
- Backspace at start of empty block: planned to remove the empty block and focus the previous block.
- Backspace at start of non-empty block: decided to keep content unchanged for a simpler first implementation.
- `/` at start of empty block: reserved for a slash command menu in a future editor update.
- Tab inside code block: should insert spaces rather than move focus, once code block editing is added.

## Notes

- Frontend pages live in `frontend/src/pages/`.
- Backend routes are under `/api/auth` and `/api/documents`.
