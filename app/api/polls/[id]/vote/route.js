import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Vote in poll 
export async function PATCH(request, context) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    const { id } = await context.params;
    const pollId = Number(id);

    if (isNaN(pollId)){
        return NextResponse.json({ error: "Invalid poll ID" }, { status: 400 });
    }

    const { option } = await request.json();
    if (!option){
        return NextResponse.json({ error: "Option is required" }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({ 
        where: { 
            id: pollId 
        },
        include: { 
            thread: true,
            options: true,
        } 
    });

    if (!poll || !poll.thread.isVisible) {
        return NextResponse.json({ error: "Poll not found or thread is hidden" }, { status: 404 });
    }

    if (new Date() > poll.deadline) {
        return NextResponse.json({ error: "Voting closed" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: {id: userId}
    })

    if (!user || user.is_banned){
        return NextResponse.json({ error: "User does not exist or is banned" }, { status: 400 });
    }
    
    const existingVote = await prisma.vote.findFirst({
        where: { 
          userid: userId,
          pollId: pollId, 
        }
    });

    if (existingVote) {
        return NextResponse.json({ error: "User already voted" }, { status: 400 });
    }

    const selectedOption = poll.options.find((o) => o.id === option || o.text === option);
    if (!selectedOption) {
        return NextResponse.json({ error: "Invalid vote, option not in poll" }, { status: 400 });
    }

    const vote = await prisma.vote.create({
        data: {
            userid: userId,
            pollId: pollId,
            optionId: selectedOption.id,
        }
    });

    return NextResponse.json(vote);
}