"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  Pin,
  Trash2,
  Search,
  Tag,
  X,
  Edit3,
  Save,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/types";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

function NoteCard({
  note,
  active,
  onSelect,
}: {
  note: Note;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        active
          ? "glass-strong border-cyan-500/30"
          : "glass border-cyan-500/8 hover:border-cyan-500/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-cyan-200 truncate">{note.title || "Untitled"}</p>
        {note.pinned && <Pin className="w-3 h-3 text-cyan-400/60 flex-shrink-0 mt-0.5" />}
      </div>
      <p className="text-[11px] text-cyan-400/40 mt-1 line-clamp-2">
        {note.content || "Empty note"}
      </p>
      <p className="text-[10px] text-cyan-400/25 mt-2 font-mono">
        {new Date(note.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </motion.button>
  );
}

export default function NotesPanel() {
  const { notes, addNote, updateNote, deleteNote, addActivity } = useJarvisStore();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    notes[0]?.id ?? null
  );
  const [search, setSearch] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
  // Pinned first
  const sortedNotes = [...filteredNotes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // Load active note into edit state
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      setEditTags(activeNote.tags);
      setIsDirty(false);
    }
  }, [activeNoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, {
      title: editTitle,
      content: editContent,
      tags: editTags,
    });
    setIsDirty(false);
    toast.success("Note saved.");
    addActivity({ type: "note", title: "Note Updated", description: editTitle });
  };

  const handleNew = () => {
    addNote({
      title: "Untitled Note",
      content: "",
      tags: [],
      pinned: false,
    });
    const newNote = useJarvisStore.getState().notes[0];
    setActiveNoteId(newNote.id);
    addActivity({ type: "note", title: "Note Created", description: "New note" });
    toast.success("New note created.");
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    if (activeNoteId === id) {
      setActiveNoteId(notes.find((n) => n.id !== id)?.id ?? null);
    }
    toast.success("Note deleted.");
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !editTags.includes(t)) {
      const newTags = [...editTags, t];
      setEditTags(newTags);
      setTagInput("");
      setIsDirty(true);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Note list sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col h-full glass-strong border-r border-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-cyan-500/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-cyan-400/50 uppercase tracking-wider font-medium">
              Intelligence Notes
            </span>
            <button
              onClick={handleNew}
              className="p-1 rounded text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-400/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-cyan-500/5 border border-cyan-500/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-cyan-200 placeholder-cyan-400/30 focus:outline-none focus:border-cyan-500/30 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <AnimatePresence>
            {sortedNotes.length === 0 ? (
              <p className="text-[11px] text-cyan-400/30 text-center py-6">No notes found</p>
            ) : (
              sortedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  active={note.id === activeNoteId}
                  onSelect={() => setActiveNoteId(note.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-500/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Edit3 className="w-4 h-4 text-cyan-400/40" />
                <span className="text-xs text-cyan-400/40 font-mono">
                  {formatDate(new Date(activeNote.updatedAt))}
                </span>
                {isDirty && (
                  <span className="text-[10px] text-yellow-400/60 bg-yellow-500/10 border border-yellow-500/15 px-2 py-0.5 rounded-full">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateNote(activeNote.id, { pinned: !activeNote.pinned })
                  }
                  className={cn(
                    "p-1.5 rounded-lg transition-all border",
                    activeNote.pinned
                      ? "bg-cyan-500/15 border-cyan-500/20 text-cyan-300"
                      : "border-cyan-500/8 text-cyan-400/30 hover:text-cyan-300 hover:border-cyan-500/20"
                  )}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                {isDirty && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-xs font-medium hover:bg-cyan-500/25 transition-all"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                )}
                <button
                  onClick={() => handleDelete(activeNote.id)}
                  className="p-1.5 rounded-lg border border-red-500/10 text-red-400/30 hover:text-red-400 hover:border-red-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <input
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  setIsDirty(true);
                }}
                onBlur={handleSave}
                placeholder="Note title..."
                className="w-full bg-transparent text-2xl font-bold text-cyan-100 placeholder-cyan-400/20 focus:outline-none border-b border-cyan-500/10 pb-3"
              />

              <textarea
                ref={contentRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setIsDirty(true);
                }}
                onBlur={handleSave}
                placeholder="Start writing... (supports plain text)"
                className="w-full flex-1 bg-transparent text-sm text-cyan-100/80 placeholder-cyan-400/20 focus:outline-none resize-none min-h-[300px] leading-relaxed"
              />

              {/* Tags */}
              <div className="space-y-2 pt-4 border-t border-cyan-500/8">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-cyan-400/40" />
                  <span className="text-[11px] text-cyan-400/40 uppercase tracking-wider">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[11px] bg-cyan-500/10 border border-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          setEditTags(editTags.filter((t) => t !== tag));
                          setIsDirty(true);
                        }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="+ tag"
                      className="bg-transparent text-[11px] text-cyan-400/60 placeholder-cyan-400/20 focus:outline-none w-16"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <FileText className="w-12 h-12 text-cyan-400/20" />
            <div>
              <p className="text-sm font-medium text-cyan-300/60">No note selected</p>
              <p className="text-xs text-cyan-400/30 mt-1">
                Select a note from the sidebar or create a new one.
              </p>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
