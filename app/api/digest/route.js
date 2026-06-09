import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { generateDigest } from "@/utils/digest_generator";

export async function GET() {

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        //see if we already have a digest for today
        const existingDigest = await prisma.dailyDigest.findUnique({
            where: { date: today },
        });

        if (existingDigest) {
            return NextResponse.json({ content: existingDigest.content });
        }

        // Fetch Data - We want the 3 most recent threads and matches, sorted by last activity/updated time
        const [recentThreads, recentMatches] = await Promise.all([
            prisma.thread.findMany({
                orderBy: { lastActivityAt: 'desc' }, 
                take: 3
            }),
            prisma.match.findMany({
                orderBy: { lastUpdatedAt: 'desc' },
                take: 3,
                include: { homeTeam: true, awayTeam: true }
            })
        ]);

        const threadSection = recentThreads.map(t => 
            `- "${t.title}" (Activity: ${t.lastActivityAt})`
        ).join('\n');

        const matchSection = recentMatches.map(m => 
            `- ${m.homeTeam?.name} vs ${m.awayTeam?.name}: ${m.homeScore ?? 0}-${m.awayScore ?? 0}`
        ).join('\n');

        const dataBlob = `Matches:\n${matchSection}\n\nThreads:\n${threadSection}`.trim();

        const newDigest = await generateDigest(dataBlob);

        // save new digest to database
        const savedDigest = await prisma.dailyDigest.upsert({
            where: { date: today },
            update: { content: newDigest },
            create: { date: today, content: newDigest },
        });

        return NextResponse.json({ content: savedDigest.content });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}