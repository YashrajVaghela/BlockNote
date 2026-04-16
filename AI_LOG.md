# AI Coding Log

## Day 1

**What I asked for:** Build authentication, document list, and deploy database

**What it generated:** Backend auth routes, login/register pages, database schema with user and document tables

**What was wrong or missing:** Auth routes needed cleanup, user-document access control missing, no error handling

**What I changed and why:** Asked Copilot to fix auth — it generated basic checks, then I manually added permission validation to prevent users seeing others' documents. Added better error messages manually.

---

## Day 2–3

**What I asked for:** Create block editor with Enter split, Backspace merge, 7 block types, and slash menu

**What it generated:** Contenteditable blocks with keyboard handlers, order_index sorting, slash command interface

**What was wrong or missing:** Order_index was integer, caused collisions. Enter split didn't preserve text properly. Slash menu filtering incomplete.

**What I changed and why:** Asked Copilot to fix order_index — it used integers, I manually changed to fractional numbers (0.5, 0.25, etc) to prevent collisions. Copilot's Enter handler lost text, I manually rewrote split logic. Copilot built slash menu, I manually added search filtering.

---

## Day 4

**What I asked for:** Add drag-to-reorder, auto-save, and share link feature

**What it generated:** dnd-kit drag setup, save triggers, share token generation

**What was wrong or missing:** Auto-save had race condition — old saves could overwrite new data. Share link had no permission check for read-only access.

**What I changed and why:** Asked Copilot for auto-save — it missed race condition handling. I manually added AbortController to cancel old requests. Copilot generated share token but no permission check, I manually added backend validation to make shared view read-only.

---

## Day 5

**What I asked for:** Fix remaining bugs, write documentation, prepare for submission

**What it generated:** Basic bug checklist and README template

**What was wrong or missing:** Backspace checked stale state not DOM. Image block hid input on first letter. Image input triggered slash menu mid-typing.

**What I changed and why:** Asked Copilot to fix backspace — it still checked state, I manually changed to read actual DOM (`e.target.innerText`). Copilot's image block used conditional JSX, I manually restructured to always show input + conditionally show preview. Copilot added `stopPropagation()` to everything, I manually made it selective (only block Enter/Backspace, allow "/" when empty). Deployed to Vercel ✓
