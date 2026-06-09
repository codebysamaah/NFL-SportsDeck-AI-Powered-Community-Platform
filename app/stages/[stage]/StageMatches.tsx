'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

interface Team {
    id: number,
    name: string,
    logo?: string,
    venue?: string,
}

interface Match {
    id: number,
    stage: string,
    status: string,
    matchday: number,
    venue: string,
    homeTeam: Team,
    awayTeam: Team,
    datetime: string,
    homeScore?: number | null,
    awayScore?: number | null,
}

const PAGE_SIZE = 10;
type MatchStatus = "SCHEDULED"| "TIMED" | "IN_PLAY" | "PAUSED"
    | "FINISHED" | "SUSPENDED" | "POSTPONED" | "CANCELLED" | "AWARDED";

function format_date(date: string){
    const d = new Date(date);
    return {
        date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric"}),
        time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit"})
    };
}

function StatusBadge({ status }: { status: MatchStatus }) {
    const map: Record<MatchStatus, { label: string; className: string }> = {
        IN_PLAY:   { label: "LIVE",      className: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" },
        PAUSED:    { label: "PAUSED",    className: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" },
        FINISHED:  { label: "FT",        className: "bg-slate-700/60 text-slate-400 ring-1 ring-slate-600" },
        AWARDED:   { label: "AWD",       className: "bg-slate-700/60 text-slate-400 ring-1 ring-slate-600" },
        SCHEDULED: { label: "SOON",      className: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" },
        TIMED:     { label: "SOON",      className: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" },
        SUSPENDED: { label: "SUSP",      className: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40" },
        POSTPONED: { label: "PPD",       className: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40" },
        CANCELLED: { label: "CANC",      className: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40" },
    };
  
    const { label, className } = map[status] ?? { label: status, className: "bg-slate-700/60 text-slate-400" };
  
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest ${className}`}>
        {label}
        </span>
    );
}

function MatchCard({ match }: { match: Match }){
    const { date, time } = format_date(match.datetime);
    const hasScore = match.status === "FINISHED" || match.status === "AWARDED";
    const venue = match.venue ?? null;

    return (
        <div className="group relative flex items-center gap-4 px-5 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-all duration-200">
        {/* Left: datetime + status */}
        <div className="w-20 shrink-0 text-center">
            <p className="text-xs font-semibold text-[var(--text-primary)]">{date}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{time}</p>
            <div className="mt-1.5 flex justify-center">
            <StatusBadge status={match.status as MatchStatus} />
            </div>
        </div>
 
        {/* Divider */}
        <div className="w-px self-stretch bg-[var(--border)] shrink-0" />
 
        {/* Centre: teams + score */}
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
            {/* Home */}
            <div className="flex-1 text-right min-w-0">
            <p className="text-sm font-semibold text-[var(--accent-orange)] truncate">{match.homeTeam.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">Home</p>
            </div>
 
            {/* Score / vs */}
            <div className="shrink-0 w-20 flex items-center justify-center gap-1">
            {hasScore ? (
                <>
                <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums w-7 text-center">
                    {match.homeScore}
                </span>
                <span className="text-[var(--text-muted)] font-bold text-lg">–</span>
                <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums w-7 text-center">
                    {match.awayScore}
                </span>
                </>
            ) : (
                <span className="text-[var(--text-muted)] font-bold text-sm tracking-widest">VS</span>
            )}
            </div>
    
            {/* Away */}
            <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-[var(--accent-blue)] truncate">{match.awayTeam.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">Away</p>
            </div>
        </div>
    
        {/* Divider */}
        <div className="w-px self-stretch bg-[var(--border)] shrink-0" />

        {/* Right: venue, stage, matchday */}
        <div className="w-28 shrink-0 text-right hidden sm:block">
            <p className="text-[11px] font-medium text-[var(--text-muted)] truncate">{match.stage}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{venue ?? "TBD"}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">Matchday {match.matchday}</p>
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

export default function StagesPage(){
    const { stage } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawPage = Number(searchParams.get("page") ?? 1);

    const [matches, setMatches] = useState<Match[]>([]);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(Math.max(1, rawPage));
    const [loading, setLoading] = useState(false);
 
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const fetchMatches = async (page: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches/stages/${stage}?page=${page}`);
            const data = await res.json();

            if (!res.ok){
                setError(data.error ?? "Something went wrong.");
                return;
            }

            setMatches(data.matches ?? []);
            setTotal(data.total ?? 0);
        } catch (e) {
            setError("Failed to load stages. Please try again.");
        } finally {
            setLoading(false);
        }
    }
 
    useEffect(() => {
        fetchMatches(page);
    }, [page]);

    useEffect(() => {
        if (total === 0) return;
        if (rawPage <= 0) {
            router.replace(`?page=1`);
            setPage(1);
        } else if (rawPage > totalPages) {
            router.replace(`?page=${totalPages}`);
            setPage(totalPages);
        }
    }, [total]);
 
    const handlePageChange = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
        router.push(`?page=${p}`);  
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    
    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 2000);
        return () => clearTimeout(timer);
    }, [error]);

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="relative min-h-screen text-[var(--text-primary)] flex flex-col">
            <img src="/images/details-ball-sport.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" />
            <div className="fixed inset-0 bg-black/75 -z-10" />

            {/* ── header ── */}
            <div className="border-b border-[var(--border)] bg-[var(--bg-primary)] backdrop-blur sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">{stage}</h1>
                    {!error && (
                    <p className="text-s text-[var(--text-muted)] mt-0.5">
                        Showing {start}-{end} of {total}
                    </p>
                    )}
                </div>
                </div>
            </div>
    
            {/* ── body ── */}
            <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-7 z-10">
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/50 border border-red-700/40 text-[var(--text-primary)] text-sm">
                        <span className="text-lg">⚠</span>
                        {error}
                    </div>
                )}

                {loading && matches.length === 0 && !error && (
                    <div className="text-center py-16 text-[var(--text-muted)]">
                        <p className="font-semibold">Please wait a moment. Loading matches...</p>
                    </div>
                )}
        
                {matches.map((m) => <MatchCard key={m.id} match={m} />)}
        
                {!loading && matches.length === 0 && !error && (
                    <div className="text-center py-16 text-[var(--text-primary)]">
                        <p className="text-4xl mb-3">🏟</p>
                        <p className="font-semibold">No matches found.</p>
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
        </div>
    );
}