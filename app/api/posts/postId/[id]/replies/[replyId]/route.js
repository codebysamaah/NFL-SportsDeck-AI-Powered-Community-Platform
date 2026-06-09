import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { checkContent } from "@/utils/flagContent";

// Get reply with replyId
export async function GET(request, context){
    let { id, replyId } = await context.params;
    replyId = Number(replyId);

    if (!replyId){
        return NextResponse.json({ error: "replyId is missing" }, { status: 400 });
    }

    const reply = await prisma.reply.findUnique({
        where: { id: replyId },
        include: { post: { include: { thread: true } } }
    });

    if (!reply || !reply.isVisible) {
        return NextResponse.json({ error: "Reply not found or hidden" }, { status: 404 });
    }

    return NextResponse.json(reply);
}

// Edit reply in postId
export async function PATCH(request, context){
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    let { id, replyId } = await context.params;
    replyId = Number(replyId);
    id = Number(id);

    const post = await prisma.post.findUnique({
        where: {
            id: id,
        }
    });

    if (!post){
        return NextResponse.json({ error: "Post does not exist" }, { status: 400 });
    }

    const { content } = await request.json();
   
    if (!replyId){
        return NextResponse.json({ error: "replyId is missing" }, { status: 400 });
    }

    if (!content || typeof content !== "string"){
        return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
    }

    const reply = await prisma.reply.findUnique({
        where: {
            id: replyId,
        }, 
        include: {
            post: {
                include: {
                    thread: true,
                }
            }
        }
    });

    if (!reply){
        return NextResponse.json({ error: "Reply does not exist!" }, { status: 404 });
    }

    if (reply.post.thread.isOpen === false){
        return NextResponse.json({ error: "Discussion thread is closed, cannot edit reply" }, { status: 400 });
    }

    if (reply.userid !== userId) {
        return NextResponse.json({ error: "Forbidden: You cannot edit this reply" }, { status: 403 });
    }

    let aiVerdict = reply.aiVerdict;
    let aiScore = reply.aiScore;

    if (reply.content !== content) {
        if (reply.aiScore > 0.8) {
            await prisma.report.deleteMany({
                where: { replyId: replyId, isAIGenerated: true }
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

    await prisma.replyVersion.create({
        data: {
            replyId: replyId,
            content: reply.content,
            editedBy: userId,
        }
    });

    const updated_reply = await prisma.reply.update({
        where: { id: replyId },
        data: {
            content: content || reply.content,
            aiVerdict: aiVerdict,
            aiScore: aiScore,
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

    return NextResponse.json(updated_reply);
}

// Delete reply
export async function DELETE(request, context) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const userId = decoded.userId;
    const role = decoded.role;

    let { id, replyId } = await context.params;
    replyId = Number(replyId);

    if (!replyId) {
        return NextResponse.json({ error: "replyId is missing" }, { status: 400 });
    }

    const reply = await prisma.reply.findUnique({
        where: { id: replyId },
        include: { post: { include: { thread: true } } }
    });

    if (!reply || !reply.isVisible) {
        return NextResponse.json({ error: "Reply not found or hidden" }, { status: 404 });
    }

    if (reply.post.thread.isOpen == false) {
        return NextResponse.json({ error: "Discussion thread is closed, cannot delete reply" }, { status: 400 });
    }

    if (reply.userid !== userId && role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: You cannot delete this reply" }, { status: 403 });
    }

    await prisma.reply.delete({
        where: { id: replyId }
    });

    return NextResponse.json({ message: "Reply successfully deleted!" }, { status: 200 });
}