'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

interface Reply {
    id: number;
    content: string;
    createdAt: string;
    userid: number;
    postId: number;
    user?: { username: string };
    translatedContent?: string;
}

interface Post {
    id: number;
    content: string;
    createdAt: string;
    editedAt?: string | null;
    isVisible: boolean;
    userid: number;
    user?: { username: string; };
    translatedContent?: string;
    replies: Reply[];
}

interface PollOption {
    id: number;
    text: string;
    votes: { id: number }[];
}

interface Poll {
    id: number;
    question: string;
    deadline: string;
    createdAt: string;
    userid: number;
    threadId: number;
    options: PollOption[];
    votes: { id: number; userid: number; optionId: number }[];
}

interface Tag {
    id: number,
    name: string,
}

interface Thread {
    id: number,
    title: string,
    isOpen: boolean,
    createdAt: string,
    isVisible: boolean,
    userid?: number | null,
    teamId?: number | null,
    matchId?: number | null,
    overallAverage?: number | null,
    posts: Post[],
    tags: Tag[],   
}

const PAGE_SIZE = 10;

function PageMessage({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="relative min-h-screen text-[var(--text-primary)]">
      <img
        src="/images/details-ball-sport.jpg"
        className="fixed inset-0 w-full h-full object-cover -z-10"
      />
      <div className="fixed inset-0 bg-[var(--overlay)] -z-10" />

      <div className="max-w-4xl mx-auto p-6">
        <div
          className={`rounded-2xl p-6 ${
            error
              ? "bg-red-900/30 border border-red-700/40 text-red-300"
              : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function format_date(date: string){
    const d = new Date(date);
    return {
        date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric"}),
        time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit"})
    };
}

function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
        isOpen
          ? "bg-green-500/15 text-green-300 border border-green-500/30"
          : "bg-red-500/15 text-red-300 border border-red-500/30"
      }`}
    >
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
        isVisible
          ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
          : "bg-slate-500/15 text-slate-300 border border-slate-500/30"
      }`}
    >
      {isVisible ? "Visible" : "Hidden"}
    </span>
  );
}

function EditThread({ thread, onClose, onSaved }: { thread?: Thread; onClose: () => void; onSaved: () => void}) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [isOpen, setIsOpen] = useState(thread?.isOpen);
    const [tagsInput, setTagsInput] = useState("");
    const [teamId, setTeamId] = useState("");
    const [matchId, setMatchId] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tags = tagsInput
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);

            const res = await fetch(`/api/threads/threadId/${thread?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, isOpen, tags, teamId: teamId ? Number(teamId) : null, 
                  matchId: matchId ? Number(matchId) : null }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to save thread");
                return;
            }
            onSaved();
            onClose();
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 2000);
        return () => clearTimeout(timer);
    }, [error]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50">
        <form
            onSubmit={handleSubmit}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl w-full max-w-lg space-y-4"
        >
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Thread</h2>
            
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-[var(--text-primary)] text-sm">
                    <span>⚠</span>
                    {error}
                </div>
            )}

            <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-600"
            />
            
            <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--text-muted)]">Thread Open</label>
                <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => setIsOpen(e.target.checked)}
                    className="h-4 w-4"
                />
            </div>

            <input
                placeholder="Tags (comma seperated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-600"
            />

            <input
                type="number"
                placeholder="Team ID"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-600"
            />

            <input
                type="number"
                placeholder="Match ID"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-600"
            />

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)]"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] hover:opacity-80 text-white disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </form>
        </div>
    );
}

function EditPost({ post, onClose, onSaved }: { post: Post; onClose: () => void; onSaved: () => void }) {
    const [content, setContent] = useState(post.content);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!content.trim()) return;
        setLoading(true);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1];

            const res = await fetch(`/api/posts/postId/${post.id}`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ content }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to edit post");
                return;
            }
            onSaved();
            onClose();
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 2000);
        return () => clearTimeout(timer);
    }, [error]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Post</h2>

                {error && (
                    <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>
                )}

                <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] resize-none h-32 transition-all"
                />

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] transition">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !content.trim() || content === post.content}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold disabled:opacity-50 transition"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ReportThread({ thread, onClose, onReported }: { 
    thread: Thread; 
    onClose: () => void; 
    onReported: () => void; 
}) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otherText, setOtherText] = useState("");

    const reasons = [
        "Spam",
        "Harassment",
        "Misinformation",
        "Inappropriate content",
        "Other",
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!reason) return;
        setLoading(true);

        const finalReason = reason === "Other" ? otherText : reason;
        try {
            const res = await fetch(`/api/users/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threadId: thread.id, reason: finalReason }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to report thread.");
                return;
            }
            onReported();
            onClose();
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 2000);
        return () => clearTimeout(timer);
    }, [error]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl w-full max-w-md space-y-4"
            >
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Report Thread</h2>
                <p className="text-sm text-[var(--text-muted)]">Why are you reporting this thread?</p>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                        <span>⚠</span>{error}
                    </div>
                )}

                <div className="space-y-2">
                    {reasons.map((r) => (
                        <label key={r} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent-orange)]/50 hover:bg-white/5 cursor-pointer transition-all">
                            <input
                                type="radio"
                                name="reason"
                                value={r}
                                checked={reason === r}
                                onChange={() => setReason(r)}
                                className="accent-[var(--accent-orange)]"
                            />
                            <span className="text-sm text-[var(--text-muted)]">{r}</span>
                        </label>
                    ))}
                </div>

                {reason === "Other" && (
                    <textarea
                        placeholder="Please describe the issue..."
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] resize-none h-24"
                    />
                )}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !reason || (reason === "Other" && !otherText)}
                        className="px-4 py-2 rounded-xl bg-[#D50A0A] hover:bg-[#950606] text-white disabled:opacity-50"
                    >
                        {loading ? "Reporting..." : "Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function CreatePost({ threadId, onClose, onSaved }: { threadId: number; onClose: () => void; onSaved: () => void }) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/threads/threadId/${threadId}/posts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to post");
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Create New Post</h2>
                
                {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>}

                <textarea
                    autoFocus
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] resize-none h-32 transition-all"
                />

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] transition">
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading || !content.trim()} 
                        className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold disabled:opacity-50 transition"
                    >
                        {loading ? "Posting..." : "Post Now"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ReportPost({ postId, onClose, onReported }: { 
    postId: number; 
    onClose: () => void; 
    onReported: () => void; 
}) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otherText, setOtherText] = useState("");

    const reasons = ["Spam", "Harassment", "Misinformation", "Inappropriate content", "Other"];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!reason) return;
        setLoading(true);

        const finalReason = reason === "Other" ? otherText : reason;
        try {
            const res = await fetch(`/api/users/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, reason: finalReason }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to report post.");
                return;
            }
            onReported();
            onClose();
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 2000);
        return () => clearTimeout(timer);
    }, [error]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Report Post</h2>
                <p className="text-sm text-[var(--text-muted)]">Why are you reporting this post?</p>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
                        <span>⚠</span>{error}
                    </div>
                )}

                <div className="space-y-2">
                    {reasons.map((r) => (
                        <label key={r} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent-orange)]/50 hover:bg-white/5 cursor-pointer transition-all">
                            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--accent-orange)]" />
                            <span className="text-sm text-[var(--text-muted)]">{r}</span>
                        </label>
                    ))}
                </div>

                {reason === "Other" && (
                    <textarea
                        placeholder="Please describe the issue..."
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] resize-none h-24"
                    />
                )}

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)]">Cancel</button>
                    <button type="submit" disabled={loading || !reason || (reason === "Other" && !otherText)}
                        className="px-4 py-2 rounded-xl bg-[#D50A0A] hover:bg-[#950606] text-white disabled:opacity-50">
                        {loading ? "Reporting..." : "Report"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function PostHistory({ post, onClose }: { post: Post; onClose: () => void }) {
    const [versions, setVersions] = useState<{ id: number; content: string; editedAt: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const res = await fetch(`/api/posts/postId/${post.id}/history`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error ?? "Failed to load history");
                    return;
                }
                setVersions(data);
            } catch (e) {
                setError("Something went wrong.");
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
    }, [post.id]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit History</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg">✕</button>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>
                )}

                <div className="p-3 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-semibold text-[var(--accent-blue)] uppercase tracking-wider">Current Version</span>
                    </div>
                    <p className="text-[var(--text-primary)] text-sm">{post.content}</p>
                </div>

                <div className="overflow-y-auto flex-1 space-y-3">
                    {loading ? (
                        <p className="text-[var(--text-muted)] text-sm text-center py-4">Loading...</p>
                    ) : versions.length === 0 ? (
                        <p className="text-[var(--text-muted)] text-sm text-center py-4 italic">No previous versions found.</p>
                    ) : (
                        versions.map((version, index) => (
                            <div key={version.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                        Version {versions.length - index}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                        {format_date(version.editedAt).date} at {format_date(version.editedAt).time}
                                    </span>
                                </div>
                                <p className="text-[var(--text-muted)] text-sm">{version.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function CreatePoll({ threadId, onClose, onSaved }: { threadId: number; onClose: () => void; onSaved: () => void }) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOptionChange = (index: number, value: string) => {
        setOptions(prev => prev.map((o, i) => i === index ? value : o));
    };

    const addOption = () => setOptions(prev => [...prev, ""]);
    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/polls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    question,
                    deadline,
                    options: options.filter(o => o.trim()),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to create poll"); return; }
            onSaved();
            onClose();
        } catch {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Create Poll</h2>

                {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>}

                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Question</label>
                    <input
                        autoFocus
                        placeholder="e.g. Who will be man of the match?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] transition-all text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Options</label>
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] text-sm"
                                />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(index)}
                                        className="px-3 py-2 rounded-xl bg-red-900/40 text-red-400 hover:bg-red-900/60 text-sm">
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addOption}
                        className="mt-2 text-xs text-[var(--accent-blue)] hover:underline">
                        + Add option
                    </button>
                </div>

                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Deadline</label>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        min={(() => {
                          const now = new Date(Date.now() + 60000);
                          const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
                          return localTime.toISOString().slice(0, 16);
                        })()}   
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] text-sm"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] transition">Cancel</button>
                    <button type="submit" disabled={loading || !question.trim() || !deadline || options.filter(o => o.trim()).length < 2}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold disabled:opacity-50 transition">
                        {loading ? "Creating..." : "Create Poll"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EditPoll({ poll, onClose, onSaved }: { poll: Poll; onClose: () => void; onSaved: () => void }) {
    const [question, setQuestion] = useState(poll.question);
    const [options, setOptions] = useState(poll.options.map(o => o.text));
    const [deadline, setDeadline] = useState(poll.deadline.slice(0, 16));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/polls/${poll.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, deadline, options: options.filter(o => o.trim()) }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to update poll"); return; }
            onSaved();
            onClose();
        } catch {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Poll</h2>

                {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>}

                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Question</label>
                    <input value={question} onChange={(e) => setQuestion(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] text-sm" />
                </div>

                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Options</label>
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input placeholder={`Option ${index + 1}`} value={option}
                                    onChange={(e) => setOptions(prev => prev.map((o, i) => i === index ? e.target.value : o))}
                                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] text-sm" />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => setOptions(prev => prev.filter((_, i) => i !== index))}
                                        className="px-3 py-2 rounded-xl bg-red-900/40 text-red-400 hover:bg-red-900/60 text-sm">✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setOptions(prev => [...prev, ""])}
                        className="mt-2 text-xs text-[var(--accent-blue)] hover:underline">+ Add option</button>
                </div>

                <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">Deadline</label>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        min={(() => {
                          const now = new Date(Date.now() + 60000);
                          const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
                          return localTime.toISOString().slice(0, 16);
                        })()}  
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] text-sm"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] transition">Cancel</button>
                    <button type="submit" disabled={loading}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold disabled:opacity-50 transition">
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function PollCard({ poll, currentUserId, onVoted, onEdit, onDelete }: {
    poll: Poll;
    currentUserId: number | null;
    onVoted: () => void;
    onEdit: (poll: Poll) => void;
    onDelete: (pollId: number) => void;
}) {
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isExpired = new Date() > new Date(poll.deadline);
    const totalVotes = poll.votes.length;
    const userVote = currentUserId ? poll.votes.find(v => v.userid === currentUserId) : null;
    const isOwner = currentUserId === poll.userid;
    const hasVotes = poll.votes.length > 0;

    const handleVote = async (optionId: number) => {
        if (userVote || isExpired) return;
        setVoting(true);
        try {
            const res = await fetch(`/api/polls/${poll.id}/vote`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ option: optionId }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to vote"); return; }
            onVoted();
        } catch {
            setError("Something went wrong.");
        } finally {
            setVoting(false);
        }
    };

    const handleDelete = async () => {
        const res = await fetch(`/api/polls/${poll.id}`, { method: "DELETE" });
        if (res.ok) onDelete(poll.id);
    };

    return (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-bold text-sm">{poll.question}</p>
                    <p className={`text-[10px] mt-1 ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                        {isExpired ? 'Closed' : `Closes ${new Date(poll.deadline).toLocaleString()}`}
                    </p>
                </div>
                {isOwner && !isExpired && !hasVotes && (
                    <div className="flex gap-2 ml-4">
                        <button onClick={() => onEdit(poll)}
                            className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] text-xs transition">
                            Edit
                        </button>
                        <button onClick={handleDelete}
                            className="px-3 py-1 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs transition">
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="text-red-400 text-xs">⚠️ {error}</p>}

            {/* Options */}
            <div className="space-y-2">
                {poll.options.map(option => {
                    const voteCount = option.votes?.length ?? 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isSelected = userVote?.optionId === option.id;
                    const showResults = isExpired || !!userVote;

                    return (
                        <button
                            key={option.id}
                            onClick={() => !showResults && handleVote(option.id)}
                            disabled={voting || showResults}
                            className={`w-full text-left rounded-xl overflow-hidden border transition ${
                                isSelected
                                    ? 'border-[var(--accent-blue)]'
                                    : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                            } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <div className="relative px-4 py-3">
                                {showResults && (
                                    <div
                                        className="absolute inset-0 bg-[var(--accent-blue)]/10 transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}
                                <div className="relative flex justify-between items-center">
                                    <span className={`text-sm ${isSelected ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                                        {option.text}
                                        {isSelected && <span className="ml-2 text-xs">✓</span>}
                                    </span>
                                    {showResults && (
                                        <span className="text-xs text-[var(--text-muted)]">{percentage}% ({voteCount})</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] text-[var(--text-muted)]">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} total</p>
        </div>
    );
}

function CreateReply({ postId, onClose, onSaved }: { postId: number; onClose: () => void; onSaved: () => void }) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/posts/postId/${postId}/replies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to post reply"); return; }
            onSaved();
            onClose();
        } catch {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Reply to Post</h2>
                {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>}
                <textarea
                    autoFocus
                    placeholder="Write your reply..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] resize-none h-28 transition-all"
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] transition">Cancel</button>
                    <button type="submit" disabled={loading || !content.trim()}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold disabled:opacity-50 transition">
                        {loading ? "Posting..." : "Reply"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EditReply({ reply, postId, onClose, onSaved }: { reply: Reply; postId: number; onClose: () => void; onSaved: () => void }) {
    const [content, setContent] = useState(reply.content);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/posts/postId/${postId}/replies/${reply.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to edit reply"); return; }
            onSaved();
            onClose();
        } catch {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Reply</h2>
                {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">⚠️ {error}</div>}
                <textarea
                    autoFocus
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-[var(--accent-blue)] resize-none h-28 transition-all"
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-primary)] transition">Cancel</button>
                    <button type="submit" disabled={loading || !content.trim() || content === reply.content}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold disabled:opacity-50 transition">
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ReplyHistory({ reply, postId, onClose }: { reply: Reply; postId: number; onClose: () => void }) {
    const [versions, setVersions] = useState<{ id: number; content: string; editedAt: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const res = await fetch(`/api/posts/postId/${postId}/replies/${reply.id}/history`);
                const data = await res.json();
                if (!res.ok) { setError(data.error ?? "Failed to load history"); return; }
                setVersions(data);
            } catch {
                setError("Something went wrong.");
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
    }, [reply.id, postId]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--overlay)] z-50 backdrop-blur-sm">
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Reply History</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                </div>
                <div className="p-3 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30">
                    <span className="text-[10px] font-semibold text-[var(--accent-blue)] uppercase tracking-wider block mb-1">Current Version</span>
                    <p className="text-[var(--text-primary)] text-sm">{reply.content}</p>
                </div>
                <div className="overflow-y-auto flex-1 space-y-3">
                    {loading ? (
                        <p className="text-[var(--text-muted)] text-sm text-center py-4">Loading...</p>
                    ) : versions.length === 0 ? (
                        <p className="text-[var(--text-muted)] text-sm text-center py-4 italic">No previous versions found.</p>
                    ) : (
                        versions.map((version, index) => (
                            <div key={version.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-[var(--text-muted)]">Version {versions.length - index}</span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                        {format_date(version.editedAt).date} at {format_date(version.editedAt).time}
                                    </span>
                                </div>
                                <p className="text-[var(--text-muted)] text-sm">{version.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SingleThreadPage(){
    const router = useRouter();
    const { id } = useParams();

    const [thread, setThread] = useState<Thread | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [reportPostId, setReportPostId] = useState<number | null>(null);
    const [editPost, setEditPost] = useState<Post | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [historyPost, setHistoryPost] = useState<Post | null>(null);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'polls'>('posts');
    const [showCreatePoll, setShowCreatePoll] = useState(false);
    const [editPoll, setEditPoll] = useState<Poll | null>(null);
    const [createReplyPostId, setCreateReplyPostId] = useState<number | null>(null);
    const [editReply, setEditReply] = useState<{ reply: Reply; postId: number } | null>(null);
    const [historyReply, setHistoryReply] = useState<{ reply: Reply; postId: number } | null>(null);
    const [activeReplyMenuId, setActiveReplyMenuId] = useState<number | null>(null);

    const fetchPolls = async () => {
        const res = await fetch(`/api/polls?threadId=${id}`);
        if (res.ok) {
            const data = await res.json();
            setPolls(data);
        }
    };

    const fetchThread = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/threads/threadId/${id}`);
            const data = await res.json();

            if (!res.ok){
                setError(data.error ?? "Something went wrong.");
                return;
            }

            setThread(data ?? []);
        } catch (e) {
            setError("Failed to load thread. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteReply = async (postId: number, replyId: number) => {
        try {
            const res = await fetch(`/api/posts/postId/${postId}/replies/${replyId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to delete reply"); return; }
            setMessage("Reply deleted.");
            fetchThread();
        } catch {
            setError("Failed to delete reply.");
        }
    };

    const handleTranslateReply = async (postId: number, replyId: number, content: string) => {
      try {
          const res = await fetch(`/api/translate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: content })
          });
          if (!res.ok) throw new Error("Translation failed");
          const data = await res.json();
          setThread(prev => {
              if (!prev) return prev;
              return {
                  ...prev,
                  posts: prev.posts.map(post =>
                      post.id === postId ? {
                          ...post,
                          replies: post.replies.map(reply =>
                              reply.id === replyId
                                  ? { ...reply, translatedContent: data.translatedText }
                                  : reply
                          )
                      } : post
                  )
              };
          });
      } catch {
          setError("Could not translate reply.");
      }
    };

    const handleTranslate = async (postId: number, content: string) => {
        try {
            const res = await fetch(`/api/translate`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content }) 
            });

            if (!res.ok) throw new Error("Translation failed");

            const data = await res.json(); 

            setThread(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    posts: prev.posts.map(post => 
                        post.id === postId 
                            ? { ...post, translatedContent: data.translatedText } 
                            : post
                    )
                };
            });
        } catch (err) {
            setError("Could not translate post.");
        }
    };

    const handleReportPost = (postId: number) => {
        setReportPostId(postId);
    };

    useEffect(() => {
        fetchThread();
        fetchPolls();
    }, [id]);
    
    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 2000);
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const res = await fetch('/api/users/profile/view');
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.id);
            }
        };
        fetchCurrentUser();
    }, []);

    const handleDelete = async () => {
        if (!thread) return;

        try {
            const res = await fetch(`/api/threads/threadId/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Failed to delete thread.");
                return;
            }
            setMessage("Thread deleted successfully!");
            setTimeout(() => router.push("/threads"), 2000);
        } catch (e) {
            setError("Failed to delete thread.");
        }
    };

    const handleDeletePost = async (postId: number) => {
        try {
            const res = await fetch(`/api/posts/postId/${postId}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to delete post");
                return;
            }
            setMessage("Post deleted successfully!");
            fetchThread();
        } catch (e) {
            setError("Failed to delete post.");
        }
    };

    if (loading) return <PageMessage>Loading thread...</PageMessage>;
    if (error) return <PageMessage error>{error}</PageMessage>;
    if (!thread) return <PageMessage>Thread not found.</PageMessage>;

    const { date, time } = format_date(thread.createdAt);

    return (
    <div className="relative min-h-screen text-[var(--text-primary)]">
      <img
        src="/images/details-ball-sport.jpg"
        className="fixed inset-0 w-full h-full object-cover -z-10"
      />
      <div className="fixed inset-0 bg-black/70 -z-10" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[var(--text-primary)]">{thread.title}</h1>

              <p className="text-sm text-[var(--text-muted)] mt-2">
                {date} at {time}
              </p>

              <p className="text-sm text-[var(--text-muted)] mt-1">
                Thread #{thread.id}  |  User: {thread.userid ?? "None"} |
                Team: {thread.teamId ?? "None"} | Match: {thread.matchId ?? "None"}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge isOpen={thread.isOpen} />
                <VisibilityBadge isVisible={thread.isVisible} />
                <span className="text-xs text-[var(--accent-blue)] font-medium">
                  Sentiment {thread.overallAverage?.toFixed(2) ?? "N/A"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="px-4 py-2 rounded-lg bg-[#066400] hover:bg-[#008000] text-white font-semibold"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-[#D50A0A] hover:bg-[#950606] text-white font-semibold"
              >
                Delete
              </button>
              <button
                onClick={() => setShowReport(true)}
                className="px-4 py-2 rounded-lg bg-[#444444] hover:bg-[#333333] text-white font-semibold"
              >
                Report
              </button>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold transition-transform active:scale-95"
              >
                Post
              </button>
            </div>
          </div>

          {/* Tags */}
          {thread.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {thread.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {message && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/50 border border-green-700/40 text-[var(--text-primary)] text-md">
                {message}
            </div>
        )}

        {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/50 border border-red-700/40 text-[var(--text-muted)] text-sm">
                <span className="text-lg">⚠</span>
                {error}
            </div>
        )}

        {/* Tabs */}
        <div className="rounded-2xl overflow-hidden shadow-xl bg-[var(--bg-secondary)]">
            <div className="flex border-b border-[var(--border)]">
                <button onClick={() => setActiveTab('posts')}
                    className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'posts' ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                    Posts ({thread.posts?.length ?? 0})
                </button>
                <button onClick={() => setActiveTab('polls')}
                    className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'polls' ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                    Polls ({polls.length})
                </button>
            </div>

            <div className="p-4">
                {activeTab === 'posts' && (
                    <div className="space-y-4">
                        {thread.posts?.length === 0 ? (
                            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 text-[var(--text-muted)] text-center italic">
                                No posts yet. Be the first to comment!
                            </div>
                        ) : (
                            thread.posts?.map((post) => (
                            <div key={post.id} className="relative p-4 rounded-xl bg-[var(--bg-card)] border-2 border-[var(--border)] shadow-md group">
                              
                              {/* Author & Dropdown Header */}
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                  <span className="text-[var(--accent-blue)] font-bold text-sm">
                                    {post.user?.username || `User ${post.userid}`}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    {format_date(post.createdAt).date}
                                  </span>
                                </div>

                                {/* Action Menu (Three Dots) */}
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                                    className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)] transition-colors">
                                    <span>⋮</span>
                                  </button>

                                  {activeMenuId === post.id && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                      <div className="absolute right-0 mt-1 w-32 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-xl z-20">
                                        <button 
                                          onClick={() => { handleTranslate(post.id, post.content); setActiveMenuId(null); }}
                                          className="w-full text-left px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] rounded-t-xl transition"
                                        >
                                          Translate
                                        </button>
                                        {currentUserId === post.userid && (
                                            <button 
                                                onClick={() => { setEditPost(post); setActiveMenuId(null); }}
                                                className="w-full text-left px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] rounded-t-xl transition"
                                            >
                                                Edit Post
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => { setHistoryPost(post); setActiveMenuId(null); }}
                                            className="w-full text-left px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] transition"
                                        >
                                            View History
                                        </button>
                                        {currentUserId === post.userid && (
                                            <button 
                                                onClick={() => { handleDeletePost(post.id); setActiveMenuId(null); }}
                                                className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/40 rounded-xl transition"
                                            >
                                                Delete Post
                                            </button>
                                        )}
                                        <button 
                                          onClick={() => { handleReportPost(post.id); setActiveMenuId(null); }}
                                          className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/40 rounded-b-xl transition"
                                        >
                                          Report Post
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Post Content */}
                              <div className="space-y-2">
                                <p className="text-[var(--text-primary)] text-sm leading-relaxed">
                                  {post.translatedContent || post.content}
                                </p>
                                
                                {post.translatedContent && (
                                  <button 
                                    onClick={() => {
                                      setThread(prev => prev ? ({
                                        ...prev,
                                        posts: prev.posts.map(p => p.id === post.id ? { ...p, translatedContent: undefined } : p)
                                      }) : null);
                                    }}
                                    className="text-[10px] text-[var(--accent-blue)] hover:underline"
                                  >
                                    Show Original
                                  </button>
                                )}
                              </div>

                              {/* Replies */}
                              {post.replies?.length > 0 && (
                                  <div className="mt-3 ml-4 space-y-2 border-l-2 border-[var(--border)] pl-3">
                                      {post.replies.map(reply => (
                                          <div key={reply.id} className="relative p-3 rounded-xl bg-white/5 border border-white/10">
                                              <div className="flex justify-between items-start mb-1">
                                                  <div className="flex flex-col">
                                                      <span className="text-[var(--accent-blue)] font-semibold text-xs">
                                                          {reply.user?.username || `User ${reply.userid}`}
                                                      </span>
                                                      <span className="text-[10px] text-[var(--text-muted)]">
                                                          {format_date(reply.createdAt).date}
                                                      </span>
                                                  </div>

                                                  {/* Reply action menu */}
                                                  <div className="relative">
                                                      <button
                                                          onClick={() => setActiveReplyMenuId(activeReplyMenuId === reply.id ? null : reply.id)}
                                                          className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)] transition-colors text-xs">
                                                          ⋮
                                                      </button>
                                                      {activeReplyMenuId === reply.id && (
                                                          <>
                                                              <div className="fixed inset-0 z-10" onClick={() => setActiveReplyMenuId(null)} />
                                                              <div className="absolute right-0 mt-1 w-32 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-xl z-20">
                                                                  <button
                                                                      onClick={() => { handleTranslateReply(post.id, reply.id, reply.content); setActiveReplyMenuId(null); }}
                                                                      className="w-full text-left px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] rounded-t-xl transition">
                                                                      Translate
                                                                  </button>
                                                                  <button
                                                                      onClick={() => { setHistoryReply({ reply, postId: post.id }); setActiveReplyMenuId(null); }}
                                                                      className="w-full text-left px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] transition">
                                                                      View History
                                                                  </button>
                                                                  {currentUserId === reply.userid && (
                                                                      <button
                                                                          onClick={() => { setEditReply({ reply, postId: post.id }); setActiveReplyMenuId(null); }}
                                                                          className="w-full text-left px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] transition">
                                                                          Edit Reply
                                                                      </button>
                                                                  )}
                                                                  {currentUserId === reply.userid && (
                                                                      <button
                                                                          onClick={() => { handleDeleteReply(post.id, reply.id); setActiveReplyMenuId(null); }}
                                                                          className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/40 rounded-b-xl transition">
                                                                          Delete Reply
                                                                      </button>
                                                                  )}
                                                              </div>
                                                          </>
                                                      )}
                                                  </div>
                                              </div>

                                              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                                                  {reply.translatedContent || reply.content}
                                              </p>
                                              {reply.translatedContent && (
                                                  <button
                                                      onClick={() => {
                                                          setThread(prev => prev ? ({
                                                              ...prev,
                                                              posts: prev.posts.map(p => p.id === post.id ? {
                                                                  ...p,
                                                                  replies: p.replies.map(r => r.id === reply.id ? { ...r, translatedContent: undefined } : r)
                                                              } : p)
                                                          }) : null);
                                                      }}
                                                      className="text-[10px] text-[var(--accent-blue)] hover:underline mt-1">
                                                      Show Original
                                                  </button>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {/* Reply button */}
                              <button
                                  onClick={() => setCreateReplyPostId(post.id)}
                                  className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition">
                                  + Reply
                              </button>
                            </div>
                          ))
                          )}
                        </div>  
                    )}
                        {activeTab === 'polls' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button onClick={() => setShowCreatePoll(true)}
                                        className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] hover:opacity-80 text-[var(--bg-primary)] font-bold text-sm transition">
                                        + Create Poll
                                    </button>
                                </div>
                                {polls.length === 0 ? (
                                    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 text-[var(--text-muted)] text-center italic">
                                        No polls yet.
                                    </div>
                                ) : (
                                    polls.map(poll => (
                                        <PollCard
                                            key={poll.id}
                                            poll={poll}
                                            currentUserId={currentUserId}
                                            onVoted={fetchPolls}
                                            onEdit={setEditPoll}
                                            onDelete={(pollId) => setPolls(prev => prev.filter(p => p.id !== pollId))}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
              </div>

      {showEdit && (
        <EditThread
          thread={thread}
          onClose={() => setShowEdit(false)}
          onSaved={fetchThread}
        />
      )}

      {showReport && (
          <ReportThread
              thread={thread}
              onClose={() => setShowReport(false)}
              onReported={() => setMessage("Thread reported successfully.")}
          />
      )}

      {showCreatePost && (
          <CreatePost 
              threadId={Number(id)} 
              onClose={() => setShowCreatePost(false)} 
              onSaved={fetchThread} 
          />
      )}

      {reportPostId !== null && (
          <ReportPost
              postId={reportPostId}
              onClose={() => setReportPostId(null)}
              onReported={() => setMessage("Post reported successfully.")}
          />
      )}

      {editPost && (
          <EditPost
              post={editPost}
              onClose={() => setEditPost(null)}
              onSaved={fetchThread}
          />
      )}
      {historyPost && (
          <PostHistory
              post={historyPost}
              onClose={() => setHistoryPost(null)}
          />
      )}
      {showCreatePoll && (
          <CreatePoll
              threadId={Number(id)}
              onClose={() => setShowCreatePoll(false)}
              onSaved={fetchPolls}
          />
      )}

      {editPoll && (
          <EditPoll
              poll={editPoll}
              onClose={() => setEditPoll(null)}
              onSaved={() => { fetchPolls(); setEditPoll(null); }}
          />
      )}

      {createReplyPostId !== null && (
          <CreateReply
              postId={createReplyPostId}
              onClose={() => setCreateReplyPostId(null)}
              onSaved={() => { fetchThread(); setCreateReplyPostId(null); }}
          />
      )}

      {editReply && (
          <EditReply
              reply={editReply.reply}
              postId={editReply.postId}
              onClose={() => setEditReply(null)}
              onSaved={() => { fetchThread(); setEditReply(null); }}
          />
      )}

      {historyReply && (
          <ReplyHistory
              reply={historyReply.reply}
              postId={historyReply.postId}
              onClose={() => setHistoryReply(null)}
          />
      )}
    </div>
  );
}