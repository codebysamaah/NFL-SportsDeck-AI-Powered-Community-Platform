import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

// Get pollId results
export async function GET(request, context) {
    const { id } = await context.params;
    const pollId = Number(id);

    if (isNaN(pollId)){
        return NextResponse.json({ error: "Invalid poll ID" }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
        where: {
            id: pollId,
        },
        include: {
            options: {
                select: {
                    id: true,
                    text: true,
                }
            }
        }
    });

    if (!poll){
        return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.deadline > new Date()){
        return NextResponse.json({ error: "No results yet, poll is still open" }, { status: 404 });
    }

    const votes = await prisma.vote.groupBy({
        by: ["optionId"],
        where: { pollId },
        _count: { optionId: true },
    });

    const results = poll.options.map((opt) => {
        const voteCount = votes.find((v) => v.optionId === opt.id)?._count.optionId || 0;
        return {
            id: opt.id,
            text: opt.text,
            votes: voteCount,
        };
    });

    return NextResponse.json({
        pollId: poll.id,
        question: poll.question,
        options: results,
    });
}