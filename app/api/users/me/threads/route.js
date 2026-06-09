import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import jwt from "jsonwebtoken";

// Get all threads created by user
export async function GET(request){
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid token or feature only available for users." }, { status: 401 });
    }
    
    const userId = decoded.userId;

    const threads = await prisma.thread.findMany({
        where: {
            userid: userId,
        },
    });

    return NextResponse.json(threads);
}