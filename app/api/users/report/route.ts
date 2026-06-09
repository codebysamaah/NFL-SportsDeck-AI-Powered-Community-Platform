import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {verifyToken} from "@/utils/auth"

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try{
    const reporterid = await prisma.user.findUnique({where: {id:payload.userId }})
    if (!reporterid || reporterid.is_banned){return NextResponse.json({ error: "user does not exist or is banned" }, { status: 401 })}

    const { postId, threadId,replyId, reason  } = await request.json();

    if (postId ===undefined && threadId===undefined){
        return NextResponse.json({ error: "must report a post, reply or thread" }, { status: 401 })
    }
    if (reason === undefined ){
         return NextResponse.json({ error: "must have a reason" }, { status: 401 })
    }


    const content = postId ? 
        (await prisma.post.findUnique({ where: { id: postId } }))?.content :
        replyId ?
        (await prisma.reply.findUnique({ where: { id: replyId } }))?.content :
        (await prisma.thread.findUnique({ where: { id: threadId } }))?.title;

    let aiScore = 0;
    let aiVerdict = "CLEAN";

    if (postId) {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { aiScore: true, aiVerdict: true } });
        if (post) { aiScore = post.aiScore; aiVerdict = post.aiVerdict; }
    } else if (replyId) {
        const reply = await prisma.reply.findUnique({ where: { id: replyId }, select: { aiScore: true, aiVerdict: true } });
        if (reply) { aiScore = reply.aiScore; aiVerdict = reply.aiVerdict; }
    } else if (threadId) {
        const thread = await prisma.thread.findUnique({ where: { id: threadId }, select: { posts: { take: 1, orderBy: { createdAt: "asc" }, select: { aiScore: true, aiVerdict: true } } } });
        if (thread?.posts?.[0]) { aiScore = thread.posts[0].aiScore; aiVerdict = thread.posts[0].aiVerdict; }
    }

    const rep = await prisma.report.create({
        

    data: {
        reporterid: Number(payload.userId),
        postId: postId || null,
        threadId: threadId || null,
        replyId: replyId || null,
        reason,
        aiVerdict,
        aiScore
    },
        select: {
            id: true,
            reporterid: true,
            post: true,
            thread: true,
            reply:true,
            reason: true,
            aiVerdict: true,
            aiScore: true
        },
        });

        return NextResponse.json({ rep });
    
    }
  catch(e){  return NextResponse.json({error: "not updated"}, {status: 400})}}
