'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Post {
    id: number,
    content: string,
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

function ThreadCard({ thread }: { thread: Thread}){
    const { date, time } = format_date(thread.createdAt);

    return (
        <div className="group relative flex items-center gap-4 px-5 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-all duration-200">
        {/* Left: datetime + status */}
        <div className="w-20 shrink-0 text-center">
            <p className="text-xs font-semibold text-[var(--accent-orange)]">{date}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{time}</p>
        </div>
 
        {/* Divider */}
        <div className="w-px self-stretch bg-[var(--border)] shrink-0" />
 
        <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[var(--text-primary)] truncate group-hover:text-indigo-300 transition">
            {thread.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge isOpen={thread.isOpen} />
            <VisibilityBadge isVisible={thread.isVisible} />
            <span className="text-xs text-[var(--text-muted)]">
                {thread.posts?.length ?? 0} posts
            </span>
            </div>

            {thread.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
                {thread.tags.map((tag) => (
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
    
        {/* Divider */}
        <div className="w-px self-stretch bg-[var(--border)] shrink-0" />

        {/* Right: IDs */}
        <div className="w-28 shrink-0 text-right hidden sm:block">
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
                Thread #{thread.id}
            </p>
            <p className="text-[11px] text-[var(--accent-blue)] mt-0.5">
                Sentiment {thread.overallAverage?.toFixed(2) ?? "N/A"}
            </p>
            {thread.userid && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                User {thread.userid}
                </p>
            )}
            {thread.matchId && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Match {thread.matchId}
                </p>
            )}
            {thread.teamId && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Team {thread.teamId}
                </p>
            )}
        </div>
    </div>
  );
}

function PaginationButton({onClick, active, children}: {onClick: () => void; active?: boolean; children: React.ReactNode}) {
    return (
        <button
        onClick={onClick}
        className={`
            h-9 min-w-[2.25rem] px-2 rounded-lg text-sm font-semibold transition-all duration-150 select-none
            ${active
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            }
        `}
        >
        {children}
        </button>
    );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void}) {
    const pages: (number | "…")[] = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push("…");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push("…");
        pages.push(totalPages);
    }
 
    return (
        <div className="flex items-center gap-1">
        <PaginationButton onClick={() => onChange(page - 1)}>
            {"<"}
        </PaginationButton>
        {pages.map((p, i) =>
            p === "…" ? (
            <span key={`ellipsis-${i}`} className="text-[var(--text-muted)] px-1 text-sm select-none">…</span>
            ) : (
            <PaginationButton key={p} onClick={() => onChange(p as number)} active={p === page}>
                {p}
            </PaginationButton>
            )
        )}
        <PaginationButton onClick={() => onChange(page + 1)}>
            {">"}
        </PaginationButton>
        </div>
    );
}

function CreateThread({ onClose, onSaved }: { onClose: () => void; onSaved: () => void}) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [teamId, setTeamId] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tags = tagsInput
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);

            const res = await fetch(`/api/threads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, tags, teamId: teamId ? Number(teamId) : null }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to create thread");
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
            className="bg-[var(--bg-card)] p-6 border border-[var(--border)] rounded-xl w-full max-w-lg space-y-4"
        >
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Create New Thread</h2>
            
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
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-500"
            />
            
            <input
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-500"
            />

            <input
                placeholder="Tags (comma seperated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-500"
            />

            <input
                type="number"
                placeholder="Team ID"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border)] focus:border-indigo-500"
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
                    {loading ? "Creating..." : "Create"}
                </button>
            </div>
        </form>
        </div>
    );
}

export default function ThreadsPage(){
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawPage = Number(searchParams.get("page") ?? 1);
    const [page, setPage] = useState(Math.max(1, rawPage));

    const [threads, setThreads] = useState<Thread[]>([]);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [searchTitle, setSearchTitle] = useState(searchParams.get("title") ?? "");
    const [searchAuthor, setSearchAuthor] = useState(searchParams.get("author") ?? "");
    const [searchTag, setSearchTag] = useState(searchParams.get("tag") ?? "");
    const [searchTeamId, setSearchTeamId] = useState(searchParams.get("team") ?? "");
    const [searchMatchId, setSearchMatchId] = useState(searchParams.get("match") ?? "");
    const [showCreate, setShowCreate] = useState(false);
    
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
 
    const updateUrl = (newPage: number) => {
        const params = new URLSearchParams();

        if (searchTitle) params.set("title", searchTitle);
        if (searchAuthor) params.set("author", searchAuthor);
        if (searchTag) params.set("tag", searchTag);
        if (searchTeamId) params.set("team", searchTeamId);
        if (searchMatchId) params.set("match", searchMatchId);

        params.set("page", String(newPage));
        router.push(`?${params.toString()}`);
    };

    const fetchThreads = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (searchTitle) params.append("title", searchTitle);
            if (searchAuthor) params.append("author", searchAuthor);
            if (searchTag) params.append("tag", searchTag);
            if (searchTeamId) params.append("team", searchTeamId);
            if (searchMatchId) params.append("match", searchMatchId);
            params.set("page", String(page));

            const res = await fetch(`/api/threads?${params.toString()}`);
            const data = await res.json();

            if (!res.ok){
                setError(data.error ?? "Something went wrong.");
                return;
            }

            setThreads(data.threads ?? []);
            setTotal(data.total ?? 0);
        } catch (e) {
            setError("Failed to load matches. Please try again.");
        } finally {
            setLoading(false);
        }
    }
 
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        updateUrl(1);
    };

    const handleClearSearch = () => {
        setSearchTitle("");
        setSearchAuthor("");
        setSearchTag("");
        setSearchTeamId("");
        setSearchMatchId("");
        setPage(1);
        router.push(`?page=1`);
    };

    useEffect(() => {
        fetchThreads();
    }, [searchTitle, searchAuthor, searchTag, searchTeamId, searchMatchId, page]);
    
    useEffect(() => {
        if (total === 0) return;
        if (rawPage <= 0) setPage(1);
        else if (rawPage > totalPages) setPage(totalPages);
    }, [total, rawPage, totalPages]);

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

    const handlePageChange = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
        updateUrl(p)
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="relative min-h-screen text-[var(--text-primary)] flex flex-col">
            <img src="/images/details-ball-sport.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" />
            <div className="fixed inset-0 bg-black/70 -z-10" />

            {/* Header */}
            <div className="border-b border-[var(--border)] bg-[var(--bg-primary)] backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">
                        Discussion Threads
                    </h1>
                    {!error && (
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                        Showing {start}-{end} of {total}
                        </p>
                    )}
                    </div>

                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded-lg bg-[#00563b] hover:bg-[#008000] border border-[var(--border)] hover:border-white/40 text-white font-semibold transition shrink-0"
                        >
                            + Create Thread
                    </button>
                </div>

                {/* Multi-filter search */}
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-2">
                    <input
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="Title"
                    className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500"
                    />
                    <input
                    type="text"
                    value={searchAuthor}
                    onChange={(e) => setSearchAuthor(e.target.value)}
                    placeholder="Author ID"
                    className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500"
                    />
                    <input
                    type="text"
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    placeholder="Tag Name"
                    className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500"
                    />
                    <input
                    type="text"
                    value={searchTeamId}
                    onChange={(e) => setSearchTeamId(e.target.value)}
                    placeholder="Team ID"
                    className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500"
                    />
                    <input
                    type="text"
                    value={searchMatchId}
                    onChange={(e) => setSearchMatchId(e.target.value)}
                    placeholder="Match ID"
                    className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500"
                    />

                    {/* Buttons */}
                    <div className="sm:col-span-5 flex gap-2 mt-2">
                    <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#274D8F] hover:bg-indigo-600 text-white text-sm font-semibold transition"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:opacity-80 text-[var(--text-muted)] text-sm font-semibold transition"
                    >
                        Clear
                    </button>
                    </div>
                </form>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-4 z-10">
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/50 border border-red-700/40 text-red-300 text-sm z-10">
                        <span className="text-lg">⚠</span>
                        {error}
                    </div>
                )}
                
                {message && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/50 border border-green-700/40 text-[var(--text-primary)] text-sm z-10">
                        {message}
                    </div>
                )}

                {loading && threads.length === 0 && !error && (
                    <div className="text-center py-16 text-[var(--text-primary)]">
                        <p className="font-semibold">Please wait a moment. Loading threads...</p>
                    </div>
                )}

                {!loading &&
                threads.map((thread) => {
                    const id = thread.id;
                    return (
                    <button
                        key={id}
                        onClick={() => router.push(`/threads/${id}`)}
                        className="w-full p-0 border-0 bg-transparent text-left"
                    >
                        <ThreadCard key={thread.id} thread={thread} />
                    </button>
                    );
                })}

                {!loading && threads.length === 0 && !error && (
                    <div className="text-center py-16 text-[var(--text-muted)]">
                        <p className="text-4xl mb-3">💬</p>
                        <p className="font-semibold">No threads found</p>
                    </div>
                )}
            </div>
        
            {/* ── footer pagination ── */}
            {totalPages > 1 && (
                <div className="relative z-10 max-w-3xl mx-auto px-4 pb-10 flex items-center justify-between">
                <p className="text-s font-semibold text-[var(--text-muted)]">
                    Page {page} of {totalPages}
                </p>
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
                </div>
            )}

            {showCreate && (
                <CreateThread
                onClose={() => setShowCreate(false)}
                onSaved={() => {
                    fetchThreads();
                    setMessage("Thread created successfully!");
                    setShowCreate(false);
                }}
            />
            )}
        </div>
    );
}