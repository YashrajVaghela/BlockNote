# AI Coding Log — Block Note Development

## Detailed Implementation Decisions

### 1. **Enter Mid-Block Split** — Text Preservation Logic

#### What AI Generated
Copilot generated an initial Enter handler that:
- Detected cursor position using `window.getSelection()`
- Attempted to split before/after text
- Created a new block with the after-text
- Used React state to update both blocks simultaneously

**Initial Code (AI-Generated):**
```javascript
if (e.key === 'Enter') {
  const text = elRef.current.innerText;
  const cursorOffset = window.getSelection().getRangeAt(0).startOffset;
  const beforeText = text.slice(0, cursorOffset);
  const afterText = text.slice(cursorOffset);
  
  setBlocks(current => [
    ...current,
    { id: `new-${Date.now()}`, type: 'paragraph', content: { text: afterText }, orderIndex: ... }
  ]);
}
```

#### What Broke
1. **Text Loss**: The new block's `afterText` was correct, but the DOM wasn't immediately updated. React still showed the full original text until re-render completed.
2. **Race Condition**: User could type more while state was updating, causing additional keypress events before the split completed.
3. **Cursor Position Lost**: After split, cursor wasn't placed correctly in the new block; user had to click to position cursor.
4. **No DOM Sync**: The original block still showed full text on screen even though state was being updated.

#### What I Fixed (Manual Implementation)
- **DOM First**: Update `elRef.current.innerText = beforeText` immediately, before triggering state change
- **Proper Text Capture**: Ensure `beforeText` and `afterText` are captured from actual DOM, not state
- **Focus Target**: Use `setFocusTarget()` to auto-place cursor at start of new block after render
- **Null Check**: Guard against `beforeText !== null` to handle dividers and images (no text to split)

**Fixed Code (Manual):**
```javascript
if (shouldSplit) {
  const newBlockType = 'paragraph';
  
  // Update DOM immediately (don't wait for state)
  if (beforeText !== null && elRef.current && elRef.current.innerText !== beforeText) {
    elRef.current.innerText = beforeText;
  }
  
  setBlocks(current => {
    // Calculate new order_index...
    const newBlock = {
      id: `temp-${Date.now()}`,
      type: newBlockType,
      content: { text: afterText },
      orderIndex: newOrderIndex
    };
    
    const newItems = [...current];
    if (beforeText !== null) {
      newItems[index] = { ...newItems[index], content: { text: beforeText } };
    }
    newItems.splice(index + 1, 0, newBlock);
    
    setFocusTarget({ id: newBlock.id, type: newBlock.type }); // Auto-place cursor
    return newItems;
  });
```

**Why Manual Was Necessary:**
- The timing of DOM update vs state update is critical for UX. AI-generated code didn't account for React's async rendering.
- Had to think through the exact sequence: capture text → update DOM → update state → focus new block → auto-save.
- This is a nuanced React pattern (useRef + DOM manipulation + async state) that requires careful orchestration.

---

### 2. **Order Index** — Fractional Sorting to Prevent Collisions

#### What AI Generated
Copilot initially used INTEGER order indices (1, 2, 3, ...):
```javascript
const newOrderIndex = nextBlock ? nextIndex : currentIndex + 1;
```

When inserting a block between position 1 and 2, it would create collisions if there was nowhere to place it.

#### What Broke
1. **Integer Collision**: After inserting 10 blocks between positions 1–2, you'd have:
   - Block 1: orderIndex = 1
   - Inserted blocks: ???  (no space for 10 blocks between 1 and 2)
2. **Limited Reorder Depth**: Inserting in the same gap multiple times eventually fails.
3. **Database Constraints**: No way to store meaningful sort order for deeply-nested insertions.

#### What I Changed (Manual Decision)
Switched to **fractional order indices** with **re-normalization**:
- Insert between `n₁` and `n₂`: new index = `(n₁ + n₂) / 2`
- Example: Between 1.0 and 2.0 → insert at 1.5
  - Next insert between 1.0 and 1.5 → insert at 1.25
  - Next: between 1.0 and 1.25 → insert at 1.125
  - Continue until gap < 0.001 → re-normalize all blocks to integers (1, 2, 3, ...)

**Fixed Code (Manual):**
```javascript
const addBlock = (afterBlockId, type = 'paragraph') => {
  setBlocks(current => {
    const index = current.findIndex(b => b.id === afterBlockId);
    const prevBlock = current[index];
    const nextBlock = current[index + 1];
    
    // Fractional midpoint
    let newOrderIndex;
    if (!nextBlock) {
      newOrderIndex = (prevBlock?.orderIndex || 0) + 1.0;
    } else {
      newOrderIndex = (prevBlock.orderIndex + nextBlock.orderIndex) / 2;
    }
    
    const newBlock = { id: `temp-${Date.now()}`, type, content: { text: '' }, orderIndex: newOrderIndex };
    const newItems = [...current];
    newItems.splice(index + 1, 0, newBlock);
    
    setFocusTarget({ id: newBlock.id, type: newBlock.type });
    
    // Re-normalize if precision loss detected
    if (nextBlock && (nextBlock.orderIndex - prevBlock.orderIndex) < 0.001) {
      return newItems.map((b, i) => ({ ...b, orderIndex: i + 1 }));
    }
    return newItems;
  });
};
```

**Why Manual Was Necessary:**
- This is a classic **algorithmic design decision**, not generated by prompting for "reordering."
- Requires understanding of floating-point precision and when to normalize.
- AI can't anticipate the edge case of deep nesting without it being explicitly suggested.
- The re-normalization threshold (0.001) came from manual testing and UX consideration.

---

### 3. **Cross-Account Document Access Protection** — Authorization Validation

#### What AI Generated
Copilot created basic `authenticate` middleware and route handlers but **without ownership checks**:
```javascript
router.get('/:id', authenticate, async (req, res) => {
  const document = await pool.query('SELECT * FROM document WHERE id = $1', [req.params.id]);
  return res.json(document); // ← No check if user owns document!
});
```

#### What Broke
1. **Account Enumeration**: User B could guess User A's document IDs and fetch any document.
2. **Data Breach**: No permission check meant anyone with a JWT could read all documents by ID.
3. **Write Vulnerability**: User B could edit User A's blocks via the sync endpoint.
4. **Share Links**: Shared documents weren't truly read-only at the API level (frontend-only hiding).

#### What I Fixed (Manual Verification Logic)

**Every endpoint now includes a three-part check:**

1. **GET /:id — Read Ownership Check:**
```javascript
router.get('/:id', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT id, user_id, title, ... FROM "document" WHERE id = $1',
    [req.params.id]
  );
  const document = result.rows[0];
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  if (document.user_id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' }); // ← Manual check added
  }
  
  return res.json(document);
});
```

2. **PUT /:id/blocks — Write Ownership + Share Token Check:**
```javascript
router.put('/:id/blocks', authenticate, async (req, res) => {
  const { blocks } = req.body;
  
  if (req.shareToken) {
    return res.status(403).json({ error: 'Share tokens are read-only' }); // ← Share token read-only
  }
  
  const documentResult = await pool.query('SELECT id, user_id FROM "document" WHERE id = $1', [req.params.id]);
  const document = documentResult.rows[0];
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  if (document.user_id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' }); // ← Manual check added
  }
  
  // Process save within transaction...
});
```

3. **PATCH /:id — Update Title + Metadata Ownership Check:**
```javascript
router.patch('/:id', authenticate, async (req, res) => {
  // ... update document title/public status ...
  const result = await pool.query(
    `UPDATE "document" SET ... WHERE id = $3 AND user_id = $4 ...`,
    [newTitle, isPublic, documentId, req.user.userId] // ← Check in WHERE clause
  );
  
  if (result.rowCount === 0) {
    return res.status(403).json({ error: 'Forbidden' });
  }
});
```

**Why Manual Was Necessary:**
- **Security is non-negotiable**: AI generates function skeletons but typically skips authorization checks as "not part of the core logic."
- **Must be explicit**: Each route requires custom logic (check document.user_id, or check req.shareToken).
- **Easy to forget**: If I relied on AI to "fill in" all routes, it would be easy to miss the check on one endpoint, creating a security hole.
- **Shared vs User Tokens**: The distinction between JWTs (write-capable) and share tokens (read-only) needs deliberate checking in the sync endpoint.

---

### 4. **Backspace Handler** — Reading Actual DOM Content, Not State

#### What AI Generated
Copilot generated a Backspace handler that checked React state:
```javascript
if (e.key === 'Backspace') {
  if (cursorOffset === 0) {
    const isEmpty = blocks[currentIndex].content.text === ''; // ← State, not DOM
    if (isEmpty) {
      deleteBlock(block.id);
    }
  }
}
```

#### What Broke
1. **Stale State**: User rapidly deletes all characters. DOM shows empty, but state hasn't re-rendered yet.
2. **Backspace Ineffective**: Backspace tried to merge/delete but thought block still had content, so did nothing.
3. **Lost Merges**: When user expected Backspace to merge two blocks, it would fail silently.

#### What I Fixed (Manual Implementation)
Read **actual DOM content** instead of React state:
```javascript
if (e.key === 'Backspace') {
  let cursorOffset = 0;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    cursorOffset = e.target.selectionStart;
  } else {
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    cursorOffset = range ? range.startOffset : 0;
  }
  
  if (cursorOffset === 0) {
    const currentIndex = blocks.findIndex(b => b.id === block.id);
    let isEmpty = false;
    
    // Check actual DOM, not state
    if (block.type === 'code') {
      isEmpty = !e.target.value || e.target.value.trim().length === 0;
    } else {
      isEmpty = !e.target.innerText || e.target.innerText.trim().length === 0;
    }
    
    if (isEmpty && currentIndex > 0) {
      e.preventDefault();
      deleteBlock(block.id);
      // Focus previous block...
    }
  }
}
```

**Why Manual Was Necessary:**
- **React timing issue**: State lags behind DOM events. Only by reading `e.target` directly can we know the true current state.
- **Conditional on element type**: Code blocks use `e.target.value`, content blocks use `e.target.innerText`. AI can't know this without explicit feedback.
- **Not a common pattern**: Most tutorials show reading state; manually reading DOM during event handlers is non-obvious.

---

### 5. **Auto-Save Race Condition** — AbortController for Stale Requests

#### What AI Generated
Simple auto-save with debounce:
```javascript
const triggerSave = () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(async () => {
    await syncDocumentBlocks(id, { blocks });
  }, AUTO_SAVE_DELAY);
};
```

#### What Broke
1. **Save Order Violated**: User saves (request 1), types more, saves again (request 2). But request 2 completes first, then request 1 lands and overwrites with old data.
2. **Silent Data Loss**: User sees new blocks but old state gets persisted to DB.
3. **Network Lag**: On slow connections, older requests can arrive after newer ones.

#### What I Fixed (Manual Implementation)
Use **AbortController** to cancel in-flight old requests:
```javascript
const saveTimeoutRef = useRef(null);
const abortControllerRef = useRef(null);

const triggerSave = useCallback(() => {
  setSavingStatus('saving');
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  
  saveTimeoutRef.current = setTimeout(async () => {
    // Cancel any previous save request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    try {
      await syncDocumentBlocks(id, { blocks: blocksRef.current }, abortControllerRef.current.signal);
      setSavingStatus('saved');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
      }
    }
  }, AUTO_SAVE_DELAY);
}, [id]);
```

**Why Manual Was Necessary:**
- **Distributed systems problem**: This is a classic race condition only visible under network latency.
- **AbortController not obvious**: New developers often think debounce alone solves this; it doesn't.
- **Requires two refs**: Must track both the timeout and the AbortController separately.
- **Error handling subtlety**: Must ignore `AbortError` but log other errors.

---

### 6. **Slash Menu "/" Character Blocking**

#### What AI Generated
Copilot created slash menu but didn't prevent "/" from being typed:
```javascript
if (e.key === '/') {
  if (cursorAtStart && isEmpty) {
    setShowSlashMenu({ visible: true, blockId: block.id, query: '' });
  }
}
```

#### What Broke
1. **"/" Appears in Content**: When user pressed "/" to open menu, the "/" character was also typed into the block.
2. **Menu & Text**: Block would show "/heading" or "/code" when searching for types.
3. **Data Corruption**: Saved blocks had "/" characters that shouldn't be there.

#### What I Fixed (Manual Implementation)
Add `e.preventDefault()` to block "/" from being typed:
```javascript
if (e.key === '/') {
  let cursorAtStart = false;
  let currentText = '';
  
  if (block.type === 'code') {
    cursorAtStart = elRef.current.selectionStart === 0;
    currentText = elRef.current.value;
  } else if (['divider', 'image'].includes(block.type)) {
    cursorAtStart = true;
    currentText = '';
  } else {
    const selection = window.getSelection();
    cursorAtStart = selection.rangeCount > 0 && selection.getRangeAt(0).startOffset === 0;
    currentText = elRef.current.innerText;
  }
  
  const isEmpty = !currentText || currentText.trim().length === 0;
  
  if (cursorAtStart && isEmpty) {
    e.preventDefault(); // ← Manually added
    setShowSlashMenu({ visible: true, blockId: block.id, query: '' });
  }
}
```

**Why Manual Was Necessary:**
- **UX vs Data Integrity**: AI generated the menu but didn't think about data integrity (preventing "/" from being typed).
- **Requires explicit decision**: Whether to `preventDefault()` or allow typing is a design choice, not automatic.
- **Multiple block types**: Different types (code, divider, image) need different cursor detection logic.

---

### 7. **Share Token Read-Only at API Level**

#### What AI Generated
Copilot created share token infrastructure but no enforcement:
- Generated `share_token` column in database
- Created endpoint to fetch shared documents
- **But**: No check preventing shared-view users from editing

#### What Broke
1. **Security Hole**: User with share link could open DevTools, grab the share token, and use it to POST/PUT edits via API.
2. **Frontend-Only Protection**: Edit buttons were hidden UI-wise, but API didn't validate.
3. **Data Manipulation**: Anyone with the link could theoretically edit the document via raw fetch request.

#### What I Fixed (Manual Validation)
Added explicit share-token checks in edit endpoints:
```javascript
router.put('/:id/blocks', authenticate, async (req, res) => {
  const { blocks } = req.body;
  
  if (req.shareToken) {
    return res.status(403).json({ error: 'Share tokens are read-only' }); // ← Manual check
  }
  
  // ... rest of sync logic
});

router.post('/', authenticateMaybeShare, async (req, res) => {
  if (req.shareToken) {
    return res.status(403).json({ error: 'Share tokens are read-only' }); // ← Manual check
  }
  
  // ... rest of block creation logic
});
```

**Why Manual Was Necessary:**
- **Security principle**: Authorization checks must be explicit, not inferred.
- **Business logic**: Share tokens are meant to be read-only — this is a requirement, not implementation detail.
- **Defense in depth**: Frontend restrictions + API validation required.

---

## Summary: AI vs Manual Decisions

| Feature | AI-Generated | Why Manual Override Needed |
|---------|-------------|---------------------------|
| **Enter Split** | Basic split logic (lost text) | React timing + DOM sync + cursor placement |
| **Order Index** | Integers (collisions) | Algorithmic design (fractional + re-norm) |
| **Access Control** | Skeleton routes (no checks) | Security non-negotiable; every route needs verification |
| **Backspace** | Checked state (stale) | Only DOM truth is reliable during events |
| **Auto-Save** | Simple debounce (race conditions) | AbortController for request cancellation |
| **Slash Menu** | Menu works (but "/" typed) | Data integrity requires preventDefault() |
| **Share Tokens** | Generated infrastructure (no enforcement) | API-level validation + security principle |

**Pattern**: AI excels at generating structure and boilerplate. Manual override needed for:
1. **Timing/synchronization** (React state vs DOM events)
2. **Algorithmic decisions** (fractional sort, re-normalization)
3. **Security** (authorization checks on every route)
4. **Data integrity** (preventing invalid characters in content)
5. **Race conditions** (AbortController for concurrent requests)
6. **Edge cases** (block types needing special handling)
