import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

const CACHE_TTL_MS = 60 * 60 * 1000; 

// Get all matchdays in league  
export async function GET() {
    const cache = await prisma.cacheStatus.findUnique({
        where: { key: "matchdays" },
    });
    
    const isStale = !cache ||
        (Date.now() - new Date(cache.lastUpdatedAt).getTime()) > CACHE_TTL_MS;

    if (isStale){
        const res = await fetch(
            "https://api.football-data.org/v4/competitions/DED/matches",
            {
            headers: {
                "X-Auth-Token": process.env.FOOTBALL_API_KEY,
            },
            cache: "no-store",
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch matches from football-data API" },
                { status: 500 }
            );
        }
        
        const data = await res.json();
        const matchdays = [...new Set(data.matches.map((m) => m.matchday))];

        for (const day of matchdays) {
            await prisma.day.upsert({
                where:  { day: day },
                update: {},
                create: { day: day },
            });
        }

        await prisma.cacheStatus.upsert({
            where:  { key: "matchdays" },
            update: { lastUpdatedAt: new Date() },
            create: { key: "matchdays", lastUpdatedAt: new Date() },
        });

        return NextResponse.json({ matchdays, total: matchdays.length });
    }

    const db_matchdays = await prisma.day.findMany({
        orderBy: { day: "asc" },
        select:  { day: true },
    });

    const matchdays = db_matchdays.map((d) => d.day);
    return NextResponse.json({ matchdays, total: matchdays.length });
}