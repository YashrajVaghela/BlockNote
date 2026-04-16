import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getDocument,
    getDocumentBlocks,
    syncDocumentBlocks,
    updateDocument
} from '../api.js';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Plus,
    Trash2,
    CheckSquare,
    Square,
    Code,
    Type,
    Heading1,
    Heading2,
    Image as ImageIcon,
    Minus,
    Share2,
    ChevronLeft,
    Save,
    Loader2
} from 'lucide-react';

// --- Constants ---
const AUTO_SAVE_DELAY = 1000;
const ALLOWED_TYPES = ['paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image'];

export function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [docData, setDocData] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingStatus, setSavingStatus] = useState('idle'); // 'saving' | 'saved' | 'idle'
    const [showSlashMenu, setShowSlashMenu] = useState({ visible: false, blockId: null, query: '' });
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [focusTarget, setFocusTarget] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const saveTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    const blocksRef = useRef([]);

    // Keep ref in sync for event handlers
    useEffect(() => {
        blocksRef.current = blocks;
    }, [blocks]);

    useEffect(() => {
        if (focusTarget) {
            const el = document.getElementById(`block-${focusTarget.id}`);
            if (el) {
                el.focus();
                if (focusTarget.type === 'code') {
                    el.selectionStart = el.selectionEnd = 0;
                } else {
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (el.childNodes.length > 0) {
                        range.setStart(el.childNodes[0], 0);
                    } else {
                        range.setStart(el, 0);
                    }
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                setFocusTarget(null);
            }
        }
    }, [focusTarget, blocks]);

    // Load document and blocks
    useEffect(() => {
        async function loadData() {
            try {
                const doc = await getDocument(id);
                const fetchedBlocks = await getDocumentBlocks(id);
                setDocData(doc);
                setBlocks(fetchedBlocks.length > 0 ? fetchedBlocks : [
                    { id: 'initial', type: 'paragraph', content: { text: '' }, orderIndex: 1 }
                ]);
                setLoading(false);
            } catch (err) {
                if (err.message.includes('403') || err.message === 'Forbidden') {
                    navigate('/dashboard');
                } else {
                    setError(err.message);
                }
                setLoading(false);
            }
        }
        loadData();
    }, [id, navigate]);

    const handleTitleChange = async (newTitle) => {
        setDocData(prev => ({ ...prev, title: newTitle }));
        try {
            await updateDocument(id, { title: newTitle });
        } catch (err) {
            console.error('Failed to update title:', err);
        }
    };

    // --- Auto-Save Logic ---
    const triggerSave = useCallback(() => {
        setSavingStatus('saving');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
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

    // --- Block Handlers ---
    const updateBlockContent = (blockId, newContent) => {
        setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...newContent } } : b));
        triggerSave();
    };

    const deleteBlock = (blockId) => {
        if (blocks.length <= 1) return;
        setBlocks(prev => prev.filter(b => b.id !== blockId));
        triggerSave();
    };

    const addBlock = (afterBlockId, type = 'paragraph') => {
        setBlocks(current => {
            const index = current.findIndex(b => b.id === afterBlockId);
            const prevBlock = current[index];
            const nextBlock = current[index + 1];

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

            // Check for re-normalization
            if (nextBlock && (nextBlock.orderIndex - prevBlock.orderIndex) < 0.001) {
                return newItems.map((b, i) => ({ ...b, orderIndex: i + 1 }));
            }
            return newItems;
        });
        triggerSave();
    };

    const handleBlockKeyDown = (e, block, elRef) => {
        if (showSlashMenu.visible && showSlashMenu.blockId === block.id) {
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowSlashMenu({ visible: false, blockId: null, query: '' });
                return;
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setShowSlashMenu(prev => ({ ...prev, query: prev.query + e.key }));
                return;
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                if (showSlashMenu.query.length === 0) {
                    setShowSlashMenu({ visible: false, blockId: null, query: '' });
                } else {
                    setShowSlashMenu(prev => ({ ...prev, query: prev.query.slice(0, -1) }));
                }
                return;
            } else if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            let beforeText = '';
            let afterText = '';
            let shouldSplit = false;

            if (['paragraph', 'heading_1', 'heading_2', 'todo'].includes(block.type)) {
                e.preventDefault();
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const text = elRef.current.innerText;
                const cursorOffset = range.startOffset;
                beforeText = text.slice(0, cursorOffset);
                afterText = text.slice(cursorOffset);
                shouldSplit = true;
            } else if (block.type === 'code') {
                if (e.ctrlKey) {
                    e.preventDefault();
                    const start = elRef.current.selectionStart;
                    const end = elRef.current.selectionEnd;
                    const val = elRef.current.value;
                    beforeText = val.substring(0, start);
                    afterText = val.substring(end);
                    shouldSplit = true;
                }
            } else if (['divider', 'image'].includes(block.type)) {
                e.preventDefault();
                shouldSplit = true;
                beforeText = null;
                afterText = '';
            }

            if (shouldSplit) {
                const newBlockType = 'paragraph';

                if (beforeText !== null && elRef.current && elRef.current.innerText !== beforeText) {
                    elRef.current.innerText = beforeText;
                }

                setBlocks(current => {
                    const index = current.findIndex(b => b.id === block.id);
                    const prevBlock = current[index];
                    const nextBlock = current[index + 1];
                    const newOrderIndex = nextBlock ? (prevBlock.orderIndex + nextBlock.orderIndex) / 2 : prevBlock.orderIndex + 1;

                    const newBlock = {
                        id: `temp-${Date.now()}`,
                        type: newBlockType,
                        content: { text: afterText },
                        orderIndex: newOrderIndex
                    };

                    const newItems = [...current];
                    if (beforeText !== null) {
                        newItems[index] = { ...newItems[index], content: { ...newItems[index].content, text: beforeText } };
                    }
                    newItems.splice(index + 1, 0, newBlock);

                    setFocusTarget({ id: newBlock.id, type: newBlock.type });

                    return newItems;
                });
                triggerSave();
                return;
            }
        }

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
                if (block.type === 'image') {
                    // Check actual input value if focused
                    isEmpty = (e.target.tagName === 'INPUT') ? !e.target.value : !block.content.url;
                } else if (block.type === 'divider') {
                    isEmpty = true; // Dividers are always "empty" for deletion purposes
                } else {
                    isEmpty = !block.content.text || block.content.text.length === 0;
                }

                if (isEmpty && currentIndex > 0) {
                    e.preventDefault();
                    const prevBlock = blocks[currentIndex - 1];
                    deleteBlock(block.id);

                    setTimeout(() => {
                        const prevEl = document.getElementById(`block-${prevBlock.id}`);
                        if (prevEl) {
                            prevEl.focus();
                            if (prevBlock.type === 'code') {
                                prevEl.selectionStart = prevEl.selectionEnd = prevEl.value.length;
                            } else if (prevBlock.type === 'divider' || prevBlock.type === 'image') {
                                // Just focus, can't set text selection
                            } else {
                                const sel = window.getSelection();
                                const newRange = document.createRange();
                                if (prevEl.childNodes.length > 0) {
                                    const lastNode = prevEl.childNodes[prevEl.childNodes.length - 1];
                                    newRange.setStart(lastNode, lastNode.nodeType === 3 ? lastNode.length : 1);
                                } else {
                                    newRange.setStart(prevEl, 0);
                                }
                                newRange.collapse(true);
                                sel.removeAllRanges();
                                sel.addRange(newRange);
                            }
                        }
                    }, 0);
                    return;
                }

                if (currentIndex === 0) {
                    if (block.type !== 'paragraph') {
                        e.preventDefault();
                        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'paragraph' } : b));
                        triggerSave();
                        return;
                    }
                }
            }
        }

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
                e.preventDefault();
                setShowSlashMenu({ visible: true, blockId: block.id, query: '' });
            }
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                const prev = newItems[newIndex - 1];
                const next = newItems[newIndex + 1];
                let newOrder;

                if (!prev) newOrder = (next?.orderIndex || 1) - 1;
                else if (!next) newOrder = prev.orderIndex + 1;
                else newOrder = (prev.orderIndex + next.orderIndex) / 2;

                newItems[newIndex] = { ...newItems[newIndex], orderIndex: newOrder };

                if ((next && prev && (next.orderIndex - prev.orderIndex) < 0.001)) {
                    return newItems.map((item, i) => ({ ...item, orderIndex: i + 1 }));
                }

                return newItems;
            });
            triggerSave();
        }
    };

    const handleShareToggle = async () => {
        try {
            const updated = await updateDocument(id, { isPublic: !docData.isPublic });
            setDocData(updated);
        } catch (err) {
            console.error('Failed to toggle share:', err);
        }
    };

    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center gap-4 bg-slate-50">
            <Loader2 className="animate-spin text-sky-500" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Initializing Engine</p>
        </div>
    );
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
            <div className="glass p-12 rounded-[3rem] text-center shadow-xl">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Protocol Error</h2>
                <p className="font-bold text-rose-600">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Return to Base</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-sky-50/60 to-rose-100/60 relative selection:bg-sky-200">
            {/* Animated Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-rose-300/20 blur-[120px] mix-blend-multiply opacity-50" />
                <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-sky-300/20 blur-[120px] mix-blend-multiply opacity-50" />
                <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-indigo-300/20 blur-[120px] mix-blend-multiply opacity-50" />
            </div>

            <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/80 shadow-sm relative">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="group flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 p-2.5 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:border-slate-200 active:scale-95 shadow-sm">
                            <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-px bg-slate-100 hidden sm:block" />
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={savingStatus}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-3 px-4 py-2 rounded-[1rem] bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-inner"
                                >
                                    {savingStatus === 'saving' ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin text-sky-400" />
                                            <span className="text-slate-400">Syncing to Cloud</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} className="text-emerald-500" />
                                            <span className="text-emerald-500">Live Synchronized</span>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className={`group flex items-center gap-3 rounded-[1.2rem] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${docData.isPublic ? 'bg-sky-500 text-white shadow-sky-500/20 hover:bg-sky-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                        >
                            <Share2 size={16} className={docData.isPublic ? 'animate-pulse' : ''} />
                            {docData.isPublic ? 'Global Ready' : 'Publish Asset'}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showShareMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute right-6 top-[4.5rem] w-[400px] p-6 rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] z-[60]"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="space-y-1">
                                    <h3 className="font-black text-slate-900 tracking-tight text-lg leading-tight">Asset Distribution</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Control visibility protocols</p>
                                </div>
                                <button
                                    onClick={handleShareToggle}
                                    className={`rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${docData.isPublic ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-black/10'}`}
                                >
                                    {docData.isPublic ? 'Disconnect' : 'Activate Public'}
                                </button>
                            </div>
                            {docData.isPublic && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-2 pl-4"
                                >
                                    <input
                                        readOnly
                                        value={`${window.location.origin}/share/${docData.shareToken}`}
                                        className="flex-1 bg-transparent text-[11px] font-bold text-slate-500 outline-none selection:bg-sky-100 font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/share/${docData.shareToken}`);
                                        }}
                                        className="rounded-xl bg-slate-900 px-5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-black active:scale-95 uppercase tracking-widest"
                                    >
                                        Copy Link
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto max-w-5xl px-4 sm:px-8 py-12 pb-64 relative"
            >
                <div className="bg-white/80 backdrop-blur-3xl border border-white p-8 sm:p-16 rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] min-h-[75vh]">
                    <div className="mb-16 group/title relative">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                        >
                            <input
                                value={docData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="w-full text-6xl font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-100 caret-sky-500 tracking-tighter"
                                placeholder="Untitled Resource"
                            />
                        </motion.div>
                        <div className="h-2 w-0 group-focus-within/title:w-20 bg-sky-500 transition-all duration-700 rounded-full mt-6" />
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={blocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-1">
                                <AnimatePresence mode="popLayout">
                                    {blocks.map((block) => (
                                        <BlockItem
                                            key={block.id}
                                            block={block}
                                            updateContent={(c) => updateBlockContent(block.id, c)}
                                            onKeyDown={(e, ref) => handleBlockKeyDown(e, block, ref)}
                                            deleteBlock={() => deleteBlock(block.id)}
                                            addBlock={() => addBlock(block.id)}
                                            setType={(type) => {
                                                setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type, content: { text: '' } } : b));
                                                triggerSave();
                                            }}
                                        />
                                    ))}
                                </AnimatePresence>

                                <button
                                    onClick={() => addBlock(blocks[blocks.length - 1].id)}
                                    className="flex items-center gap-3 w-full py-4 px-6 rounded-[2rem] border border-slate-50 text-slate-200 hover:bg-slate-50/50 hover:text-sky-500 hover:border-sky-50 transition-all duration-300 group mt-10"
                                >
                                    <div className="ml-auto flex items-center gap-3 group-hover:scale-105 transition-transform">
                                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors shadow-sm">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Append Component</span>
                                    </div>
                                    <div className="mr-auto" />
                                </button>
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </motion.main>

            {showSlashMenu.visible && (
                <SlashMenu
                    query={showSlashMenu.query}
                    onSelect={(type) => {
                        setBlocks(prev => prev.map(b => b.id === showSlashMenu.blockId ? { ...b, type, content: { text: '' } } : b));
                        setShowSlashMenu({ visible: false, blockId: null, query: '' });
                        triggerSave();
                        setTimeout(() => {
                            const el = document.getElementById(`block-${showSlashMenu.blockId}`);
                            if (el) el.focus();
                        }, 0);
                    }}
                    close={() => setShowSlashMenu({ visible: false, blockId: null, query: '' })}
                />
            )}
        </div>
    );
}

function BlockItem({ block, updateContent, onKeyDown, deleteBlock, addBlock, setType }) {
    const contentRef = useRef(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 'auto',
    };

    useEffect(() => {
        if (contentRef.current && block.content.text !== contentRef.current.innerText && block.type !== 'code') {
            contentRef.current.innerText = block.content.text || '';
        }
    }, [block.type, block.content.text]);

    const handleInput = (e) => {
        updateContent({ text: e.target.innerText });
    };

    const renderContent = () => {
        switch (block.type) {
            case 'heading_1':
                return (
                    <div
                        id={`block-${block.id}`}
                        ref={contentRef}
                        contentEditable
                        className="w-full text-5xl font-black text-slate-900 outline-none tracking-tighter leading-tight empty:before:content-[attr(data-placeholder)] empty:before:text-slate-100 empty:before:pointer-events-none"
                        data-placeholder="Main Heading"
                        onInput={handleInput}
                        onKeyDown={(e) => onKeyDown(e, contentRef)}
                    />
                );
            case 'heading_2':
                return (
                    <div
                        id={`block-${block.id}`}
                        ref={contentRef}
                        contentEditable
                        className="w-full text-3xl font-black text-slate-800 outline-none tracking-tight empty:before:content-[attr(data-placeholder)] empty:before:text-slate-100 empty:before:pointer-events-none"
                        data-placeholder="Sub Heading"
                        onInput={handleInput}
                        onKeyDown={(e) => onKeyDown(e, contentRef)}
                    />
                );
            case 'todo':
                return (
                    <div className="flex items-start gap-4 group/todo">
                        <button
                            onClick={() => updateContent({ checked: !block.content.checked })}
                            className={`mt-1.5 transition-all duration-300 active:scale-90 ${block.content.checked ? 'text-sky-500' : 'text-slate-200 hover:text-slate-400'}`}
                        >
                            {block.content.checked ? <CheckSquare size={22} className="fill-sky-50" /> : <Square size={22} />}
                        </button>
                        <div
                            id={`block-${block.id}`}
                            ref={contentRef}
                            contentEditable
                            className={`w-full text-xl font-medium leading-relaxed outline-none transition-all duration-300 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-100 empty:before:pointer-events-none ${block.content.checked ? 'text-slate-300 line-through decoration-slate-200 decoration-2' : 'text-slate-600'}`}
                            data-placeholder="Task Description"
                            onInput={handleInput}
                            onKeyDown={(e) => onKeyDown(e, contentRef)}
                        />
                    </div>
                );
            case 'code':
                return (
                    <div className="rounded-[2rem] bg-slate-900 p-8 font-mono text-[14px] text-sky-400 shadow-2xl shadow-slate-900/10 relative group/code border border-slate-800 my-6">
                        <div className="absolute right-8 top-8 text-slate-700 flex items-center gap-3">
                            <span className="text-[10px] uppercase font-black tracking-widest">Protocol Buffer</span>
                            <Code size={16} />
                        </div>
                        <textarea
                            id={`block-${block.id}`}
                            ref={contentRef}
                            className="w-full bg-transparent outline-none resize-none overflow-hidden caret-sky-500 leading-relaxed font-mono"
                            rows={Math.max(3, (block.content.text || '').split('\n').length)}
                            value={block.content.text || ''}
                            onChange={(e) => updateContent({ text: e.target.value })}
                            onBlur={() => updateContent({ text: contentRef.current.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                    e.preventDefault();
                                    const start = e.target.selectionStart;
                                    const end = e.target.selectionEnd;
                                    const val = e.target.value;
                                    const newVal = val.substring(0, start) + "  " + val.substring(end);
                                    updateContent({ text: newVal });
                                    setTimeout(() => {
                                        e.target.selectionStart = e.target.selectionEnd = start + 2;
                                    }, 0);
                                } else {
                                    onKeyDown(e, contentRef);
                                }
                            }}
                            placeholder="// Enter logic sequence here..."
                        />
                    </div>
                );
            case 'divider':
                return (
                    <div
                        id={`block-${block.id}`}
                        tabIndex="0"
                        className="py-8 outline-none focus:ring-2 focus:ring-sky-500/20 rounded-lg group/divider"
                        onKeyDown={(e) => onKeyDown(e, null)}
                    >
                        <div className="h-1 bg-slate-50 w-full rounded-full transition-colors group-focus/divider:bg-sky-500/20" />
                    </div>
                );
            case 'image':
                return (
                    <div className="group/image relative rounded-[3rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-100 p-12 text-center transition-all hover:border-sky-200 hover:bg-sky-50/10 my-8">
                        {block.content.url ? (
                            <div className="relative inline-block mx-auto group/imgwrapper">
                                <img src={block.content.url} alt="Uploaded" className="mx-auto rounded-[2rem] max-h-[600px] shadow-2xl transition-transform duration-700 group-hover/imgwrapper:scale-[1.02]" />
                                <button onClick={() => updateContent({ url: '' })} className="absolute top-6 right-6 rounded-3xl bg-black/60 backdrop-blur-xl p-4 text-white hover:bg-rose-500 transition-all opacity-0 group-hover/image:opacity-100 active:scale-95 shadow-xl">
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center text-sky-500">
                                    <ImageIcon size={32} />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-black text-slate-900 text-lg uppercase tracking-tight">Direct Asset Link</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Supports PNG, JPG, GIF</p>
                                </div>
                                <input
                                    id={`block-${block.id}`}
                                    type="text"
                                    placeholder="https://source.unsplash.com/..."
                                    className="w-full max-w-sm rounded-[1.5rem] border border-slate-100 bg-white px-6 py-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:ring-8 focus:ring-sky-500/5 focus:border-sky-500 shadow-sm"
                                    onChange={(e) => updateContent({ url: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            // Already saved by onChange, but Enter can still trigger other things
                                        } else {
                                            onKeyDown(e, contentRef);
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div
                        id={`block-${block.id}`}
                        ref={contentRef}
                        contentEditable
                        className="w-full text-2xl leading-relaxed text-slate-600 outline-none selection:bg-sky-100 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-100 empty:before:pointer-events-none font-medium"
                        data-placeholder="Start your narrative or type '/' for structural commands..."
                        onInput={handleInput}
                        onKeyDown={(e) => onKeyDown(e, contentRef)}
                    />
                );
        }
    };

    return (
        <motion.div
            layout
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group relative flex items-start gap-6 py-2 transition-all duration-500 ${isDragging ? 'z-50 opacity-50 bg-sky-50/50 rounded-3xl' : 'opacity-100'}`}
        >
            <div className="absolute -left-20 top-0 bottom-0 flex opacity-0 group-hover:opacity-100 transition-all duration-300 items-start pt-3 gap-2 translate-x-4 group-hover:translate-x-0 z-10">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-slate-200 hover:text-slate-900 active:cursor-grabbing p-2.5 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                    <GripVertical size={20} />
                </button>
                <button
                    onClick={() => addBlock()}
                    className="text-slate-200 hover:text-sky-500 p-2.5 rounded-2xl hover:bg-sky-50 transition-all active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="w-full transition-all duration-500 group-hover:pl-2">
                {renderContent()}
            </div>

            <div className="absolute -right-16 top-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                    onClick={deleteBlock}
                    className="text-slate-200 hover:text-rose-500 p-2.5 rounded-2xl hover:bg-rose-50 transition-all active:scale-95"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </motion.div>
    );
}

function SlashMenu({ onSelect, close, query }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);

    const allItems = [
        { type: 'paragraph', label: 'Primary Text', icon: Type, description: 'Commence drafting with standard prose.' },
        { type: 'heading_1', label: 'Alpha Heading', icon: Heading1, description: 'Maximum impact section header.' },
        { type: 'heading_2', label: 'Beta Heading', icon: Heading2, description: 'Sub-level structural break.' },
        { type: 'todo', label: 'Task Sequence', icon: CheckSquare, description: 'Interactive project task list.' },
        { type: 'code', label: 'Logic Block', icon: Code, description: 'Encapsulated code environment.' },
        { type: 'divider', label: 'Visual Break', icon: Minus, description: 'Clean horizontal separation.' },
        { type: 'image', label: 'Visual Asset', icon: ImageIcon, description: 'Remote image resource link.' },
    ];

    const filteredItems = allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex].type);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, onSelect, close]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                close();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [close]);

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed z-[100] w-80 max-h-96 overflow-y-auto rounded-[2.5rem] border border-slate-200 bg-white p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)]"
            style={{
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '10%'
            }}
        >
            <div className="px-5 py-3 border-b border-slate-50 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Structural Commands</span>
            </div>

            {filteredItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <Type size={20} />
                    </div>
                    <p className="text-sm text-slate-400 font-bold">No results for "{query}"</p>
                </div>
            ) : (
                filteredItems.map((item, index) => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center gap-4 rounded-[1.5rem] p-3 text-left transition-all duration-200 active:scale-[0.98] ${index === selectedIndex ? 'bg-slate-100 shadow-inner' : 'hover:bg-slate-50'}`}
                    >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${index === selectedIndex ? 'bg-white border-white shadow-lg text-sky-500 scale-110' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <item.icon size={22} />
                        </div>
                        <div>
                            <p className={`text-sm font-black tracking-tight transition-colors ${index === selectedIndex ? 'text-slate-900' : 'text-slate-600'}`}>{item.label}</p>
                            <p className="text-[11px] font-medium leading-tight text-slate-400">{item.description}</p>
                        </div>
                    </button>
                ))
            )}
        </motion.div>
    );
}
