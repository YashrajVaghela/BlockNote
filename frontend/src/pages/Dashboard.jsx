import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  LogOut,
  Shield,
  FileText,
  Share2,
  ChevronRight,
  Clock,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { createDocument, deleteDocument, getDocuments, updateDocument, getPublicDocuments } from '../api.js';

export function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [publicDocuments, setPublicDocuments] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  const [globalCount, setGlobalCount] = useState(0);

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function refreshDocuments() {
    try {
      setLoading(true);
      const [docs, publicDocs] = await Promise.all([
        getDocuments(),
        getPublicDocuments()
      ]);
      setDocuments(docs);
      setPublicDocuments(publicDocs);
      setGlobalCount(publicDocs.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const created = await createDocument(newTitle.trim() || 'Untitled document');
      setNewTitle('');
      navigate(`/editor/${created.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
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

  const clickTimeoutRef = useRef(null);

  function handleTitleClick(doc) {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    clickTimeoutRef.current = setTimeout(() => {
      navigate(`/editor/${doc.id}`);
      clickTimeoutRef.current = null;
    }, 250);
  }

  function handleTitleDoubleClick(doc) {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  }

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const publicCount = documents.filter(d => d.isPublic).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 w-full glass shadow-lg shadow-slate-200/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-8 w-1.5 bg-slate-900 rounded-full group-hover:h-10 group-hover:bg-sky-500 transition-all duration-300" />
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">BlockNote</span>
            </Link>
            <div className="hidden lg:flex items-center gap-2 p-1 bg-slate-100/50 rounded-xl">
              <div className="px-3 py-1.5 rounded-lg bg-white text-[10px] font-bold text-slate-900 shadow-sm border border-slate-200/50 uppercase tracking-widest">Workspace</div>
              <ChevronRight size={10} className="text-slate-400" />
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Hub</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 active:scale-95 shadow-sm"
            >
              <LogOut size={14} />
              Exit Session
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-12">
        {/* Welcome Section */}
        <header className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100"
            >
              <Sparkles size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cloud Workspace Ready</span>
            </motion.div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Your Digital Garden.</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-lg">Where ideas grow into systems. Access all your professional drafts and synchronized documents.</p>
          </div>
          <div className="flex items-center gap-8 glass p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Your Assets</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight">{documents.length}</span>
            </div>
          </div>
        </header>

        {/* Global Actions */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between h-14">
          <div className="relative flex-1 group max-w-xl h-full">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-sky-500" />
            <input
              placeholder="Query documents by title..."
              className="w-full h-full rounded-[1.5rem] border border-slate-200 bg-white py-4 pl-16 pr-8 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-sky-500 focus:ring-8 focus:ring-sky-500/5 placeholder:text-slate-300 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 border border-slate-200/50 rounded-2xl h-full">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 h-full rounded-xl transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Gallery</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 h-full rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
            >
              <ListIcon size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Compact</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col h-96 items-center justify-center gap-4">
            <Loader2 size={40} className="animate-spin text-sky-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Workspace</p>
          </div>
        ) : error ? (
          <div className="rounded-[3.5rem] border border-rose-100 bg-white p-16 text-center shadow-2xl flex flex-col items-center max-w-2xl mx-auto">
            <div className="h-20 w-20 rounded-[2rem] bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Protocol Violation</h2>
            <p className="font-bold text-slate-400 mb-10 leading-relaxed tabular-nums">{error}</p>
            {error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('token') ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
              >
                Reconnect to System
              </motion.button>
            ) : (
              <button
                onClick={refreshDocuments}
                className="px-10 py-5 bg-sky-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-sky-500/10 hover:bg-sky-600 transition-all"
              >
                Retry Handshake
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-24">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-8 w-1.5 bg-slate-900 rounded-full" />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Private Laboratory</h2>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-4"}
              >
                {/* Create New Card */}
                <motion.div
                  variants={itemVariants}
                  className={`group relative rounded-[3rem] bg-white border-2 border-dashed border-slate-200 p-8 transition-all hover:border-sky-500 shadow-sm hover:shadow-sky-500/5 hover:bg-sky-50/5 ${viewMode === 'list' ? 'flex items-center justify-between p-6' : 'flex flex-col items-center justify-center aspect-square'}`}
                >
                  <div className="flex flex-col items-center w-full">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-sky-400 shadow-xl shadow-slate-900/10 cursor-pointer"
                    >
                      <Plus size={36} />
                    </motion.div>
                    <div className="w-full text-center space-y-4">
                      <input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="Document Title..."
                        className="w-full bg-transparent text-center text-sm font-black uppercase tracking-widest text-slate-900 outline-none placeholder:text-slate-300 focus:placeholder:text-sky-200"
                      />
                      <button
                        onClick={handleCreate}
                        className="w-full rounded-2xl bg-sky-500 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-sky-600 active:scale-95 shadow-lg shadow-sky-500/20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                      >
                        Quick Deployment
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Document Cards */}
                <AnimatePresence mode="popLayout">
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      variants={itemVariants}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group relative rounded-[3rem] bg-white border border-slate-200/50 p-8 transition-all hover:-translate-y-2 hover:border-sky-500/30 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] ${viewMode === 'list' ? 'flex items-center justify-between p-6' : 'flex flex-col justify-between aspect-square'}`}
                    >
                      <div className="relative">
                        <div className="flex items-start justify-between mb-8">
                          <div className="h-14 w-14 flex items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-sky-400 transition-all duration-500">
                            <FileText size={28} />
                          </div>
                          <div className="flex gap-2">
                            {doc.isPublic && (
                              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Public
                              </div>
                            )}
                          </div>
                        </div>

                        {editingId === doc.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRename(doc.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(doc.id)}
                            className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none border-b-2 border-sky-500 pb-2"
                          />
                        ) : (
                          <div className="space-y-4">
                            <h3
                              onClick={() => handleTitleClick(doc)}
                              onDoubleClick={() => handleTitleDoubleClick(doc)}
                              className="text-2xl font-black text-slate-900 tracking-tight leading-tight cursor-pointer hover:text-sky-500 transition-colors line-clamp-2"
                            >
                              {doc.title}
                            </h3>
                            <div className="flex items-center gap-3 text-slate-400">
                              <Clock size={14} className="group-hover:text-sky-500 transition-colors" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                                Revision: {new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-10' : ''}`}>
                        <button
                          onClick={() => navigate(`/editor/${doc.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-[1.2rem] bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-500/20 active:scale-95"
                        >
                          <ExternalLink size={14} />
                          Explore
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingId(doc.id); setEditingTitle(doc.title); }}
                            className="rounded-[1.2rem] bg-slate-50 border border-slate-100 p-4 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:border-slate-200 active:scale-95"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-[1.2rem] bg-slate-50 border border-slate-100 p-4 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>


          </div>
        )}
      </div>
    </main>
  );
}
