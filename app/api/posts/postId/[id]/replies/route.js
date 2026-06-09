import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import jwt from "jsonwebtoken";
import { checkContent } from "@/utils/flagContent";

// Get replies for postId
export async function GET(request, context){
    let { postId: postIdParam } = await context.params;
    const postId = Number(postIdParam);

    if (isNaN(postId)){
        return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        }
    })

    if (!post){
        return NextResponse.json({ error: "Post does not exist" }, { status: 400 });
    }

    const replies = await prisma.reply.findMany({
        where: {
            postId: postId
        }
    });

    return NextResponse.json(replies);
}

// Create reply for postId
export async function POST(request, context){
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const userId = decoded.userId;

    const { content } = await request.json();

    let { id } = await context.params;
    const postId = Number(id);

    if (isNaN(postId)){
        return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: {id: userId}
    })

    if (!user || user.is_banned){
        return NextResponse.json({ error: "User does not exist or is banned" }, { status: 400 });
    }
    
    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        },
        include: {thread: true}
    })

    if (!post){
        return NextResponse.json({ error: "Post does not exist" }, { status: 400 });
    }

    if (!content || typeof content !== "string"){
        return NextResponse.json({ error: "Reply must have content" }, { status: 400 });
    }

    if (post.thread.isOpen === false){
        return NextResponse.json({ error: "Discussion thread is closed, cannot reply to post" }, { status: 400 });
    }

    const ai_analysis = await checkContent(content);
    const aiScore = ai_analysis.find(item => item.label === "toxic").score;
    const aiVerdict = aiScore > 0.8 ? "Inappropriate Content" : "CLEAN";

    const reply = await prisma.reply.create({
        data: {
            content: content,
            post: { connect: { id: postId } },
            user: { connect: { id: userId } },
            aiVerdict: aiVerdict,
            aiScore: aiScore
        },
        include: {
            user: { select: { username: true } }
        }
    });

    if (aiScore > 0.8) {
        await prisma.report.create({
            data: {
                replyId: reply.id,
                isAIGenerated: true,
                reason: "AI flagged as inappropriate content",
                aiVerdict: aiVerdict,
                aiScore: aiScore
            }
        });
    }
    return NextResponse.json(reply);
}
