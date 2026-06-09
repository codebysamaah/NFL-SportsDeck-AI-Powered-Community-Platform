import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const id = decoded.userId;
    try {
        //following list of users
        const following = await prisma.userFollow.findMany({
            where: { followerId: Number(id) },
            include: { following: true }
        });

        //find favorite teams
        const userWithTeams = await prisma.user.findUnique({
            where: { id: Number(id) },
            include: { favoriteTeams: { select: { id: true } } }
        });

        const followingIds = following.map(f => f.followingId);
        const teamIds = userWithTeams?.favoriteTeams.map(t => t.id) || [];
        
        //find threads of favorite teams or users they follow
        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { userid: { in: followingIds } },
                    { thread: { teamId: { in: teamIds } } }
                ]
            },
            include: { user: { select: { username: true, avatar: true } }, thread: true },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        //find recent replies to threads made by user 
        const replies = await prisma.reply.findMany({
            where: { post: { userid: Number(id) } },
            include: { user: { select: { username: true } }, post: { select: { content: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        //find recent matches involving teams they follow
        const matchUpdates = await prisma.match.findMany({
            where: {
                OR: [
                    { homeTeamId: { in: teamIds } },
                    { awayTeamId: { in: teamIds } }
                ]
            },
            include: { homeTeam: true, awayTeam: true },
            orderBy: { lastUpdatedAt: 'desc' },
            take: 5
        });

        return NextResponse.json({ posts, replies, matchUpdates });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}