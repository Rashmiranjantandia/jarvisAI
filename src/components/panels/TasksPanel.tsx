"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Tag,
  Calendar,
  Filter,
  X,
  CircleDot,
} from "lucide-react";
import { useJarvisStore } from "@/store/jarvis-store";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskPriority, Task } from "@/lib/types";
import { toast } from "sonner";

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  critical: {
    label: "Critical",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
  },
  high: {
    label: "High",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    dot: "bg-orange-400",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-400",
  },
  low: {
    label: "Low",
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    dot: "bg-green-400",
  },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-cyan-400" },
  in_progress: { label: "In Progress", color: "text-blue-400" },
  completed: { label: "Completed", color: "text-green-400" },
  cancelled: { label: "Cancelled", color: "text-red-400/50" },
};

function TaskCard({ task, onUpdate, onDelete }: {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const priority = PRIORITY_CONFIG[task.priority];
  const isCompleted = task.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={cn(
        "p-4 rounded-xl border transition-all group",
        isCompleted
          ? "bg-cyan-500/3 border-cyan-500/5 opacity-60"
          : "glass border-cyan-500/10 hover:border-cyan-500/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() =>
            onUpdate(task.id, {
              status: isCompleted ? "pending" : "completed",
            })
          }
          className="mt-0.5 flex-shrink-0 text-cyan-400/40 hover:text-cyan-300 transition-colors"
        >
          {isCompleted ? (
            <CheckSquare className="w-4 h-4 text-green-400" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium leading-tight",
                isCompleted ? "line-through text-cyan-400/40" : "text-cyan-100"
              )}
            >
              {task.title}
            </p>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded text-red-400/40 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {task.description && (
            <p className="text-xs text-cyan-400/40 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                priority.color
              )}
            >
              {priority.label}
            </span>

            <div className="flex items-center gap-1">
              <select
                value={task.status}
                onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
                className="text-[10px] bg-transparent text-cyan-400/60 border-none outline-none cursor-pointer hover:text-cyan-300 transition-colors"
              >
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                  <option key={s} value={s} className="bg-[#041020] text-cyan-300">
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {task.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-[10px] text-cyan-400/40 bg-cyan-500/5 px-1.5 py-0.5 rounded"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}

            {task.dueDate && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-400/40">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AddTaskForm({ onAdd, onCancel }: {
  onAdd: (task: { title: string; description: string; priority: TaskPriority; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: description.trim(), priority, tags });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass panel-glow rounded-xl p-4 space-y-3 border border-cyan-500/20"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
          New Operation
        </h3>
        <button onClick={onCancel} className="text-cyan-400/40 hover:text-cyan-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Task title..."
        className="w-full bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-2 text-sm text-cyan-100 placeholder-cyan-400/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)..."
        rows={2}
        className="w-full bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-2 text-sm text-cyan-100 placeholder-cyan-400/30 focus:outline-none focus:border-cyan-500/40 transition-colors resize-none"
      />

      <div className="flex items-center gap-3">
        <label className="text-[11px] text-cyan-400/50 uppercase tracking-wider">Priority</label>
        <div className="flex gap-2">
          {(["low", "medium", "high", "critical"] as TaskPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-all",
                priority === p ? PRIORITY_CONFIG[p].color : "text-cyan-400/30 border-cyan-500/10 hover:border-cyan-500/20"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder="Add tag..."
          className="flex-1 bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-1.5 text-xs text-cyan-100 placeholder-cyan-400/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
        />
        <button
          onClick={addTag}
          className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-cyan-400/60 hover:text-cyan-300 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[10px] bg-cyan-500/10 border border-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-full"
            >
              {tag}
              <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="flex-1 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Operation
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-cyan-500/10 text-cyan-400/50 text-sm hover:text-cyan-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

export default function TasksPanel() {
  const { tasks, addTask, updateTask, deleteTask, incrementStat, addActivity } = useJarvisStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const handleAdd = (task: { title: string; description: string; priority: TaskPriority; tags: string[] }) => {
    addTask({ ...task, status: "pending" });
    setShowAdd(false);
    addActivity({ type: "task", title: "Task Added", description: task.title });
    toast.success("Operation queued.");
  };

  const handleUpdate = (id: string, updates: Partial<Task>) => {
    updateTask(id, updates);
    if (updates.status === "completed") {
      incrementStat("tasksCompleted");
      addActivity({ type: "task", title: "Task Completed", description: tasks.find((t) => t.id === id)?.title ?? "" });
      toast.success("Operation marked complete.");
    }
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    toast.success("Operation removed.");
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-[11px] text-cyan-400/50 uppercase tracking-[0.2em] mb-1">
            Operations Center
          </p>
          <h2 className="text-xl font-bold text-white">
            Task <span className="neon-text">Management</span>
          </h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-sm font-medium hover:bg-cyan-500/25 hover:shadow-neon-blue transition-all"
        >
          <Plus className="w-4 h-4" />
          New Operation
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { key: "all", label: "Total" },
          { key: "pending", label: "Pending" },
          { key: "in_progress", label: "Active" },
          { key: "completed", label: "Done" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as typeof filter)}
            className={cn(
              "p-3 rounded-xl text-center transition-all border",
              filter === item.key
                ? "glass-strong border-cyan-500/30"
                : "glass border-cyan-500/8 hover:border-cyan-500/20"
            )}
          >
            <p className="text-xl font-bold text-white tabular-nums">
              {counts[item.key as keyof typeof counts]}
            </p>
            <p className="text-[10px] text-cyan-400/50 uppercase tracking-wider mt-0.5">
              {item.label}
            </p>
          </button>
        ))}
      </motion.div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <AddTaskForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
        )}
      </AnimatePresence>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-cyan-400/40" />
        <div className="flex gap-1.5">
          {(["all", "pending", "in_progress", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[11px] px-3 py-1 rounded-full transition-all border",
                filter === f
                  ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300"
                  : "border-cyan-500/10 text-cyan-400/40 hover:text-cyan-300 hover:border-cyan-500/20"
              )}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <CircleDot className="w-10 h-10 text-cyan-400/20" />
              <p className="text-sm text-cyan-400/40">
                {filter === "all"
                  ? "No operations queued. Add one above."
                  : `No ${filter.replace("_", " ")} operations.`}
              </p>
            </motion.div>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
