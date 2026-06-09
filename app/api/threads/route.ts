import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/utils/flagContent";
import { verifyToken } from "@/utils/auth";

// Define the where clause type
interface ThreadWhere {
  isVisible: boolean;
  teamId?: number;
  matchId?: number;
  userid?: number;
  tags?: { some: { name: { contains: string } } };
  title?: { contains: string };
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("team");
    const matchId = url.searchParams.get("match");
    const authorId = url.searchParams.get("author");
    const title = url.searchParams.get("title");
    const tag = url.searchParams.get("tag");

    const page  = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 10));
    const skip  = (page - 1) * 10;

    const where: ThreadWhere = {
        isVisible: true,
    }

    if (teamId) where.teamId = Number(teamId);
    if (matchId) where.matchId = Number(matchId);
    if (authorId) where.userid = Number(authorId);
    if (tag) where.tags = { some: { name: { contains: tag } } };
    if (title) where.title = { contains: title };

    const [threads, total] = await Promise.all([
        prisma.thread.findMany({
            where: { ...where, isVisible: true },
            skip,
            take: limit,
            include: {
                posts: {
                    where: { isVisible: true },
                    include: {
                        replies: {
                            where: { isVisible: true },
                            include: { user: { select: { username: true } } }
                        },
                        user: { select: { username: true } }
                    }
                },
                tags: true,
            }
        }),
        prisma.thread.count({ where })
    ]);

    return NextResponse.json({ threads, total });
}

export async function POST(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "You must be logged in to post a thread" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "You must be logged in to post a thread" }, { status: 401 });

    const userId: number = payload.userId;

    const { title, content, tags, teamId }: { 
        title: string; 
        content: string; 
        tags?: string[]; 
        teamId?: number 
    } = await request.json();

    if (!title || typeof title !== "string")
        return NextResponse.json({ error: "Invalid title, must be string" }, { status: 400 });

    if (!content || typeof content !== "string")
        return NextResponse.json({ error: "Invalid content, must be string" }, { status: 400 });

    if (tags && !Array.isArray(tags))
        return NextResponse.json({ error: "Invalid tags, must be array of strings" }, { status: 400 });

    if (teamId) {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return NextResponse.json({ error: "Team does not exist" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.is_banned)
        return NextResponse.json({ error: "User does not exist or is banned" }, { status: 400 });

    const thread = await prisma.thread.create({
        data: { title, teamId: teamId ?? null, userid: userId }
    });

    const ai_analysis = await checkContent(content);
    const aiScore: number = ai_analysis.find((item: { label: string; score: number }) => item.label === "toxic")?.score ?? 0;
    const aiVerdict: string = aiScore > 0.8 ? "Inappropriate Content" : "CLEAN";

    await prisma.post.create({
        data: { content, userid: userId, threadId: thread.id, aiVerdict, aiScore }
    });

    if (aiScore > 0.8) {
        await prisma.report.create({
            data: {
                threadId: thread.id,
                isAIGenerated: true,
                reason: "AI flagged as inappropriate content",
                aiVerdict,
                aiScore
            }
        });
    }

    if (tags) {
        for (const tagName of tags) {
            const existing = await prisma.tag.findFirst({ where: { name: tagName, threadId: thread.id } });
            if (!existing) {
                await prisma.tag.create({ data: { name: tagName, threadId: thread.id } });
            }
        }
    }

    const new_thread = await prisma.thread.findUnique({
        where: { id: thread.id },
        include: { tags: true }
    });

    return NextResponse.json(new_thread);
}