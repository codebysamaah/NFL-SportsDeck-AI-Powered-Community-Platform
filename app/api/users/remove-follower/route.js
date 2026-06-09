import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(request) {
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

    const followerId = decoded.userId;

    const { targetId } = await request.json();

    if (!targetId || typeof targetId !== "number") {
        return NextResponse.json({ error: "Incorrect targetId, must be a number" }, { status: 400 });
    }

    if (followerId === targetId) {
        return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }
    try {
        const targetUser = await prisma.user.findUnique({ where: { id: Number(targetId) } });
        if (!targetUser) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 });
        }
        const deleteResult = await prisma.userFollow.deleteMany({
            where: {
                followerId: Number(targetId),
                followingId: Number(followerId),
            },
        });
        
        if (deleteResult.count === 0) {
            return NextResponse.json({ error: "This user was not following you" }, { status: 400 });
        }
        return NextResponse.json({ message: "Successfully removed follower" });

    }
    catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}