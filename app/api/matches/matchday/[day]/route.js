import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

// Get match info for a specific match day 
export async function GET(request, context){
    const { day } = await context.params;
    const matchday = Number(day);

    if (!matchday || isNaN(matchday) || matchday <= 0 || matchday > 50) {
        return NextResponse.json(
            { error: "Match day must be a valid number or does not exist" },
            { status: 400 }
        );
    }

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
    const skip  = (page - 1) * 10;

    const CACHE_TTL_MS = 60 * 60 * 1000; 

    const cache = await prisma.cacheStatus.findUnique({
        where: { key: "matches" },
    });

    const isStale = !cache ||
        (Date.now() - new Date(cache.lastUpdatedAt).getTime()) > CACHE_TTL_MS;

    if (isStale){
        const res1 = await fetch(
            `https://api.football-data.org/v4/competitions/DED/matches?matchday=${matchday}`,
            {
                headers: {
                    "X-Auth-Token": process.env.FOOTBALL_API_KEY,
                },
                cache: "no-store",
            }
        );

        if (!res1.ok) {
            return NextResponse.json(
                { error: "Failed to fetch match information for given matchday" },
                { status: 500 }
            );
        }

        const data1 = await res1.json();
        const matches = data1.matches;

        const teamIds = new Set();
        for (const apiMatch of matches) {
            teamIds.add(apiMatch.homeTeam.id);
            teamIds.add(apiMatch.awayTeam.id);
        }

        const venueMap = new Map();
        for (const teamId of teamIds) {
            const existing = await prisma.team.findUnique({
                where:  { externalId: teamId },
                select: { venue: true },
            });

            if (existing?.venue) {
                venueMap.set(teamId, existing.venue);
                continue;
            }

            const teamRes = await fetch(
                `https://api.football-data.org/v4/teams/${teamId}`,
                {
                    headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY },
                }
            );

            if (teamRes.ok) {
                const teamData = await teamRes.json();
                venueMap.set(teamId, teamData.venue ?? null);
            } else {
                venueMap.set(teamId, null);
            }
        }
        
        for (const apiMatch of matches) {
            const homeVenue = venueMap.get(apiMatch.homeTeam.id) ?? null;
            const homeTeam = await prisma.team.upsert({
                where: { externalId: apiMatch.homeTeam.id },
                update: {
                    logo: apiMatch.homeTeam.crest
                },
                create: {
                    externalId: apiMatch.homeTeam.id,
                    name: apiMatch.homeTeam.name,
                    logo: apiMatch.homeTeam.crest,
                    venue: homeVenue,
                },
            });

            const awayTeam = await prisma.team.upsert({
                where: { externalId: apiMatch.awayTeam.id },
                update: {
                    logo: apiMatch.awayTeam.crest
                },
                create: {
                    externalId: apiMatch.awayTeam.id,
                    name: apiMatch.awayTeam.name,
                    logo: apiMatch.awayTeam.crest,
                },
            });

            await prisma.match.upsert({
                where: { externalId: apiMatch.id },
                update: {
                    homeScore: apiMatch.score.fullTime.home,
                    awayScore: apiMatch.score.fullTime.away ?? null,
                    status: apiMatch.status,
                    matchday: apiMatch.matchday,
                    datetime: new Date(apiMatch.utcDate),
                    stage: apiMatch.stage,
                    lastUpdatedAt: new Date(),
                    venue: homeVenue,
                },
                create: {
                    externalId: apiMatch.id,
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    venue: homeVenue,
                    stage: apiMatch.stage,
                    datetime: new Date(apiMatch.utcDate),
                    status: apiMatch.status,
                    matchday: apiMatch.matchday,
                },
            });
        }

        await prisma.cacheStatus.upsert({
            where:  { key: "matches" },
            update: { lastUpdatedAt: new Date() },
            create: { key: "matches", lastUpdatedAt: new Date() },
        });
    }

    // Return all matches for this matchday
    const [matches, total] = await Promise.all([
        prisma.match.findMany({
            where: { matchday: parseInt(matchday, 10) },
            skip,
            take: 10,
            orderBy: { datetime: "asc" },
            include: {
                homeTeam: true,
                awayTeam: true,
            },
        }),
        prisma.match.count({ where: { matchday: matchday } })
    ]);

    return NextResponse.json({ matches, total, matchday });
}
