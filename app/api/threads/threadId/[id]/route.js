import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import jwt from "jsonwebtoken";

// Get thread with threadId
export async function GET(request, context) {
    const { id } = await context.params;
    const threadId = new Number(id);

    if (isNaN(threadId)){
        return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const thread = await prisma.thread.findUnique({
        where: {
            id: parseInt(threadId, 10),
        }, 
        include: {
            posts: {
                where: { isVisible: true },
                include: {
                    user: { select: { username: true } },
                    replies: {
                        where: { isVisible: true },
                        include: {
                            user: { select: { username: true } }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            },
            tags: true,
        }
    });

    if (!thread){
        return NextResponse.json({ error: "Thread does not exist" }, { status: 400 });
    }

    return NextResponse.json(thread);
}

// Edit thread with threadId
export async function PATCH(request, context){
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const role = decoded.role;

    const { title, isOpen, tags, teamId, matchId } = await request.json();

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

    if (!thread || !thread.isVisible) {
        return NextResponse.json({ error: "Thread not found or hidden" }, { status: 404 });
    }

    if (thread.userid !== userId && role != "ADMIN") {
        return NextResponse.json({ error: "Forbidden: You cannot edit this thread" }, { status: 403 });
    }

    if (!thread.isOpen && role != "ADMIN"){
        return NextResponse.json({ error: "Discussion thread is closed, cannot edit threads" }, { status: 403 });
    }

    const update_data = {};

    if (title !== undefined && title !== null && title !== "") {
        if (typeof title !== "string"){
            return NextResponse.json({ error: "Invalid title" }, { status: 400 });
        }
        update_data.title = title;
    }

    if (isOpen !== null && isOpen !== undefined) {
        if (typeof isOpen !== "boolean"){
            return NextResponse.json({ error: "isOpen must be boolean" }, { status: 400 });
        }
        update_data.isOpen = isOpen;
    }

    if (teamId !== null && teamId !== undefined) {
        const team = await prisma.team.findUnique({
            where: {
                id: teamId,
            }
        })

        if (!team){
            return NextResponse.json({ error: "Team does not exist" }, { status: 400 });
        }
        update_data.teamId = teamId;
    }

    if (matchId !== null && matchId !== undefined) {
        const match = await prisma.match.findUnique({
            where: {
                id: matchId,
            }
        })

        if (!match){
            return NextResponse.json({ error: "Match does not exist" }, { status: 400 });
        }
        update_data.matchId = matchId;
    }

    const updated_thread = await prisma.thread.update({
        where: {
            id: threadId
        }, 
        data: update_data,
    });

    if (tags !== null & tags != undefined){
        if (!Array.isArray(tags)){
            return NextResponse.json({ error: "Tag must be an array of strings" }, { status: 404 });   
        }
        
        for (const tagName of tags){
            if (typeof tagName !== "string") continue;

            let tag = await prisma.tag.findFirst({
                where: {
                    name: tagName,
                    threadId: threadId,
                }
            });

            if (!tag){
                await prisma.tag.create({
                    data: {
                        name: tagName,
                        threadId: threadId,
                    }
                });
            }
        }
    }

    const final_thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { tags: true },
    });

    if (!final_thread || !final_thread.isVisible) {
        return NextResponse.json({ error: "Thread not found or hidden" }, { status: 404 });
    }

    return NextResponse.json(final_thread);
}

// Delete thread with threadId
export async function DELETE(request, context){
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const userId = decoded.userId;
    const role = decoded.role;

    let { id } = await context.params;
    const threadId = Number(id);

    if (isNaN(threadId)){
        return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const thread = await prisma.thread.findUnique({
        where: {
            id: threadId,
        }
    });

    if (!thread || !thread.isVisible) {
        return NextResponse.json({ error: "Thread not found or hidden" }, { status: 404 });
    }

    if (thread.userid !== userId && role != "ADMIN") {
        return NextResponse.json({ error: "Forbidden: You cannot delete this thread" }, { status: 403 });
    }

    if (!thread.isOpen && role != "ADMIN"){
        return NextResponse.json({ error: "Discussion thread is closed, cannot delete" }, { status: 403 });
    }

    await prisma.thread.delete({
        where: {
            id: threadId,
        }
    });

    return NextResponse.json({ message: "Thread successfully deleted!" }, { status: 200 })
}