import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Get poll with pollId
export async function GET(request, context){
    const { id } = await context.params;
    const pollId = Number(id);

    if (isNaN(pollId)){
        return NextResponse.json({ error: "Invalid pollId"}, { status: 400 });
    }

    const poll = await prisma.poll.findMany({
        where: {
            id: pollId,
        },
        include: {
            options: true,
        }
    });

    if (!poll){
        return NextResponse.json({ error: "Poll does not exist"}, { status: 404 });
    }

    return NextResponse.json(poll);
}

// Edit poll with pollId
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

    const { question, deadline, options } = await request.json();
   
    const { id } = await context.params;
    const pollId = Number(id);

    if (isNaN(pollId)){
        return NextResponse.json({ error: "Invalid pollId"}, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
        where: {
            id: pollId,
        }, 
        include: {
            thread: true,
        }
    });

    if (!poll){
        return NextResponse.json({ error: "Poll does not exist" }, { status: 404 });
    }

    if (poll.thread.isOpen === false){
        return NextResponse.json({ error: "Discussion thread is closed, cannot edit poll" }, { status: 404 });
    }

    if (poll.userid !== userId) {
        return NextResponse.json({ error: "Forbidden: You cannot edit this poll" }, { status: 403 });
    }

    if (poll.deadline < new Date()){
        return NextResponse.json({ error: "Poll has crossed the deadline, cannot edit" }, { status: 404 });
    }

    if (poll.votes && poll.votes.length > 0){
        return NextResponse.json({ error: "Poll has votes, cannot edit" }, { status: 404 });
    }

    const update_data = {};

    if (question !== undefined){
        if (typeof question !== "string"){
            return NextResponse.json({ error: "Invalid question, must be string" }, { status: 403 });
        }
        update_data.question = question;
    }

    if (options !== undefined){
        if (!Array.isArray(options) || options.length < 2){
            return NextResponse.json({ error: "Options must be an array with at least 2 items" }, { status: 400 });
        }

        update_data.options = {
            deleteMany: {},
            create: options.map(option => ({
                text: option
            }))
        };
    }

    if (deadline !== undefined){
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())){
            return NextResponse.json({ error: "Invalid deadline must be datetime" }, { status: 403 });
        }
        update_data.deadline = deadlineDate;
    }

    const updated_poll = await prisma.poll.update({
        where: {
            id: pollId,
        }, 
        data: update_data,
    });

    return NextResponse.json(updated_poll);
}

// Delete poll
export async function DELETE(request, context){
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

    const { id } = await context.params;
    const pollId = Number(id);
    
    if (isNaN(pollId)){
        return NextResponse.json({ error: "Invalid pollId"}, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
        where: {
            id: pollId,
        }, 
        include: {
            thread: true,
        }
    });

    if (!poll){
        return NextResponse.json({ error: "Poll does not exist" }, { status: 400 });
    }

    if (poll.thread.isOpen === false && role != "ADMIN"){
        return NextResponse.json({ error: "Discussion thread is closed, cannot delete poll" }, { status: 404 });
    }

    if (poll.userid !== userId && role != "ADMIN") {
        return NextResponse.json({ error: "Forbidden: You cannot delete this poll" }, { status: 403 });
    }

    await prisma.poll.delete({
        where: {
            id: pollId,
        }
    })

    return NextResponse.json({ message: "Poll successfully deleted!" }, { status: 200 })
}