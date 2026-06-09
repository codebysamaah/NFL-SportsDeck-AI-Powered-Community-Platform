'use client'

import { useEffect, useState } from "react";

interface StandingRow {
    position: number;
    team: {
        id: number;
        name: string;
        crest: string; // The API uses 'crest' for logos
    };
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
}

export default function StandingsPage() {
    const [table, setTable] = useState<StandingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                const res = await fetch('api/matches/standings'); 
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Failed to load standings");
                console.log(data);
                
                setTable(data.table || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
            <p className="text-[var(--text-muted)] animate-pulse">Fetching Standings...</p>
        </div>
    );

    return (
        <div className="relative min-h-screen text-[var(--text-primary)]">
            {/* Background Assets to match your other pages */}
            <img src="/images/details-ball-sport.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" />
            <div className="fixed inset-0 bg-black/70 -z-10" />

            <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-black tracking-tight text-white">Standings</h1>
                </div>

                {error ? (
                    <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/50 text-red-200">
                        {error}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg-card)] backdrop-blur-md shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase tracking-widest text-[var(--text-muted)] bg-white/5">
                                    <tr>
                                        <th className="px-4 py-4 font-bold text-center w-12"></th>
                                        <th className="px-4 py-4 font-bold">Team</th>
                                        <th className="px-4 py-4 font-bold text-center">PL</th>
                                        <th className="px-4 py-4 font-bold text-center hidden sm:table-cell">W</th>
                                        <th className="px-4 py-4 font-bold text-center hidden sm:table-cell">D</th>
                                        <th className="px-4 py-4 font-bold text-center hidden sm:table-cell">L</th>
                                        <th className="px-4 py-4 font-bold text-center">GD</th>
                                        <th className="px-4 py-4 font-bold text-center bg-indigo-500/20">PTS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {table.map((row) => (
                                        <tr key={row.team.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-4 text-center text-[var(--text-muted)] font-mono">
                                                {row.position}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={row.team.crest} 
                                                        alt={row.team.name} 
                                                        className="w-6 h-6 object-contain"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')} 
                                                    />
                                                    <span className="font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                                                        {row.team.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center text-[var(--text-primary)] font-medium">{row.playedGames}</td>
                                            <td className="px-4 py-4 text-center text-[var(--text-muted)] hidden sm:table-cell">{row.won}</td>
                                            <td className="px-4 py-4 text-center text-[var(--text-muted)] hidden sm:table-cell">{row.draw}</td>
                                            <td className="px-4 py-4 text-center text-[var(--text-muted)] hidden sm:table-cell">{row.lost}</td>
                                            <td className={`px-4 py-4 text-center font-bold ${row.goalDifference > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                            </td>
                                            <td className="px-4 py-4 text-center font-black text-[var(--text-primary)] bg-indigo-500/5 group-hover:bg-indigo-500/20">
                                                {row.points}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}