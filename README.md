# BlockNote

A lightweight browser-based note editor with user authentication, real-time blocks, and sharing capabilities. Build rich documents with 7 block types — paragraphs, headings, todos, code, dividers, and images.

## Features

- ✅ User auth (signup/login with JWT)
- ✅ Document management with ownership
- ✅ Live editor with 7 block types
- ✅ Block operations: Enter to split mid-text, Backspace to merge, "/" for slash menu
- ✅ Drag-to-reorder blocks with re-normalization
- ✅ Auto-save to backend (race condition safe)
- ✅ Share links with API-level read-only enforcement
- ✅ Responsive UI with Tailwind CSS

---

---

## Live Deployment

The app is currently deployed and accessible online:

- **Frontend:** https://frontend-pied-tau-6ie25mefqg.vercel.app/
- **Backend API:** https://blocknote-g56z.onrender.com
- **Database:** PostgreSQL on Render

You can test the app immediately without local setup: Click the frontend link above, sign up, and start creating documents!

---

## Local Development Setup

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **PostgreSQL** ([download](https://www.postgresql.org/download/))

### Step 1: Create Database

```bash
# Create the blocknote database
createdb blocknote
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment template and configure
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# Default: DATABASE_URL=postgres://postgres:password@localhost:5432/blocknote
# Replace 'password' with your PostgreSQL password
nano .env  # or use your preferred editor
```

**Backend .env Template:**
```
DATABASE_URL=postgres://postgres:your_password@localhost:5432/blocknote
JWT_SECRET=your-super-secret-jwt-key-make-it-random-and-long-min-32-chars
FRONTEND_ORIGIN=http://localhost:5173
PORT=5000
NODE_ENV=development
```

```bash
# Install dependencies
npm install

# Run database migrations (applies schema.sql)
npm run migrate

# Start backend server
npm start
```

Backend will run on **`http://localhost:5000`**

### Step 3: Frontend Setup (New Terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on **`http://localhost:5173`**

### Step 4: Access Application

Open your browser to **`http://localhost:5173`**
- Click "Sign up" to create an account
- Create a new document
- Start editing with the block editor!

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Change `PORT` in `backend/.env` or kill the process: `lsof -ti:5000 \| xargs kill -9` |
| Port 5173 already in use | Vite will auto-increment to 5174 or kill with: `lsof -ti:5173 \| xargs kill -9` |
| Database connection error | Check `DATABASE_URL` in `.env`. Default user is `postgres`. Verify password. |
| `createdb` command not found | PostgreSQL not in PATH. On Mac: `brew install postgresql`. On Windows: Add PostgreSQL `bin/` folder to PATH. |
| "Forbidden" error when accessing document | JWT_SECRET mismatch. Restart backend after changing `.env`. |
| Frontend shows "Cannot reach backend" | Ensure backend is running on `http://localhost:5000`. Check `VITE_API_BASE` in frontend `.env` |

### Stopping the Application

**Backend:** Press `Ctrl+C` in backend terminal
**Frontend:** Press `Ctrl+C` in frontend terminal

To reset database and start fresh:
```bash
dropdb blocknote
createdb blocknote
cd backend && npm run migrate
```

---

## Environment Variables

### Backend (`backend/.env`)

Reference `backend/.env.example`:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@localhost/blocknote` |
| `JWT_SECRET` | Secret key for token signing | `your-random-secret-key-min-32-chars` |
| `FRONTEND_ORIGIN` | Allowed frontend URL for CORS | `http://localhost:5173` |
| `PORT` | Backend listen port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE` | Backend API URL | `http://localhost:5000` |

---

## Architecture Decisions

### 1. Tech Stack Choice
- **Backend:** Express.js + PostgreSQL (simple REST API, reliable data storage)
- **Frontend:** React + Vite + Tailwind (fast dev server, modern tooling)
- **Reasoning:** Prioritized developer ergonomics and production reliability over heavy frameworks

### 2. Order Index (Fractional Sorting for Drag-Reorder)
**Decision:** Use FLOAT for `order_index`, not INTEGER.

**Why:** When inserting block between position 1 and 2, calculate midpoint: `(1 + 2) / 2 = 1.5`. After many insertions between same blocks, precision shrinks. When gap < 0.001, re-normalize all blocks to integers (1, 2, 3, ...).

**Implementation:** 
```javascript
// In Editor.jsx addBlock() and drag handler:
const newOrderIndex = nextBlock ? (prevBlock.orderIndex + nextBlock.orderIndex) / 2 : prevBlock.orderIndex + 1;
// Detect precision loss and re-normalize:
if ((next?.orderIndex - prev?.orderIndex) < 0.001) {
  return newItems.map((item, i) => ({ ...item, orderIndex: i + 1 }));
}
```

### 3. State vs DOM Content (Backspace Bug Prevention)
**Decision:** Read actual DOM content when checking if block is empty, not state.

**Why:** React state updates asynchronously. When user rapidly deletes text, the DOM is empty but state hasn't updated yet. Reading `block.content.text` (state) instead of `e.target.innerText` (DOM) causes backspace to fail.

**Implementation:**
```javascript
// Backspace handler checks actual DOM:
if (block.type === 'code') {
  isEmpty = !e.target.value || e.target.value.trim().length === 0;
} else {
  isEmpty = !e.target.innerText || e.target.innerText.trim().length === 0;
}
```

### 4. Slash Menu Text Bleed Prevention
**Decision:** Prevent "/" and search characters from being typed into block content.

**Why:** User types "/heading" to search for heading type. The "/" must NOT appear in the actual block content.

**Implementation:**
```javascript
// In handleBlockKeyDown():
if (e.key === '/') {
  if (cursorAtStart && isEmpty) {
    e.preventDefault();  // Block "/" from being typed
    setShowSlashMenu({ visible: true, blockId: block.id, query: '' });
  }
}
// While slash menu is open, all characters are captured:
if (showSlashMenu.visible && showSlashMenu.blockId === block.id) {
  e.preventDefault();  // Don't type into block
  // Route to slash menu instead
}
```

### 5. Auto-Save Race Condition (AbortController)
**Decision:** Use AbortController to cancel in-flight requests when new save triggers.

**Why:** If user types fast: save 1 starts, user types again, save 2 starts and completes first, then save 1 lands late. The old (stale) save 1 overwrites the new save 2.

**Implementation:**
```javascript
// In triggerSave():
if (abortControllerRef.current) abortControllerRef.current.abort();
abortControllerRef.current = new AbortController();
try {
  await syncDocumentBlocks(id, { blocks }, abortControllerRef.current.signal);
} catch (err) {
  if (err.name !== 'AbortError') console.error('Save failed:', err);
}
```

### 6. Share Token Read-Only at API Level
**Decision:** POST /api/blocks requests with share token are rejected by server.

**Why:** Read-only enforcement at frontend only (hiding buttons, disabling save) is not secure. A user could open DevTools and send a POST anyway. Server must reject it.

**Implementation:**
```javascript
// In backend routes/blocks.js:
app.post('/api/blocks/sync', authenticateToken, async (req, res) => {
  if (req.user.type === 'share_token') {
    return res.status(403).json({ error: 'Read-only access' });
  }
  // Process save
});
```

### 7. Document Ownership Check (403 on Wrong User)
**Decision:** GET /api/documents/:id verifies `document.user_id === req.user.id`.

**Why:** Without this, user B could access user A's private documents using their JWT + document ID.

**Implementation:**
```javascript
// In backend routes/documents.js:
app.get('/api/documents/:id', authenticateToken, async (req, res) => {
  const doc = await db.query('SELECT * FROM document WHERE id = $1', [req.params.id]);
  if (!doc || doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(doc);
});
```

### 8. Enter Mid-Block Split (Preserve Text, No Duplication)
**Decision:** When user presses Enter mid-text, split into two blocks with no text loss.

**Why:** Critical UX feature. Losing or duplicating text breaks document integrity.

**Implementation:**
```javascript
// In handleBlockKeyDown() Enter handler:
const selection = window.getSelection();
const range = selection.getRangeAt(0);
const text = elRef.current.innerText;
const cursorOffset = range.startOffset;
beforeText = text.slice(0, cursorOffset);
afterText = text.slice(cursorOffset);

// Update current block with beforeText:
newItems[index] = { ...newItems[index], content: { text: beforeText } };
// Create new block with afterText:
const newBlock = { id: `temp-${Date.now()}`, type: 'paragraph', content: { text: afterText }, orderIndex: newOrderIndex };
newItems.splice(index + 1, 0, newBlock);
```

### 9. Backspace at Start of First Block
**Decision:** Convert to paragraph type (if already paragraph, no action).

**Why:** Prevents accidental deletion of the document's first block. User can still delete it via trash button.

**Implementation:**
```javascript
if (currentIndex === 0) {
  if (block.type !== 'paragraph') {
    e.preventDefault();
    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'paragraph' } : b));
  }
  return;
}
```

### 10. Backspace with Previous Block = Divider or Image
**Decision:** Delete current empty block and focus previous block (don't try to merge).

**Why:** Dividers and images don't have text to merge into. Merging into them doesn't make sense.

**Implementation:**
```javascript
if (isEmpty && currentIndex > 0) {
  e.preventDefault();
  const prevBlock = blocks[currentIndex - 1];
  deleteBlock(block.id);
  setTimeout(() => {
    const prevEl = document.getElementById(`block-${prevBlock.id}`);
    if (prevEl) prevEl.focus();
  }, 0);
}
```

---

## Known Issues & Limitations

- **No collaborative editing** — Only one user can edit a document at a time
- **No image upload** — Image block requires external URLs (copy/paste only)
- **No offline support** — App requires live connection for auto-save to work
- **No rich text formatting** — Bold, italic, underline, code spans not supported
- **No export** — Can't save documents as PDF, Markdown, or other formats
- **Limited block types** — No tables, embeds, video, or custom block extensions
- **Share links never expire** — No password or time-based access revocation
- **No comment threads** — Can't leave feedback or discuss specific blocks
- **No undo/redo** — Changes are permanent once saved
- **No version history** — Can't roll back to previous document states

---

## File Structure

```
BlockNote/
├── backend/
│   ├── db.js              # PostgreSQL connection
│   ├── index.js           # Express app, route setup
│   ├── schema.sql         # Database schema (users, documents, blocks, tokens)
│   ├── .env.example       # Environment template
│   ├── middleware/
│   │   └── auth.js        # JWT verification, share token validation
│   └── routes/
│       ├── auth.js        # /api/auth/signup, login, refresh
│       ├── documents.js   # /api/documents CRUD
│       └── blocks.js      # /api/blocks/sync (save blocks for document)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # React Router setup
│   │   ├── api.js         # Fetch wrapper functions
│   │   ├── main.jsx       # Entry point
│   │   ├── styles.css     # Global styles
│   │   └── pages/
│   │       ├── Home.jsx              # Landing page
│   │       ├── Login.jsx             # Login form
│   │       ├── Register.jsx          # Signup form
│   │       ├── Dashboard.jsx         # Document list, create
│   │       ├── Editor.jsx            # Main block editor + keyboard handlers
│   │       └── ShareView.jsx         # Read-only shared document view
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── AI_LOG.md              # AI decision log (what Copilot generated vs manual changes)
├── README.md              # This file
└── docker-compose.yml     # (Optional) Docker setup
```

---

## Deployment

### Current Production Setup

- **Frontend:** Deployed on Vercel (https://frontend-pied-tau-6ie25mefqg.vercel.app/)
- **Backend:** Deployed on Render (https://blocknote-g56z.onrender.com)
- **Database:** PostgreSQL on Render

### How to Deploy

#### Frontend (Vercel)
1. Push to GitHub
2. Connect repo to Vercel
3. Set `VITE_API_BASE` to `https://blocknote-g56z.onrender.com`
4. Auto-deploys on every git push

#### Backend (Render)
1. Create PostgreSQL database on Render
2. Create Web Service, connect GitHub repo
3. Set environment variables:
   - `DATABASE_URL` - Render PostgreSQL URL
   - `JWT_SECRET` - Random secret key
   - `FRONTEND_ORIGIN` - `https://frontend-pied-tau-6ie25mefqg.vercel.app`
   - `PORT` - `5000`
4. Run start command: `npm run dev`
5. Run migrations in shell: `npm run migrate`

---

## Testing Edge Cases

To verify all edge cases work:

### Test 1: Enter Mid-Block Split
1. Create paragraph block with text "Hello World"
2. Click between "Hello" and "World"
3. Press Enter
4. Result: Two blocks, first = "Hello", second = "World", no text lost

### Test 2: Backspace on Empty Image Block
1. Create image block
2. Don't enter URL (leave empty)
3. Press Backspace
4. Result: Image block deleted, focus moves to previous block

### Test 3: Slash Menu in Empty Image Block
1. Create image block
2. Press "/"
3. Result: Slash menu appears, "/" is not in the URL input

### Test 4: Auto-Save Race Condition
1. Type rapidly in a paragraph block (many changes in < 1 second)
2. Check backend logs: only the final state is saved
3. Result: No mixed/corrupted data

### Test 5: Document Ownership
1. Sign up as User A, create document
2. Get document ID
3. Sign up as User B
4. Try to access User A's document via API
5. Result: 403 Forbidden error

### Test 6: Share Link API Read-Only
1. Create document and get share link
2. Open in browser, verify read-only (no save, buttons disabled)
3. Use DevTools to send POST /api/blocks/sync with share token
4. Result: Server returns 403, no save occurs

---

## Tech Stack

- **Backend:** Node.js + Express.js + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS
- **Libraries:** 
  - `@dnd-kit/core`, `@dnd-kit/sortable` (drag-to-reorder)
  - `framer-motion` (animations)
  - `lucide-react` (icons)
  - `jsonwebtoken` (JWT auth)
- **Dev Tools:** ESLint, Tailwind plugins

---

## Notes

- All timestamps use UTC
- JWT tokens expire after 15 minutes; refresh tokens last 7 days
- Share tokens are random 32-character strings
- All API responses use JSON
- Frontend matches `/dashboard`, `/editor/:id`, `/share/:token` routes

## License

Personal project. Not for commercial use.
