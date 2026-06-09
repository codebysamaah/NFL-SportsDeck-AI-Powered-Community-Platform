import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

// Get replyId edit history
export async function GET(request, context){
    let { id, replyId } = await context.params;
    replyId = Number(replyId);

    if (isNaN(replyId)){
        return NextResponse.json({ error: "Invalid reply ID" }, { status: 400 });
    }

    const versions = await prisma.replyVersion.findMany({
        where: { replyId: replyId },
        orderBy: { editedAt: 'desc' }
    })

    return NextResponse.json(versions);
}
