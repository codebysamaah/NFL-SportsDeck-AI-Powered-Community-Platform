import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Browse polls within a thread
export async function GET(request){
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    const polls = await prisma.poll.findMany({
        where: threadId ? { threadId: Number(threadId) } : {},
        include: {
            options: {
                include: {
                    votes: true,
                }
            },
            votes: true,
        }
    });
    
    return NextResponse.json(polls);
}

// Create poll
export async function POST(request){
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    const { threadId, question, deadline, options } = await request.json();

    if (!threadId || typeof threadId !== "number"){
        return NextResponse.json({ error: "Incorrect threadId, must be a number" }, { status: 400 });
    }

    if (!question || typeof question !== "string"){
        return NextResponse.json({ error: "Incorrect question, must be a string" }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);
    if (!deadline || isNaN(deadlineDate.getTime())){
        return NextResponse.json({ error: "Incorrect deadline, must be datetime" }, { status: 400 });
    }

    if (!options || options.length < 2){
        return NextResponse.json({ error: "Options must be array with at least 2 choices" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: {id: userId}
    })

    if (!user || user.is_banned){
        return NextResponse.json({ error: "User does not exist or is banned" }, { status: 404 });
    }
    
    const thread = await prisma.thread.findUnique({
        where: {
            id: threadId
        }
    })

    if (!thread || !thread.isVisible) {
        return NextResponse.json({ error: "Thread not found or hidden" }, { status: 404 });
    } else if (thread.isOpen === false){
        return NextResponse.json({ error: "Discussion thread is closed, cannot do a poll" }, { status: 400 });
    }

    const poll = await prisma.poll.create({
        data: {
            userid: userId,
            threadId: threadId,
            question: question,
            deadline: deadlineDate,
            options: {
                create: options.map(text => ({ text }))
            }
        }, 
        include: {
            options: true,
        }
    });

    return NextResponse.json(poll);
}
