import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { checkContent } from "@/utils/flagContent";
import { processMatchSentiment } from "@/utils/match_sentiment";

// Browse posts inside threadId 
export async function GET(request, context){
    let { id } = await context.params;
    const threadId = Number(id);

    if (isNaN(threadId)){
        return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const thread = await prisma.thread.findUnique({
        where: {
            id: threadId,
        }
    })

    if (!thread){
        return NextResponse.json({ error: "Thread does not exist" }, { status: 400 });
    }

    const posts = await prisma.thread.findMany({
        where: {
            id: threadId
        }, 
        select: {
            id: true,
            posts: {
                include: {
                    replies: true,
                }
            }
        }
    });

    return NextResponse.json(posts);
}

// Create post inside threadId
export async function POST(request, context){
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized - No token found" }, { status: 401 });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.userId;

    let { id } = await context.params;
    const threadId = Number(id);

    if (isNaN(threadId)){
        return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: {id: userId}
    })

    if (!user || user.is_banned){
        return NextResponse.json({ error: "User does not exist or is banned" }, { status: 400 });
    }
    
    const thread = await prisma.thread.findUnique({
        where: {
            id: threadId,
        },
        include: { 
            match: true 
        }
    });

    if (!thread){
        return NextResponse.json({ error: "Thread does not exist" }, { status: 400 });
    }

    if (thread.isOpen == false){
        return NextResponse.json({ error: "Thread is closed, cannot add new posts" }, { status: 404 });
    }

    if (!thread.isVisible){
        return NextResponse.json({ error: "This is a hidden thread" }, { status: 404 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== "string"){
        return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const ai_analysis = await checkContent(content);
    const aiScore = ai_analysis.find(item => item.label === "toxic").score;
    const aiVerdict = aiScore > 0.8 ? "Inappropriate Content" : "CLEAN";

    const post = await prisma.post.create({
        data: {
            content: content,
            userid: userId,
            threadId: thread.id,
            aiVerdict: aiVerdict,
            aiScore: aiScore,
        }
    });

    //if the thread is a match thread, the post will update the sentiment score
    if (thread.matchId && thread.match) {
        await processMatchSentiment(prisma, { 
            content, 
            userId, 
            matchId: thread.match.id 
        });
    }

    if (aiScore > 0.8) {
        await prisma.report.create({
            data: {
                postId: post.id,
                isAIGenerated: true,
                reason: "AI flagged as inappropriate content",
                aiVerdict: aiVerdict,
                aiScore: aiScore
            }
        });
    }
    return NextResponse.json(post);
}