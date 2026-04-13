import { useEffect, useState } from 'react';
import { createDocument, deleteDocument, getDocuments, updateDocument } from '../api.js';

export function Dashboard({ onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function refreshDocuments() {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate() {
    try {
      await createDocument(newTitle.trim() || 'Untitled document');
      setNewTitle('');
      await refreshDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDocument(id);
      setDocuments((current) => current.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRename(id) {
    try {
      await updateDocument(id, { title: editingTitle.trim() || 'Untitled document' });
      setDocuments((current) =>
        current.map((doc) => (doc.id === id ? { ...doc, title: editingTitle } : doc))
      );
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Document Workspace</p>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Your documents</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Manage your notes with a clean dashboard, quick document creation, and easy access to your latest work.
              </p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total documents</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{documents.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Recent update</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{documents.length ? new Date(documents[0].updated_at).toLocaleDateString() : '—'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Quick action</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">Create new doc</p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="flex-1">
              <span className="sr-only">New document title</span>
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="New document title"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <button
              onClick={handleCreate}
              className="rounded-3xl bg-sky-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Create document
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/30">
          {documents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              No documents yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    {editingId === doc.id ? (
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onBlur={() => handleRename(doc.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleRename(doc.id);
                          }
                        }}
                        autoFocus
                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingId(doc.id); setEditingTitle(doc.title); }}
                        className="text-left text-xl font-semibold text-slate-900 transition hover:text-sky-600"
                      >
                        {doc.title}
                      </button>
                    )}
                    <p className="text-sm text-slate-500">Updated {new Date(doc.updated_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
