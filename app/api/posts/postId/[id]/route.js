import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { checkContent } from "@/utils/flagContent";

// Get post with postId
export async function GET(request, context) {
    let { id } = await context.params;
    const postId = Number(id);

    if (isNaN(postId)) {
        return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        },
    })

    if (!post || !post.isVisible) {
        return NextResponse.json({ error: "Post does not exist or is hidden" }, { status: 404 });
    }

    return NextResponse.json(post);
}

// Edit post with postId
export async function PATCH(request, context) {
    const token = request.cookies.get("access_token")?.value

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const userId = decoded.userId;

    let { id } = await context.params;
    const postId = Number(id);

    const { content } = await request.json();

    if (!content || typeof content !== "string"){
        return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    if (!postId) {
        return NextResponse.json({ error: "postId is missing" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: {
            id: postId,
        }, 
        include:{
            thread: true,
        }
    });

    if (!post || !post.isVisible) {
        return NextResponse.json({ error: "Post not found or hidden" }, { status: 404 });
    }

    if (post.thread.isOpen == false) {
        return NextResponse.json({ error: "Discussion thread is closed, cannot edit posts" }, { status: 400 });
    }

    if (post.userid !== userId) {
        return NextResponse.json({ error: "Forbidden: You cannot edit this post" }, { status: 403 });
    }

    let aiVerdict = post.aiVerdict;
    let aiScore = post.aiScore;

    if (post.content !== content) {
        if (post.aiScore > 0.8) {
            await prisma.report.deleteMany({
                where: { postId: postId, isAIGenerated: true }
            });
        }
        const ai_analysis = await checkContent(content);
        aiScore = ai_analysis.find(item => item.label === "toxic").score;
        if (aiScore > 0.8) {
            aiVerdict = "Inappropriate Content";
        } else {
            aiVerdict = "CLEAN";
        }
    }

    await prisma.postVersion.create({
        data: {
            postId: postId,
            content: post.content,
            editedBy: userId,
        },
    });

    const updated_post = await prisma.post.update({
        where: { id: postId },
        data: {
            content: content || post.content,
            aiVerdict: aiVerdict,
            aiScore: aiScore,
        }
    });

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

    return NextResponse.json(updated_post);
}

// Delete post with postId
export async function DELETE(request, context) {
    const token = request.cookies.get("access_token")?.value

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const userId = decoded.userId;
    const role = decoded.role;

    let { id } = await context.params;
    const postId = Number(id);

    if (!postId) {
        return NextResponse.json({ error: "postId is missing" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { thread: true }
    });

    if (!post || !post.isVisible) {
        return NextResponse.json({ error: "Post does not exist or is hidden" }, { status: 404 });
    }

    if (post.userid !== userId && role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: You cannot delete this post" }, { status: 403 });
    }

    if (post.thread.isOpen == false && role !== "ADMIN") {
        return NextResponse.json({ error: "Discussion thread is closed, cannot delete posts" }, { status: 400 });
    }

    await prisma.post.delete({
        where: { id: postId }
    });

    return NextResponse.json({ message: "Post successfully deleted!" }, { status: 200 });
}