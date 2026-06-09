import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

// Get postId edit history
export async function GET(request, context){
    let { id } = await context.params;
    const postId = Number(id);

    if (isNaN(postId)){
        return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const versions = await prisma.postVersion.findMany({
        where: { postId: postId },
        orderBy: { editedAt: 'desc' }  
    })

    return NextResponse.json(versions);
}
