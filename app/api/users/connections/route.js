import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request) {
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

    const id = decoded.userId;

    try {
        const followers = await prisma.userFollow.findMany({
            where: { followingId: Number(id) },
            include: { follower: true },
            orderBy: { createdAt: 'desc' }
        });
        const following = await prisma.userFollow.findMany({
            where: { followerId: Number(id) },
            include: { following: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({
            followers: followers.map(f => ({ id: f.follower.id, username: f.follower.username })),
            following: following.map(f => ({ id: f.following.id, username: f.following.username })),
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}