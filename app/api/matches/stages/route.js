import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

const CACHE_TTL_MS = 60 * 60 * 1000; 

// Get all stages in league
export async function GET(){
    const cache = await prisma.cacheStatus.findUnique({
        where: { key: "stages" },
    });

    const isStale = !cache ||
        (Date.now() - new Date(cache.lastUpdatedAt).getTime()) > CACHE_TTL_MS;

    if (isStale){
        const res = await fetch(
            "https://api.football-data.org/v4/competitions/PD/standings",
            {
                headers: {
                    "X-Auth-Token": process.env.FOOTBALL_API_KEY,
                },
                cache: "no-store",
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch data from football-data API" },
                { status: 500 }
            );
        }

        const data = await res.json();
        const stageNames = data.standings.map(s => s.stage) ?? []; 
        const stages = [...new Set(stageNames)];

        for (const s of stages) {
            await prisma.stage.upsert({
                where:  { name: s },
                update: {},
                create: { name: s },
            });
        }

        await prisma.cacheStatus.upsert({
            where:  { key: "stages" },
            update: { lastUpdatedAt: new Date() },
            create: { key: "stages", lastUpdatedAt: new Date() },
        });

        return NextResponse.json({ stages, total: stages.length });
    }

    const db_stages = await prisma.stage.findMany({
        select:  { name: true },
    });

    const stages = db_stages.map((s) => s.name);
    return NextResponse.json({ stages, total: stages.length });
}
