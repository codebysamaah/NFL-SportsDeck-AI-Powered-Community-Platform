'use client'

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 16;

function PaginationButton({onClick, active, children}: {onClick: () => void; active?: boolean; children: React.ReactNode}) {
    return (
        <button
        onClick={onClick}
        className={`
            h-9 min-w-[2.25rem] px-2 rounded-lg text-sm font-semibold transition-all duration-150 select-none
            ${active
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
            : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/60"
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
            <span key={`ellipsis-${i}`} className="text-slate-600 px-1 text-sm select-none">…</span>
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

export default function MatchDaysPage(){
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawPage = Number(searchParams.get("page") ?? 1);
    const [matchdays, setMatchdays] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(Math.max(1, rawPage));
    const [loading, setLoading] = useState(false);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
 
    const paginated = matchdays.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        const fetch_matchdays = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/matches/matchday");
                const data = await res.json();

                if (!res.ok){
                    setError(data.error ?? "Something went wrong.");
                    return;
                }
                
                setMatchdays(data.matchdays ?? []);
                setTotal(data.total ?? 0);
            } catch (e) {
                setError("Failed to load matchdays.");
            } finally {
                setLoading(false);
            }
        };
        fetch_matchdays();
    }, []);

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

            <div className="fixed inset-0 bg-black/70 -z-10" />

            {/* ── header ── */}
            <div className="border-b border-slate-800 bg-[var(--bg-primary)] backdrop-blur sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Matchdays</h1>
                    {!error && (
                    <p className="text-s text-[var(--text-muted)] mt-0.5">
                        Showing {start}–{end} of {total} matchdays 
                    </p>
                    )}
                </div>
                </div>
            </div>
    
            {/* ── body ── */}
            <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 z-10">
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/30 border border-red-700/40 text-slate-200 text-sm mb-6">
                        <span className="text-lg">⚠</span>
                        {error}
                    </div>
                )}

                {loading && matchdays.length === 0 && !error && (
                    <div className="text-center py-16 text-[var(--text-muted)]">
                        <p className="font-semibold">Please wait a moment. Loading matchdays...</p>
                    </div>
                )}
               
                {/* matchday grid */}
                {!loading && !error && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4">
                        {paginated.map((md) => (
                            <button
                                key={md}
                                onClick={() => router.push(`/matchdays/${md}`)}
                                className="h-24 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-orange)] hover:bg-[var(--bg-secondary)] transition-all duration-200 flex flex-col items-center justify-center group"
                            >
                                <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--accent-orange)] font-medium tracking-widest uppercase">MD</span>
                                <span className="text-2xl font-black text-[var(--accent-orange)] group-hover:text-[var(--text-primary)]">{md}</span>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && matchdays.length === 0 && !error && (
                    <div className="text-center py-16 text-[var(--text-muted)]">
                        <p className="text-4xl mb-3">📅</p>
                        <p className="font-semibold">No matchdays found.</p>
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