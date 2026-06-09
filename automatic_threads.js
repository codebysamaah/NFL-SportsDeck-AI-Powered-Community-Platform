import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function automatic_threads() {
    const now = new Date();

    const res1 = await fetch(
        "https://api.football-data.org/v4/competitions/DED/matches",
        {
        headers: {
            "X-Auth-Token": process.env.FOOTBALL_API_KEY,
        },
        cache: "no-store",
        }
    );

    if (!res1.ok) {
       console.error("Failed to fetch matches from football-data API");
       return;
    }

    const data1 = await res1.json();
    const matches = data1.matches;

    // const teamIds = new Set();
    // for (const apiMatch of matches) {
    //     teamIds.add(apiMatch.homeTeam.id);
    //     teamIds.add(apiMatch.awayTeam.id);
    // }

    // const venueMap = new Map();
    // for (const teamId of teamIds) {
    //     const existing = await prisma.team?.findFirst({
    //         where:  { externalId: teamId },
    //         select: { venue: true },
    //     });

    //     if (existing?.venue) {
    //         venueMap.set(teamId, existing.venue);
    //         continue;
    //     }

    //     const teamRes = await fetch(
    //         `https://api.football-data.org/v4/teams/${teamId}`,
    //         {
    //             headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY },
    //         }
    //     );

    //     if (teamRes.ok) {
    //         const teamData = await teamRes.json();
    //         venueMap.set(teamId, teamData.venue ?? null);
    //     } else {
    //         venueMap.set(teamId, null);
    //     }
    // }

    for (const match of matches) {
        const matchDate = new Date(match.utcDate);
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        // const homeVenue = venueMap.get(match.homeTeam.id) ?? null;

        if (matchDate > now && matchDate <= twoWeeksLater){
            const homeTeam = await prisma.team.upsert({
                where: { externalId: match.homeTeam.id },
                update: { logo: match.homeTeam.crest, name: match.homeTeam.name },
                create: {
                    externalId: match.homeTeam.id,
                    name: match.homeTeam.name,
                    logo: match.homeTeam.crest,
                    venue: match.venue,
                },
            });

            const awayTeam = await prisma.team.upsert({
                where: { externalId: match.awayTeam.id },
                update: { logo: match.awayTeam.crest, name: match.awayTeam.name },
                create: {
                    externalId: match.awayTeam.id,
                    name: match.awayTeam.name,
                    logo: match.awayTeam.crest,
                },
            });

            await prisma.match.upsert({
                where: { externalId: match.id },
                update: {
                    homeScore: match.score.fullTime.home ?? null,
                    awayScore: match.score.fullTime.away ?? null,
                    status: match.status,
                    matchday: match.matchday,
                    datetime: new Date(match.utcDate),
                    stage: match.stage,
                    lastUpdatedAt: new Date(),
                    venue: match.venue,
                },
                create: {
                    externalId: match.id,
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    venue: match.venue,
                    stage: match.stage,
                    datetime: new Date(match.utcDate),
                    status: match.status,
                    matchday: match.matchday,
                },
            });

            const dbMatch = await prisma.match.findUnique({
                where:  { externalId: match.id },
                select: { id: true },
            });

            const existingThread = await prisma.thread.findFirst({
                where: { matchId: dbMatch?.id },
            });

            if (dbMatch && !existingThread){
                const thread = await prisma.thread.create({
                    data: {
                        matchId: dbMatch.id,
                        title: `Discussion: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
                    },
                });

                await prisma.match.update({
                    where: { externalId: match.id },
                    data: { threadId: thread.id },
                });
            }
        }

        const twoWeeksAfter = new Date(matchDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        if (now > twoWeeksAfter) {
            const thread = await prisma.thread.findFirst({
                where: { matchId: match.id },
            });

            if (thread && thread.isOpen === true) {
                await prisma.thread.update({
                    where: { id: thread.id },
                    data: { isOpen: false },
                });
            }
        }
    }
}
