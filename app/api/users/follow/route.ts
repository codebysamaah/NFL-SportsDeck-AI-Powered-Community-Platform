import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const followerId: number = payload.userId;
  const { targetId }: { targetId: number } = await request.json();

  if (!targetId || typeof targetId !== "number")
    return NextResponse.json({ error: "Incorrect targetId, must be a number" }, { status: 400 });

  if (followerId === targetId)
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });

  try {
    const follower = await prisma.user.findUnique({ where: { id: followerId } });
    if (!follower) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (follower.is_banned) return NextResponse.json({ error: "You cannot follow a new user if you are banned" }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetId,
        },
      },
    });

    if (existingFollow)
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });

    await prisma.userFollow.create({
      data: { followerId, followingId: targetId },
    });

    return NextResponse.json({ message: "Successfully followed user" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}