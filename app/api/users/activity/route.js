import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("userId");

    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const currentDate = new Date();
    const startDate = new Date(); 
    startDate.setDate(currentDate.getDate() - 30);

    try {
        const [posts, replies] = await Promise.all([
            prisma.post.findMany({
                where: { 
                    userid: Number(id), 
                    createdAt: { gte: startDate } 
                },
                select: { createdAt: true },
            }),
            prisma.reply.findMany({
                where: { 
                    userid: Number(id), 
                    createdAt: { gte: startDate } 
                },
                select: { createdAt: true },
            }),
        ]);

        //map count to date for the last 30 days 
        const activityMap = {};
        for (let i = 0; i <= 30; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toISOString().split("T")[0];
            activityMap[dateStr] = { date: dateStr, posts: 0, replies: 0 };
        }

        posts.forEach(p => {
            const dateStr = p.createdAt.toISOString().split("T")[0];
            if (activityMap[dateStr]) activityMap[dateStr].posts++;
        });

        replies.forEach(r => {
            const dateStr = r.createdAt.toISOString().split("T")[0];
            if (activityMap[dateStr]) activityMap[dateStr].replies++;
        });

        const chartData = Object.values(activityMap).sort((a, b) => 
            a.date.localeCompare(b.date)
        );

        return NextResponse.json(chartData);

    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}